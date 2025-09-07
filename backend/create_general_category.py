#!/usr/bin/env python3
"""
Script to create a general category in the task_categories table
"""

import os
import sys
from supabase import create_client, Client

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server import supabase_admin

def create_general_category():
    """Create a general category in the task_categories table"""
    try:
        # First, create the task_categories table if it doesn't exist
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS task_categories (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            slug text UNIQUE NOT NULL,
            description text,
            icon text,
            color text,
            is_active boolean DEFAULT true,
            sort_order integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        """
        
        print("Creating task_categories table...")
        result = supabase_admin.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print(f"Table creation result: {result.data}")
        
        # Check if general category already exists
        check_sql = "SELECT id FROM task_categories WHERE slug = 'general' LIMIT 1;"
        check_result = supabase_admin.rpc('exec_sql', {'sql': check_sql}).execute()
        
        if check_result.data and len(check_result.data) > 0:
            print("General category already exists!")
            return check_result.data[0]['id']
        
        # Insert the general category
        insert_sql = """
        INSERT INTO task_categories (name, slug, description, icon, color, is_active, sort_order)
        VALUES ('General', 'general', 'Any type of task or service', 'grid-outline', '#6B7280', true, 0)
        RETURNING id;
        """
        
        print("Inserting general category...")
        insert_result = supabase_admin.rpc('exec_sql', {'sql': insert_sql}).execute()
        print(f"Insert result: {insert_result.data}")
        
        if insert_result.data and len(insert_result.data) > 0:
            category_id = insert_result.data[0]['id']
            print(f"General category created successfully with ID: {category_id}")
            return category_id
        else:
            print("Failed to create general category")
            return None
            
    except Exception as e:
        print(f"Error creating general category: {e}")
        return None

if __name__ == "__main__":
    category_id = create_general_category()
    if category_id:
        print(f"✅ General category created with ID: {category_id}")
    else:
        print("❌ Failed to create general category")
