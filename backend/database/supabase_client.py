from supabase import create_client, Client

from backend.config import settings


def get_supabase_client() -> Client:
    if not settings.SUPABASE_URL:
        raise ValueError("SUPABASE_URL is missing.")

    if not settings.SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_ANON_KEY is missing.")

    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )


if __name__ == "__main__":
    try:
        client = get_supabase_client()
        print("Supabase client initialized successfully!")

        response = (
            client.table("profiles")
            .select("user_id")
            .limit(1)
            .execute()
        )

        print("Database query successful!")
        print("Returned rows:", len(response.data))

    except Exception as e:
        print(f"Connection setup failed: {e}")