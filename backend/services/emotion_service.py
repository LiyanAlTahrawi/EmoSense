
import html
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "models" / "text_emotion"

LABELS = ["angry", "happy", "sad", "fearful", "disgust", "neutral"]

MAX_LENGTH = 128
W_DEBERTA = 0.40
W_ROBERTA = 0.60

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def clean_text(text: str) -> str:
    # Same text preprocessing used during training.
    text = html.unescape(text)
    text = unicodedata.normalize("NFKC", text)

    text = re.sub(r"(https?://\S+|www\.\S+)", " ", text, flags=re.I)
    text = re.sub(r"@\w+", " ", text)
    text = re.sub(
        r"\[(name|religion|url|user|link|person)\]",
        " ", text, flags=re.I
    )
    text = re.sub(r"#(\w+)", r"\1", text)
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^rt\s+", "", text, flags=re.I)
    text = text.strip(" '\"“”‘’`")

    return text.lower()


@lru_cache(maxsize=1)
def load_models():
    loaded = {}

    for name in ("deberta", "roberta"):
        folder = MODELS_DIR / f"{name}_best"

        if not folder.is_dir():
            raise FileNotFoundError(f"Missing model folder: {folder}")

        tokenizer = AutoTokenizer.from_pretrained(
            str(folder),
            local_files_only=True,
        )

        model = AutoModelForSequenceClassification.from_pretrained(
            str(folder),
            local_files_only=True,
        )

        actual_labels = [
            model.config.id2label[i]
            for i in range(len(LABELS))
        ]

        if actual_labels != LABELS:
            raise ValueError(
                f"{name} label mismatch: {actual_labels}"
            )

        model = model.to(DEVICE).eval()
        loaded[name] = (model, tokenizer)

    return loaded


def predict_probabilities(model, tokenizer, text):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LENGTH,
    ).to(DEVICE)

    with torch.inference_mode():
        logits = model(**inputs).logits
        probabilities = torch.softmax(logits.float(), dim=-1)[0]

    return probabilities.cpu()


class EmotionService:

    def analyze_text(self, text: str) -> dict:
        cleaned = clean_text(text)

        if not cleaned:
            return {
                "status": "invalid_input",
                "message": "Text is empty after preprocessing.",
                "emotion": None,
                "confidence": None,
            }

        models = load_models()

        deberta_model, deberta_tokenizer = models["deberta"]
        roberta_model, roberta_tokenizer = models["roberta"]

        deberta_probs = predict_probabilities(
            deberta_model, deberta_tokenizer, cleaned
        )

        roberta_probs = predict_probabilities(
            roberta_model, roberta_tokenizer, cleaned
        )

        # Original validation-selected ensemble weights.
        final_probs = (
            W_DEBERTA * deberta_probs
            + W_ROBERTA * roberta_probs
        )

        predicted_id = int(final_probs.argmax())
        confidence = float(final_probs[predicted_id])

        return {
            "status": "success",
            "emotion": LABELS[predicted_id],
            "confidence": round(confidence, 4),
            "emotion_probs": {
                label: round(float(prob), 4)
                for label, prob in zip(LABELS, final_probs)
            },
            "model": "DeBERTa + RoBERTa Ensemble",
        }


emotion_service = EmotionService()
