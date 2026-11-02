import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.services.emotion_service import emotion_service
from backend.services.audio_inference import analyze_voice
from backend.api.schemas import EmotionAnalysisResponse

router = APIRouter(prefix="/emotion", tags=["Emotion Analysis"])


class TextAnalysisRequest(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=5000,
        description="Text submitted for emotion analysis",
    )


@router.post("/text", response_model=EmotionAnalysisResponse)
def analyze_text(request: TextAnalysisRequest):
    return emotion_service.analyze_text(request.text)


@router.post("/audio")
async def analyze_audio(file: UploadFile = File(...)):
    allowed_extensions = {".wav", ".mp3", ".m4a", ".ogg", ".flac"}

    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format.",
        )

    temp_path = None

    try:
        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded audio file is empty.",
            )

        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Audio file exceeds the 20 MB limit.",
            )

        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            delete=False,
        ) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        result = analyze_voice(
            temp_path,
            language="english",
        )

        return {
            "status": "success",
            **result,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Audio analysis failed: {type(exc).__name__}: {exc}",
        ) from exc

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        await file.close()
