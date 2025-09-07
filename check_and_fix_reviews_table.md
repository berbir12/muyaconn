# Fix Reviews Table Schema

The error indicates that the database is looking for a `review_text` column but the frontend is sending `comment`. This suggests a schema mismatch.

## Steps to Fix:

1. **Check Current Database Schema:**
   - Go to your Supabase dashboard
   - Navigate to Table Editor
   - Look at the `reviews` table
   - Check what columns actually exist

2. **If the table has `review_text` column:**
   - Rename it to `comment` to match the frontend code
   - Or update the frontend to use `review_text`

3. **If the table doesn't exist or is missing columns:**
   - Run the SQL script in `fix_reviews_schema.sql` to create/update the table

4. **Alternative: Update Frontend to Match Database:**
   If the database has `review_text` column, we can update the frontend to use it instead.

## Quick Fix Options:

### Option 1: Update Database Schema (Recommended)
Run the SQL in `fix_reviews_schema.sql` to ensure the database has the correct schema.

### Option 2: Update Frontend to Match Database
If the database has `review_text` column, we can change the frontend back to use `review_text`.

## To Check Current Schema:
1. Go to Supabase Dashboard
2. Table Editor → reviews table
3. Check the column names
4. Let me know what columns exist so I can fix the mismatch
