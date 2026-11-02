from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from backend.services.emotion_service import emotion_service
from backend.api.dependencies import get_current_user
from backend.database.dependencies import get_user_supabase_client
from backend.api.schemas import ConversationCreate
import os
from uuid import UUID
import tempfile
from pathlib import Path
from backend.services.llm_service import llm_service
from fastapi import File, UploadFile
from backend.services.audio_inference import analyze_voice
from backend.database.admin_client import get_admin_supabase_client
import logging
from postgrest.exceptions import APIError

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_conversation(
    request: ConversationCreate,
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    response = (
        client.table("conversations")
        .insert({
            "user_id": user.id,
            "title": request.title
        })
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create conversation."
        )

    return {
        "status": "success",
        "conversation": response.data[0]
    }

@router.get("/")
def get_my_conversations(
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    response = (
        client.table("conversations")
        .select("id, user_id, title, created_at, updated_at")
        .order("updated_at", desc=True)
        .execute()
    )

    return {
        "status": "success",
        "conversations": response.data
    }


from pydantic import BaseModel, Field


class ConversationRename(BaseModel):
    title: str = Field(min_length=1, max_length=200)


@router.patch("/{conversation_id}")
def rename_conversation(
    conversation_id: UUID,
    request: ConversationRename,
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    new_title = request.title.strip()

    if not new_title:
        raise HTTPException(
            status_code=400,
            detail="Conversation title cannot be empty."
        )

    response = (
        client.table("conversations")
        .update({"title": new_title})
        .eq("id", str(conversation_id))
        .eq("user_id", str(user.id))
        .select("id, user_id, title, created_at, updated_at")
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    return {
        "status": "success",
        "conversation": response.data[0]
    }


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: UUID,
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    response = (
        client.table("conversations")
        .delete()
        .eq("id", str(conversation_id))
        .eq("user_id", str(user.id))
        .select("id")
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found or deletion not permitted."
        )

    return {
        "status": "success",
        "message": "Conversation deleted successfully."
    }


@router.delete("/")
def delete_all_conversations(
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    response = (
        client.table("conversations")
        .delete()
        .eq("user_id", str(user.id))
        .select("id")
        .execute()
    )

    return {
        "status": "success",
        "deleted_count": len(response.data or [])
    }


from backend.api.schemas import MessageCreate


@router.post(
    "/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED
)
def create_message(
    conversation_id: UUID,
    request: MessageCreate,
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    # 1. Verify conversation ownership.
    conversation_response = (
        client.table("conversations")
        .select("id")
        .eq("id", str(conversation_id))
        .eq("user_id", str(user.id))
        .execute()
    )

    if not conversation_response.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    # 2. This endpoint currently handles text messages only.
    # Audio requires the voice inference pipeline.
    if request.input_type != "text":
        raise HTTPException(
            status_code=400,
            detail="Use the audio message endpoint for voice input."
        )

    if not request.content or not request.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Message content cannot be empty."
        )

    # 3. Analyze the message using the trained text ensemble.
    analysis = emotion_service.analyze_text(request.content)

    if analysis["status"] != "success":
        raise HTTPException(
            status_code=422,
            detail="Text emotion analysis was unsuccessful."
        )

    # 4. Save the user's message.
    message_response = (
        client.table("messages")
        .insert({
            "conversation_id": str(conversation_id),
            "role": "user",
            "content": request.content,
            "input_type": "text"
        })
        .select("id, conversation_id, role, content, input_type, created_at")
        .execute()
    )

    if not message_response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to save message."
        )

    message = message_response.data[0]

    # 5. Save the emotion analysis linked to the message.
    analysis_response = (
        client.table("message_analysis")
        .insert({
            "message_id": message["id"],
            "transcript": None,
            "predicted_emotion": analysis["emotion"],
            "emotion_confidence": analysis["confidence"],
            "emotion_probabilities": analysis["emotion_probs"],
            "model_name": analysis["model"],
            "model_version": None
        })
        .select("id, message_id, predicted_emotion, emotion_confidence, emotion_probabilities, model_name")
        .execute()
    )

    if not analysis_response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to save emotion analysis."
        )

    return {
        "status": "success",
        "message": message,
        "analysis": analysis_response.data[0]
    }



@router.get("/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: UUID,
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    # 1. Verify that the conversation belongs to the user.
    conversation = (
        client.table("conversations")
        .select("id")
        .eq("id", str(conversation_id))
        .eq("user_id", str(user.id))
        .execute()
    )

    if not conversation.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    # 2. Retrieve messages in chronological order.
    messages_response = (
        client.table("messages")
        .select(
            "id, conversation_id, role, content, "
            "input_type, created_at"
        )
        .eq("conversation_id", str(conversation_id))
        .order("created_at", desc=False)
        .execute()
    )

    messages = messages_response.data or []

    if not messages:
        return {
            "status": "success",
            "messages": []
        }

    # 3. Retrieve analyses for these messages.
    message_ids = [message["id"] for message in messages]

    analyses_response = (
        client.table("message_analysis")
        .select(
            "id, message_id, transcript, "
            "predicted_emotion, emotion_confidence, "
            "emotion_probabilities, model_name, "
            "model_version, created_at"
        )
        .in_("message_id", message_ids)
        .execute()
    )

    analyses = analyses_response.data or []

    # 4. Match every analysis to its message.
    analysis_by_message = {
        analysis["message_id"]: analysis
        for analysis in analyses
    }

    for message in messages:
        message["analysis"] = analysis_by_message.get(
            message["id"]
        )

    return {
        "status": "success",
        "messages": messages
    }


@router.post(
    "/{conversation_id}/audio",
    status_code=status.HTTP_201_CREATED
)
async def create_audio_message(
    conversation_id: UUID,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    # Verify that this conversation belongs to the authenticated user.
    conversation = (
        client.table("conversations")
        .select("id")
        .eq("id", str(conversation_id))
        .eq("user_id", str(user.id))
        .execute()
    )

    if not conversation.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    # Validate uploaded file.
    suffix = Path(file.filename or "").suffix.lower()
    allowed = {".wav", ".mp3", ".m4a", ".ogg", ".flac"}

    if suffix not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format."
        )

    temp_path = None

    try:
        content = await file.read(20 * 1024 * 1024 + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Empty audio file."
            )

        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Audio file exceeds the 20 MB limit."
            )

        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            delete=False
        ) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        # Analyze vocal tone and transcribe speech.
        analysis = analyze_voice(
            temp_path,
            language="english"
        )

        transcript = analysis["transcript"]

        # Store the transcript as the user's message.
        message_response = (
            client.table("messages")
            .insert({
                "conversation_id": str(conversation_id),
                "role": "user",
                "content": transcript,
                "input_type": "audio",
                "audio_path": None
            })
            .select(
                "id, conversation_id, role, content, "
                "input_type, created_at"
            )
            .execute()
        )

        if not message_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save audio message."
            )

        message = message_response.data[0]

        # Save tone-based emotion analysis.
        analysis_response = (
            client.table("message_analysis")
            .insert({
                "message_id": message["id"],
                "transcript": transcript,
                "predicted_emotion": analysis["emotion"],
                "emotion_confidence": analysis["emotion_confidence"],
                "emotion_probabilities": analysis["emotion_probs"],
                "model_name": analysis["tone_model"],
                "model_version": None
            })
            .select(
                "id, message_id, transcript, "
                "predicted_emotion, emotion_confidence, "
                "emotion_probabilities, model_name"
            )
            .execute()
        )

        if not analysis_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save audio emotion analysis."
            )

        return {
            "status": "success",
            "message": message,
            "analysis": analysis_response.data[0]
        }

    except HTTPException:
        raise

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        await file.close()


