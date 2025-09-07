#!/usr/bin/env python3
"""
Script to check the actual schema of the reviews table
"""

import os
import sys
from supabase import create_client, Client

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server import supabase_admin

def check_reviews_schema():
    """Check the actual schema of the reviews table"""
    try:
        # Get the table schema
        schema_query = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'reviews' AND table_schema = 'public'
        ORDER BY ordinal_position;
        """
        
        print("Checking reviews table schema...")
        result = supabase_admin.rpc('exec_sql', {'sql': schema_query}).execute()
        
        if result.data:
            print("\n📋 Reviews table schema:")
            print("-" * 60)
            for column in result.data:
                print(f"Column: {column['column_name']}")
                print(f"  Type: {column['data_type']}")
                print(f"  Nullable: {column['is_nullable']}")
                print(f"  Default: {column['column_default']}")
                print()
        else:
            print("❌ No schema data returned")
            
        # Also check if the table exists
        table_check = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
        );
        """
        
        table_result = supabase_admin.rpc('exec_sql', {'sql': table_check}).execute()
        if table_result.data:
            exists = table_result.data[0]['exists']
            print(f"📊 Reviews table exists: {exists}")
            
        # Test inserting a review to see what error we get
        print("\n🧪 Testing review insertion...")
        test_review = {
            'task_id': '00000000-0000-0000-0000-000000000000',  # Dummy UUID
            'reviewer_id': '00000000-0000-0000-0000-000000000000',  # Dummy UUID
            'reviewee_id': '00000000-0000-0000-0000-000000000000',  # Dummy UUID
            'rating': 5,
            'comment': 'Test review comment'
        }
        
        try:
            insert_result = supabase_admin.table('reviews').insert(test_review).execute()
            print("✅ Test insert successful (this shouldn't happen with dummy UUIDs)")
        except Exception as e:
            print(f"❌ Test insert failed (expected): {e}")
            
    except Exception as e:
        print(f"❌ Error checking schema: {e}")

if __name__ == "__main__":
    check_reviews_schema()
