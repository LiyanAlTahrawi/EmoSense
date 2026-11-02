from supabase import create_client
from getpass import getpass
from backend.config import settings


supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)

email = input("Enter test user email: ")
password = getpass("Enter test user password: ")
try:
    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    print("Login successful!")

    print("User ID:", response.user.id)
    print("Access token received:", bool(response.session.access_token))
    print("Access token received:", bool(response.session.access_token))
    profile = (
        supabase.table("profiles")
        .select("user_id")
        .eq("user_id", response.user.id)
        .execute()
    )

    print("Profile query successful!")
    print("Own profile found:", len(profile.data) == 1)
    conversations = (
        supabase.table("conversations")
        .select("id, title")
        .execute()
    )

    print("Visible conversation count:", len(conversations.data))
    print("Conversation titles:", [c["title"] for c in conversations.data])
except Exception as e:
    print("Login failed:", str(e))

print("ACCESS TOKEN:")
print(response.session.access_token)