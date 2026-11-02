import os
from pathlib import Path
from functools import lru_cache

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from EmoSense/.env
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


@lru_cache(maxsize=1)
def get_admin_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    secret_key = os.getenv("SUPABASE_SECRET_KEY")

    if not supabase_url or not secret_key:
        raise RuntimeError(
            "SUPABASE_URL or SUPABASE_SECRET_KEY "
            "is missing from .env"
        )

    if not secret_key.startswith("sb_secret_"):
        raise RuntimeError(
            "Expected a Supabase secret key."
        )

    return create_client(
        supabase_url,
        secret_key
    )
