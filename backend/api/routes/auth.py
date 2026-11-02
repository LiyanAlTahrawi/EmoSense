
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from supabase import Client
import logging

from backend.database.admin_client import get_admin_supabase_client
from backend.api.dependencies import get_current_user
from backend.database.dependencies import get_user_supabase_client


router = APIRouter(prefix="/auth", tags=["Authentication"])


class ProfileUpdate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone_number: str | None = Field(default=None, max_length=30)


@router.get("/me")
def get_my_profile(user=Depends(get_current_user)):
    return {
        "status": "authenticated",
        "user_id": user.id,
        "email": user.email
    }

@router.get("/me/profile")
def get_my_database_profile(
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    response = (
        client.table("profiles")
        .select("user_id, first_name, last_name, phone_number")
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found."
        )

    return {
        "status": "success",
        "profile": response.data[0]
    }


@router.patch("/me/profile")
def update_my_database_profile(
    request: ProfileUpdate,
    user=Depends(get_current_user),
    client: Client = Depends(get_user_supabase_client)
):
    first_name = request.first_name.strip()
    last_name = request.last_name.strip()

    if not first_name or not last_name:
        raise HTTPException(
            status_code=422,
            detail="First name and last name cannot be empty."
        )

    phone_number = (
        request.phone_number.strip()
        if request.phone_number
        else None
    )

    response = (
        client.table("profiles")
        .update({
            "first_name": first_name,
            "last_name": last_name,
            "phone_number": phone_number or None
        })
        .eq("user_id", str(user.id))
        .select("user_id, first_name, last_name, phone_number")
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found or update not permitted."
        )

    return {
        "status": "success",
        "profile": response.data[0]
    }


@router.delete("/me")
def delete_my_account(
    user=Depends(get_current_user)
):
    user_id = str(user.id)

    try:
        admin_client = get_admin_supabase_client()

        admin_client.auth.admin.delete_user(
            user_id,
            should_soft_delete=False
        )

    except Exception as exc:
        logging.getLogger(__name__).exception(
            "Account deletion failed for user %s",
            user_id
        )

        raise HTTPException(
            status_code=500,
            detail="Account deletion failed. Please try again."
        ) from exc

    return {
        "status": "success",
        "message": "Account deleted successfully."
    }
