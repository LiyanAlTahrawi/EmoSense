from fastapi import Depends, HTTPException
from supabase import create_client

from backend.config import settings

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(
        credential: HTTPAuthorizationCredentials = Depends(security)
        ):

    token = credential.credentials

    try:
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )

        response = supabase.auth.get_user(token)

        if response.user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token."
            )

        return response.user


    except HTTPException:
        raise

    except Exception as exc:
        import logging

        logger = logging.getLogger(__name__)

        logger.error(
            "Supabase authentication verification failed. "
            "Exception type: %s",
            type(exc).__name__
        )

        raise HTTPException(
            status_code=401,
            detail="Authentication failed."
        ) from exc
