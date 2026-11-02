from typing import Optional
from pydantic import BaseModel, Field



class EmotionAnalysisResponse(BaseModel):
    status: str
    emotion: Optional[str] = None
    confidence: Optional[float] = None
    message: Optional[str] = None
    emotion_probs: Optional[dict[str, float]] = None
    model: Optional[str] = None



from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    title: str = Field(
        default="New Conversation",
        min_length=1,
        max_length=200
    )


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str

class MessageCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=5000
    )
    input_type: str = Field(
        default="text",
        pattern="^(text|audio)$"
    )