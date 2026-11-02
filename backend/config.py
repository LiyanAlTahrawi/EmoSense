
import os
from pathlib import Path

from dotenv import load_dotenv


# Absolute path to EmoSense/.env
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

# Load project configuration.
load_dotenv(dotenv_path=ENV_FILE, override=True)


class Settings:
    APP_NAME = "EmoSense"
    APP_VERSION = "1.0.0"

    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

    LLM_API_KEY = os.getenv("LLM_API_KEY", "")

    TEXT_MODEL_PATH = os.getenv("TEXT_MODEL_PATH", "")

    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY", ""
    )


settings = Settings()