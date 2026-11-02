from pathlib import Path
import os, gc, json, hashlib, subprocess, tempfile, warnings
import numpy as np
import pandas as pd
import soundfile as sf
import librosa
import torch
import joblib
from tqdm.auto import tqdm

from funasr import AutoModel                                  # Emotion2Vec+
from transformers import AutoFeatureExtractor, WavLMModel      # WavLM
from transformers import pipeline as hf_pipeline               # Whisper
from sklearn.base import clone
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

warnings.filterwarnings("ignore")
SEED = 42
np.random.seed(SEED); torch.manual_seed(SEED)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
SR = 16000          # كل الموديلات (Emotion2Vec, WavLM, Whisper) بتشتغل على 16kHz
MAX_SEC = 20        # قص الصوت الطويل لتجنب OOM في WavLM


from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIO_ROOT = ROOT / "audio_data"
LABELS_CSV = AUDIO_ROOT / "train-label.csv"
TEST_CSV = None
OUT_DIR = ROOT / "models" / "audio_cache"
OUT_DIR.mkdir(parents=True, exist_ok=True)


LABELS = ["angry", "happy", "sad", "fearful", "disgust", "neutral"]
label2id = {x: i for i, x in enumerate(LABELS)}
id2label = {i: x for x, i in label2id.items()}

print("GPU:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")

"""## 2) Audio utilities — accept **any** format, not only `.wav`
Browsers/phones record compressed audio (`webm/opus`, `m4a/aac`, `ogg`...). We decode everything with **ffmpeg** to the one format all models expect: **WAV, mono, 16 kHz, PCM16**.
"""

AUDIO_EXTS = {".wav", ".mp3", ".m4a", ".mp4", ".aac", ".ogg", ".oga", ".opus",
              ".webm", ".flac", ".3gp", ".amr", ".caf", ".wma"}

def to_wav16k(src, dst=None):
    """أي صيغة صوت → ملف WAV mono 16kHz (هاي نفس الخطوة اللي بيعملها السيرفر لتسجيل المايك)"""
    if dst is None:
        fd, dst = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    cmd = ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", str(src),
           "-ac", "1", "-ar", str(SR), "-sample_fmt", "s16", str(dst)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {src}: {r.stderr.strip()[:300]}")
    return str(dst)

def _ffmpeg_decode(path):
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", str(path),
           "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {path}: {r.stderr.decode(errors='ignore')[:300]}")
    return np.frombuffer(r.stdout, np.int16).astype(np.float32) / 32768.0

def load_audio(path, max_sec=MAX_SEC):
    """قراءة أي ملف صوت كـ numpy float32 mono 16kHz (soundfile سريع لل WAV، و ffmpeg لأي صيغة ثانية)"""
    path = str(path)
    wav = None
    if path.lower().endswith(".wav"):
        try:
            wav, sr = sf.read(path, dtype="float32", always_2d=True)
            wav = wav.mean(1)                                   # stereo → mono
            if sr != SR:
                wav = librosa.resample(wav, orig_sr=sr, target_sr=SR)
        except Exception:
            wav = None
    if wav is None:
        wav = _ffmpeg_decode(path)
    if max_sec:
        wav = wav[: int(max_sec * SR)]
    return wav.astype(np.float32)

"""## 3) Load TRAIN labels & find the unlabeled TEST files"""

df = pd.read_csv(LABELS_CSV)[["file_id", "label"]].copy()
df["file_id"] = df["file_id"].astype(str).str.strip()
df["label"] = df["label"].astype(str).str.lower().str.strip()
assert set(df["label"]) <= set(LABELS), f"Unknown labels: {set(df['label']) - set(LABELS)}"

audio_files = [p for p in AUDIO_ROOT.rglob("*") if p.suffix.lower() in AUDIO_EXTS]
audio_map = {p.stem: str(p) for p in audio_files}

df["path"] = df["file_id"].map(audio_map)
assert df["path"].isna().sum() == 0, "Some labeled audio files are missing."

# ---- TEST = ملفات بدون label، ما بناخد ولا عينة من ال train ----
labeled_ids = set(df["file_id"])
if TEST_CSV:
    test_ids = pd.read_csv(TEST_CSV)["file_id"].astype(str).str.strip().tolist()
else:
    test_ids = sorted(k for k in audio_map if k not in labeled_ids)
