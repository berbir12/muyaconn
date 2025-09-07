#!/usr/bin/env python3
"""
Script to check and fix RLS policies for task deletion
"""

import os
import sys
from supabase import create_client, Client

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server import supabase_admin

def check_rls_policies():
    """Check current RLS policies on tasks table"""
    try:
        print("=== CHECKING RLS POLICIES ===")
        
        # Check if RLS is enabled on tasks table
        check_rls_sql = """
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'tasks';
        """
        
        result = supabase_admin.rpc('exec_sql', {'sql': check_rls_sql}).execute()
        print(f"RLS status: {result.data}")
        
        # Check existing policies
        check_policies_sql = """
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'tasks';
        """
        
        result = supabase_admin.rpc('exec_sql', {'sql': check_policies_sql}).execute()
        print(f"Existing policies: {result.data}")
        
        return True
        
    except Exception as e:
        print(f"Error checking RLS policies: {e}")
        return False

def create_delete_policy():
    """Create a policy that allows users to delete their own tasks"""
    try:
        print("=== CREATING DELETE POLICY ===")
        
        # Create policy for users to delete their own tasks
        create_policy_sql = """
        CREATE POLICY "Users can delete their own tasks" ON public.tasks
        FOR DELETE
        USING (auth.uid() = customer_id);
        """
        
        result = supabase_admin.rpc('exec_sql', {'sql': create_policy_sql}).execute()
        print(f"Policy creation result: {result.data}")
        
        return True
        
    except Exception as e:
        print(f"Error creating delete policy: {e}")
        return False

def disable_rls_temporarily():
    """Temporarily disable RLS on tasks table for testing"""
    try:
        print("=== DISABLING RLS TEMPORARILY ===")
        
        disable_rls_sql = "ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;"
        
        result = supabase_admin.rpc('exec_sql', {'sql': disable_rls_sql}).execute()
        print(f"RLS disable result: {result.data}")
        
        return True
        
    except Exception as e:
        print(f"Error disabling RLS: {e}")
        return False

if __name__ == "__main__":
    print("Checking RLS policies...")
    check_rls_policies()
    
    print("\nCreating delete policy...")
    create_delete_policy()
    
    print("\nDone! Try deleting a task now.")
