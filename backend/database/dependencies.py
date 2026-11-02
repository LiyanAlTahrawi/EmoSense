from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials

from supabase import create_client, Client

from backend.config import settings
from backend.api.dependencies import (
    get_current_user,
    security
)


def get_user_supabase_client(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user=Depends(get_current_user)
) -> Client:

    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )

    client.postgrest.auth(credentials.credentials)

    return client
