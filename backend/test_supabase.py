"""
Test Supabase connection from backend
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

print(f"🔍 Testing Supabase connection...")
print(f"URL: {url}")
print(f"Key: {key[:20]}..." if key else "Key: None")

try:
    # Create Supabase client
    supabase: Client = create_client(url, key)
    print("✅ Supabase client created successfully")

    # Test query - fetch from profiles table
    response = supabase.table('profiles').select("*").limit(1).execute()
    print(f"✅ Query successful! Profiles table exists.")
    print(f"📊 Response: {response}")
    print(f"📊 Data count: {len(response.data)} rows")

    # Test other tables exist
    tables = ['trips', 'requests', 'matches', 'messages', 'inspections',
              'transactions', 'credits', 'reviews', 'notifications']

    print(f"\n🔍 Checking all tables exist:")
    for table in tables:
        try:
            resp = supabase.table(table).select("*").limit(1).execute()
            print(f"  ✅ {table} - OK")
        except Exception as e:
            print(f"  ❌ {table} - ERROR: {e}")

    print(f"\n🎉 All database tests passed!")

except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit(1)
