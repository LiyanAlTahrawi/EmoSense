from pathlib import Path
import os
import subprocess
import tempfile

import joblib
import librosa
import numpy as np
import soundfile as sf
import torch

from funasr import AutoModel
from transformers import pipeline


# Project paths
ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "models" / "audio_emotion_classifier.joblib"

# Emotion labels: preserve the original training order
LABELS = ["angry", "happy", "sad", "fearful", "disgust", "neutral"]

NATIVE_MAP = {
    "angry": "angry",
    "happy": "happy",
    "sad": "sad",
    "fearful": "fearful",
    "disgusted": "disgust",
    "disgust": "disgust",
    "neutral": "neutral",
}

SR = 16000


if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Saved audio classifier not found: {MODEL_PATH}"
    )

# Load the already-trained classifier. No training is performed.
BUNDLE = joblib.load(MODEL_PATH)
CLF = BUNDLE["svm_pipeline"]
ALPHA = float(BUNDLE["alpha"])

# Load Emotion2Vec+ once
EMOTION_MODEL = AutoModel(
    model="emotion2vec/emotion2vec_plus_large",
    hub="hf",
    device="cpu",
    disable_update=True,
    disable_pbar=True,
)

# Load Whisper once
ASR = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-large-v3-turbo",
    torch_dtype=torch.float32,
    device=-1,
)


def prepare_wav(source_path: Path) -> Path:
    """Convert the input into temporary mono, 16 kHz WAV."""
    source_path = source_path.resolve()

    if not source_path.is_file():
        raise FileNotFoundError(f"Audio file not found: {source_path}")

    fd, temp_name = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    temp_path = Path(temp_name)

    try:
        subprocess.run(
            [
                "ffmpeg", "-nostdin", "-y",
                "-loglevel", "error",
                "-i", str(source_path),
                "-ac", "1",
                "-ar", str(SR),
                "-sample_fmt", "s16",
                str(temp_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        return temp_path

    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def extract_emotion_features(wav_path: Path):
    """Extract Emotion2Vec embedding and native emotion probabilities."""
    result = EMOTION_MODEL.generate(
        str(wav_path),
        granularity="utterance",
        extract_embedding=True,
    )[0]

    embedding = np.asarray(
        result["feats"], dtype=np.float32
    ).reshape(-1)

    native = np.zeros(len(LABELS), dtype=np.float32)

    names = [
        str(label).split("/")[-1].lower().strip()
        for label in result.get("labels", [])
    ]

    scores = np.asarray(
        result.get("scores", []), dtype=np.float32
    ).reshape(-1)

    label_to_index = {label: i for i, label in enumerate(LABELS)}

    for name, score in zip(names, scores):
        mapped = NATIVE_MAP.get(name)
        if mapped is not None:
            native[label_to_index[mapped]] += float(score)

    total = float(native.sum())
    if total > 0:
        native /= total
    else:
        native[:] = 1.0 / len(LABELS)

    features = np.concatenate([embedding, native])

    expected = getattr(CLF, "n_features_in_", None)
    if expected is not None and len(features) != expected:
        raise ValueError(
            f"Feature mismatch: model expects {expected} features, "
            f"but extraction produced {len(features)}."
        )

    return features, native


def analyze_voice(audio_path: str, language: str = "english"):
    """Transcribe English speech and predict vocal emotion."""
    wav_path = prepare_wav(Path(audio_path))

    try:
        audio, sample_rate = sf.read(
            str(wav_path), dtype="float32"
        )

        if audio.ndim > 1:
            audio = audio.mean(axis=1)

        if sample_rate != SR:
            audio = librosa.resample(
                audio, orig_sr=sample_rate, target_sr=SR
            )

        if len(audio) == 0:
            raise ValueError("The audio file is empty.")

        features, native_probs = extract_emotion_features(wav_path)

        svm_probs = CLF.predict_proba(features.reshape(1, -1))[0]

        # Preserve the original model's probability blending.
        probabilities = (
            ALPHA * svm_probs
            + (1.0 - ALPHA) * native_probs
        )

        probabilities = np.clip(probabilities, 0.0, 1.0)
        probabilities /= probabilities.sum()

        # English transcription
        transcription = ASR(
            {"raw": audio, "sampling_rate": SR},
            generate_kwargs={
                "task": "transcribe",
                "language": language,
            },
        )["text"].strip()

        top_index = int(np.argmax(probabilities))
        confidence = float(probabilities[top_index])

        return {
            "transcript": transcription,
            "emotion": (
                LABELS[top_index] if confidence >= 0.45
                else "uncertain"
            ),
            "emotion_confidence": round(confidence, 4),
            "emotion_probs": {
                label: round(float(prob), 4)
                for label, prob in zip(LABELS, probabilities)
            },
            "duration_sec": round(len(audio) / SR, 2),
            "tone_model": BUNDLE["backbone"],
        }

    finally:
        # Remove the temporary converted audio.
        wav_path.unlink(missing_ok=True)