test_df = pd.DataFrame({"file_id": test_ids})
test_df["path"] = test_df["file_id"].map(audio_map)
assert test_df["path"].isna().sum() == 0, "Some test files are missing."
assert not (set(test_df["file_id"]) & labeled_ids), "Test contains labeled files!"

print("Audio files found :", len(audio_files))
print("Labeled (train)   :", len(df))
print("Unlabeled (test)  :", len(test_df))
print("\nTrain label distribution:\n", df["label"].value_counts())

"""## 4) Remove duplicate / conflicting audio (SHA256) + check TEST ↔ TRAIN overlap"""

def file_hash(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def cached_hashes(frame, cache_file, desc):
    if cache_file.exists():
        h = pd.read_csv(cache_file)
        hmap = dict(zip(h["file_id"].astype(str), h["hash"]))
        if set(frame["file_id"]) <= set(hmap):
            return frame["file_id"].map(hmap)
    hashes = [file_hash(p) for p in tqdm(frame["path"], desc=desc)]
    pd.DataFrame({"file_id": frame["file_id"], "hash": hashes}).to_csv(cache_file, index=False)
    return pd.Series(hashes, index=frame.index)

df["hash"] = cached_hashes(df, OUT_DIR / "audio_hashes.csv", "Hash train audio")
conflict = df.groupby("hash")["label"].nunique().loc[lambda s: s > 1].index
print("Conflicting exact-audio groups:", len(conflict))
df = df[~df["hash"].isin(conflict)].drop_duplicates(subset=["hash"], keep="first").reset_index(drop=True)
print("Usable labeled samples:", len(df))

test_df["hash"] = cached_hashes(test_df, OUT_DIR / "test_audio_hashes.csv", "Hash test audio")
print("Test files identical to a training file:", int(test_df["hash"].isin(set(df["hash"])).sum()))

y = df["label"].map(label2id).values

"""## 5) Split the **labeled** data only: TRAIN 85% / VALIDATION 15%
The unlabeled TEST set stays completely separate.
"""

idx = np.arange(len(df))
train_idx, val_idx = train_test_split(idx, test_size=0.15, stratify=y, random_state=SEED)
all_idx = idx   # للتدريب النهائي على كل ال labeled data بعد اختيار أفضل موديل

print("Train     :", len(train_idx))
print("Validation:", len(val_idx))
print("Test (unlabeled, separate):", len(test_df))

"""## 6) Shared helpers: feature caching + SVM training / evaluation (same for both models → fair comparison)"""

def extract_cached(desc, ids, paths, fn, cache_file):
    """استخراج features مع cache على Drive عشان ما نعيد الاستخراج كل مرة"""
    ids = np.asarray(ids).astype(str)
    if cache_file.exists():
        z = np.load(cache_file, allow_pickle=False)
        if np.array_equal(z["file_ids"].astype(str), ids):
            print("Loaded cache:", cache_file.name)
            return {k: z[k] for k in z.files if k != "file_ids"}
        print("Cache does not match current data → re-extracting", cache_file.name)
    outs = [fn(p) for p in tqdm(list(paths), desc=desc)]
    res = {k: np.vstack([o[k] for o in outs]).astype(np.float32) for k in outs[0]}
    np.savez_compressed(cache_file, file_ids=ids, **res)
    return res

PARAM_GRID = {"svm__C": [1, 3, 10], "svm__gamma": ["scale", 0.001, 0.003]}
CV = StratifiedKFold(n_splits=3, shuffle=True, random_state=SEED)

def make_pipe(n_features):
    return Pipeline([
        ("scale", StandardScaler()),
        ("pca", PCA(n_components=min(256, n_features, len(train_idx) - 1), random_state=SEED)),
        ("svm", SVC(kernel="rbf", probability=True, class_weight="balanced",
                    random_state=SEED, cache_size=2000)),
    ])

def metrics(y_true, y_pred):
    return accuracy_score(y_true, y_pred), f1_score(y_true, y_pred, average="macro")

def train_and_validate(name, X, native=None):
    Xtr, ytr, Xva, yva = X[train_idx], y[train_idx], X[val_idx], y[val_idx]

    # 1) GridSearch على TRAIN فقط
    grid = GridSearchCV(make_pipe(X.shape[1]), PARAM_GRID, scoring="f1_macro", cv=CV, n_jobs=-1, verbose=1)
    grid.fit(Xtr, ytr)
    best = grid.best_estimator_

    # 2) out-of-fold probabilities على TRAIN → Train-CV accuracy + ضبط alpha بدون ما نلمس ال validation
    oof = cross_val_predict(clone(best), Xtr, ytr, cv=CV, method="predict_proba", n_jobs=-1)
    alpha = 1.0
    if native is not None:
        alphas = np.round(np.arange(0.50, 1.001, 0.05), 2)
        scores = {a: f1_score(ytr, (a * oof + (1 - a) * native[train_idx]).argmax(1), average="macro") for a in alphas}
        alpha = float(max(reversed(list(scores)), key=scores.get))   # عند التعادل نفضّل alpha الأكبر

    def blend(p, rows):
        return p if native is None else alpha * p + (1 - alpha) * native[rows]

    tr_acc, tr_f1 = metrics(ytr, blend(best.predict_proba(Xtr), train_idx).argmax(1))
    cv_acc, cv_f1 = metrics(ytr, blend(oof, train_idx).argmax(1))
    va_pred = blend(best.predict_proba(Xva), val_idx).argmax(1)
    va_acc, va_f1 = metrics(yva, va_pred)

    print("=" * 60)
    print(name, "| best params:", grid.best_params_, "| alpha:", alpha)
    print(f"TRAIN      Accuracy {tr_acc:.4f} | Macro-F1 {tr_f1:.4f}   (fit data)")
    print(f"TRAIN-CV   Accuracy {cv_acc:.4f} | Macro-F1 {cv_f1:.4f}   (3-fold out-of-fold)")
    print(f"VALIDATION Accuracy {va_acc:.4f} | Macro-F1 {va_f1:.4f}   (held-out)")
    print("=" * 60)
    print(classification_report(yva, va_pred, target_names=LABELS, digits=4))
    display(pd.DataFrame(confusion_matrix(yva, va_pred), index=LABELS, columns=LABELS))

    res = {"model": name, "best_params": str(grid.best_params_), "alpha": alpha,
           "train_acc": tr_acc, "train_f1": tr_f1, "train_cv_acc": cv_acc, "train_cv_f1": cv_f1,
           "val_acc": va_acc, "val_f1": va_f1}
    return res, best

RESULTS, MODELS = [], {}

"""## 7) Model 1 — Emotion2Vec+ Large (frozen) → SVM
Features = 1024-dim utterance embedding + 6 native class probabilities (1030 dims). Reuses your existing feature cache.
"""

e2v = AutoModel(model="emotion2vec/emotion2vec_plus_large", hub="hf", device=DEVICE,
                disable_update=True, disable_pbar=True)   # disable_pbar يوقف ال log الطويل لكل ملف

NATIVE_MAP = {"angry": "angry", "happy": "happy", "sad": "sad", "fearful": "fearful",
              "disgusted": "disgust", "disgust": "disgust", "neutral": "neutral"}

def e2v_features(path):
    """Emotion2Vec: embedding + احتمالات المودل الأصلية بعد تحويلها لل 6 classes"""
    tmp = None
    if Path(path).suffix.lower() != ".wav":          # أي صيغة غير wav → نحولها أول
        tmp = path = to_wav16k(path)
    try:
        r = e2v.generate(str(path), granularity="utterance", extract_embedding=True)[0]
    finally:
        if tmp: os.remove(tmp)
    emb = np.asarray(r["feats"], dtype=np.float32).reshape(-1)
    native = np.zeros(len(LABELS), dtype=np.float32)
    names = [str(x).split("/")[-1].lower().strip() for x in r.get("labels", [])]
    scores = np.asarray(r.get("scores", []), dtype=np.float32).reshape(-1)
    for n, s in zip(names, scores):
        if n in NATIVE_MAP:
            native[label2id[NATIVE_MAP[n]]] += float(s)
    native = native / native.sum() if native.sum() > 0 else np.full(len(LABELS), 1 / len(LABELS), np.float32)
    return {"X": np.concatenate([emb, native]), "native": native}

e2v_train = extract_cached("Emotion2Vec features (labeled)", df["file_id"], df["path"],
                           e2v_features, OUT_DIR / "emotion2vec_large_features.npz")
X_e2v, native_e2v = e2v_train["X"], e2v_train["native"]
print("Emotion2Vec features:", X_e2v.shape)

res, est = train_and_validate("Emotion2Vec+ Large", X_e2v, native=native_e2v)
RESULTS.append(res)
MODELS["Emotion2Vec+ Large"] = {"estimator": est, "X": X_e2v, "native": native_e2v, "alpha": res["alpha"],
                                "fn": e2v_features, "cache": "emotion2vec_large"}

"""## 8) Model 2 — WavLM Large (frozen) → SVM
WavLM is a general speech model (not emotion-specific), so we pool its **middle/upper layers (7–18)**, which carry the most paralinguistic (tone) information, and take **mean + std over time** → 2048 dims.
"""

WAVLM_ID = "microsoft/wavlm-large"
WAVLM_LAYERS = list(range(7, 19))
wavlm_fe = AutoFeatureExtractor.from_pretrained(WAVLM_ID)
wavlm = WavLMModel.from_pretrained(WAVLM_ID).to(DEVICE).eval()

@torch.no_grad()
def wavlm_features(path):
    wav = load_audio(path, max_sec=MAX_SEC)
    if len(wav) < SR // 2:                                   # أقصر من نص ثانية → padding
        wav = np.pad(wav, (0, SR // 2 - len(wav)))
    inp = wavlm_fe(wav, sampling_rate=SR, return_tensors="pt").input_values.to(DEVICE)
    hs = wavlm(inp, output_hidden_states=True).hidden_states   # 25 × (1, T, 1024)
    h = torch.stack([hs[i] for i in WAVLM_LAYERS]).mean(0)[0]  # معدل الطبقات → (T, 1024)
    return {"X": torch.cat([h.mean(0), h.std(0)]).float().cpu().numpy()}

wavlm_train = extract_cached("WavLM features (labeled)", df["file_id"], df["path"],
                             wavlm_features, OUT_DIR / "wavlm_large_L7-18_meanstd_features.npz")
X_wavlm = wavlm_train["X"]
print("WavLM features:", X_wavlm.shape)

res, est = train_and_validate("WavLM Large", X_wavlm, native=None)
RESULTS.append(res)
MODELS["WavLM Large"] = {"estimator": est, "X": X_wavlm, "native": None, "alpha": 1.0,
                         "fn": wavlm_features, "cache": "wavlm_large_L7-18_meanstd"}

"""## 9) Model 1 vs Model 2 (winner = best **Validation Macro-F1**)"""

cmp = pd.DataFrame(RESULTS).set_index("model")
display(cmp[["train_acc", "train_cv_acc", "val_acc", "train_f1", "train_cv_f1", "val_f1", "best_params", "alpha"]].round(4))
cmp.to_csv(OUT_DIR / "model_comparison.csv")

WINNER = cmp["val_f1"].idxmax()
print("Winner:", WINNER)

"""## 10) Final model: retrain winner on **all labeled data** (train+val) → predict the unlabeled TEST → export
Hyper-parameters stay the ones chosen on TRAIN; the test set is only predicted, never used for fitting.
"""

cfg = MODELS[WINNER]
final_clf = clone(cfg["estimator"]).fit(cfg["X"][all_idx], y[all_idx])

test_feats = extract_cached(f"{WINNER} features (test)", test_df["file_id"], test_df["path"],
                            cfg["fn"], OUT_DIR / f"{cfg['cache']}_test_features.npz")
p = final_clf.predict_proba(test_feats["X"])
if cfg["native"] is not None:
    p = cfg["alpha"] * p + (1 - cfg["alpha"]) * test_feats["native"]

pred = pd.DataFrame(p, columns=[f"p_{l}" for l in LABELS]).round(4)
pred.insert(0, "file_id", test_df["file_id"].values)
pred.insert(1, "pred_label", [LABELS[i] for i in p.argmax(1)])
pred.insert(2, "confidence", p.max(1).round(4))
pred.to_csv(OUT_DIR / "test_predictions.csv", index=False)
print(pred["pred_label"].value_counts())
display(pred.head())

BUNDLE = {"backbone": WINNER, "svm_pipeline": final_clf, "alpha": cfg["alpha"], "labels": LABELS,
          "sr": SR, "max_sec": MAX_SEC, "wavlm_layers": WAVLM_LAYERS}
export_path = OUT_DIR / "audio_emotion_classifier.joblib"
joblib.dump(BUNDLE, export_path)
print("Saved:", export_path)

"""## 11) How live recording works in real apps (ChatGPT-style voice input)
Apps don't record `.wav` in the browser — they record **compressed audio** and the **server converts it**:

1. **Browser / phone** records with `MediaRecorder` → Chrome/Firefox/Android give `audio/webm;codecs=opus`, Safari/iOS gives `audio/mp4` (AAC).
2. The recording (a `Blob`) is uploaded to the backend as `multipart/form-data`.
3. **Backend** runs `ffmpeg` → WAV mono 16 kHz (our `to_wav16k`), then runs the models.

```js
// Frontend (minimal)
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const rec = new MediaRecorder(stream);          // webm/opus or mp4 depending on browser
const chunks = [];
rec.ondataavailable = e => chunks.push(e.data);
rec.onstop = async () => {
  const blob = new Blob(chunks, { type: rec.mimeType });
  const form = new FormData();
  form.append("audio", blob, "voice." + (rec.mimeType.includes("mp4") ? "m4a" : "webm"));
  const res = await fetch("/analyze", { method: "POST", body: form });
  console.log(await res.json());                 // {transcript, emotion, reply ...}
};
rec.start();  // ... later: rec.stop()
```
So supporting only `.wav` in training is fine — **the conversion happens at the input of the pipeline**, which is exactly what `analyze_voice()` below does.

## 12) Speech-to-Text — Whisper large-v3-turbo (multilingual, handles Arabic & English)
"""

ASR_ID = "openai/whisper-large-v3-turbo"
asr = hf_pipeline("automatic-speech-recognition", model=ASR_ID,
                  torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
                  device=0 if DEVICE == "cuda" else -1)

def transcribe(wav, language=None):
    """wav: numpy 16kHz mono. language=None → Whisper بيكشف اللغة لحاله (مثلاً 'arabic' أو 'english')"""
    gk = {"task": "transcribe"}
    if language:
        gk["language"] = language
    out = asr({"raw": wav, "sampling_rate": SR}, chunk_length_s=30, batch_size=8, generate_kwargs=gk)
    return out["text"].strip()

"""## 13) One voice in → one analysis out (tone **and** words) → payload for the LLM API"""

clf = BUNDLE["svm_pipeline"]

def analyze_voice(path, language=None, min_conf=0.45):
    """
    1) أي صيغة → WAV 16kHz
    2) تحليل النبرة (Emotion)
    3) تحليل الكلام (Speech-to-Text)
    """
    wav_path = to_wav16k(path)
    try:
        wav = load_audio(wav_path, max_sec=None)
        # ---- 1) النبرة ----
        if BUNDLE["backbone"] == "Emotion2Vec+ Large":
            f = e2v_features(wav_path)
            probs = BUNDLE["alpha"] * clf.predict_proba(f["X"][None])[0] + (1 - BUNDLE["alpha"]) * f["native"]
        else:
            probs = clf.predict_proba(wavlm_features(wav_path)["X"][None])[0]
        # ---- 2) الكلام ----
        text = transcribe(wav, language)
    finally:
        os.remove(wav_path)

    top = int(np.argmax(probs))
    return {
        "transcript": text,
        "emotion": LABELS[top] if probs[top] >= min_conf else "uncertain",
        "emotion_confidence": round(float(probs[top]), 4),
        "emotion_probs": {l: round(float(v), 4) for l, v in zip(LABELS, probs)},
        "duration_sec": round(len(wav) / SR, 2),
        "tone_model": BUNDLE["backbone"],
    }

def build_llm_payload(a):
    """اللي بينبعث لل API (أي LLM): الكلام + النبرة كإشارة مساعدة"""
    system = ("You are a supportive assistant. You receive the user's spoken words (transcript) and an "
              "automatic estimate of their vocal emotion. Reply mainly to what they said; use the emotion "
              "as a soft signal to adjust your tone. If the words and the tone disagree (e.g. 'I'm fine' "
              "said sadly), gently acknowledge it. Never state the detected emotion as a certain fact.")
    user = (f'User said: "{a["transcript"]}"\n'
            f'[Vocal tone estimate: {a["emotion"]} (confidence {a["emotion_confidence"]:.0%})]')
    return {"system": system, "messages": [{"role": "user", "content": user}], "analysis": a}