@router.post("/{conversation_id}/reply")
def generate_conversation_reply(
    conversation_id: UUID,
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    # Verify conversation ownership.
    conversation = (
        client.table("conversations")
        .select("id")
        .eq("id", str(conversation_id))
        .eq("user_id", str(user.id))
        .execute()
    )

    if not conversation.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    # Load recent conversation messages.
    response = (
        client.table("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", str(conversation_id))
        .order("created_at", desc=True)
        .limit(13)
        .execute()
    )

    messages = list(reversed(response.data or []))

    if not messages:
        raise HTTPException(
            status_code=400,
            detail="Conversation has no messages."
        )

    last_message = messages[-1]

    # Prevent generating another reply when the last
    # message already belongs to the assistant.
    if last_message["role"] != "user":
        raise HTTPException(
            status_code=409,
            detail="No unanswered user message found."
        )


    # Check whether this user message already has a reply.
    existing_reply = (
        client.table("messages")
        .select("id")
        .eq("conversation_id", str(conversation_id))
        .eq("role", "assistant")
        .eq("reply_to_message_id", last_message["id"])
        .limit(1)
        .execute()
    )

    if existing_reply.data:
        raise HTTPException(
            status_code=409,
            detail="This message already has an assistant reply."
        )


    # Retrieve the last user's detected emotion.
    analysis_response = (
        client.table("message_analysis")
        .select("predicted_emotion")
        .eq("message_id", last_message["id"])
        .limit(1)
        .execute()
    )

    analyses = analysis_response.data or []
    emotion = (
        analyses[0]["predicted_emotion"]
        if analyses else None
    )

    history = [
        {
            "role": msg["role"],
            "content": msg["content"]
        }
        for msg in messages[:-1]
        if msg["role"] in {"user", "assistant"}
    ]

    # Generate the assistant response using Gemini.

    try:
        reply = llm_service.generate_response(
            user_message=last_message["content"],
            emotion=emotion,
            conversation_history=history
        )
    except Exception as exc:
        import logging

        logging.getLogger(__name__).exception(
            "Gemini response generation failed"
        )

        raise HTTPException(
            status_code=502,
            detail="AI response generation failed."
        ) from exc


    # Save assistant reply in Supabase.
   
    # Save the AI-generated reply using a trusted
    # backend-only Supabase client.
    # Conversation ownership was verified earlier.
    
    # Save the assistant reply using the backend-only client.
    admin_client = get_admin_supabase_client()

    try:
        saved_response = (
            admin_client.table("messages")
            .insert({
                "conversation_id": str(conversation_id),
                "role": "assistant",
                "content": reply,
                "input_type": "text",
                "reply_to_message_id": last_message["id"]
            })
            .select(
                "id, conversation_id, role, content, "
                "input_type, reply_to_message_id, created_at"
            )
            .execute()
        )

    except APIError as exc:
        # The database unique index prevents duplicate replies.
        if str(exc.code) == "23505":
            raise HTTPException(
                status_code=409,
                detail="An assistant reply already exists for this message."
            ) from exc

        logging.getLogger(__name__).exception(
            "Failed to save assistant reply"
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to save assistant reply."
        ) from exc

    if not saved_response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to save assistant reply."
        )

    return {
        "status": "success",
        "detected_emotion": emotion,
        "assistant_message": saved_response.data[0]
    }
