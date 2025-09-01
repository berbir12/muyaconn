-- Fix foreign key constraint for direct_bookings.technician_id
-- This script fixes the issue where technician_id references technicians.id instead of profiles.id

-- First, drop the existing foreign key constraint
ALTER TABLE public.direct_bookings 
DROP CONSTRAINT IF EXISTS direct_bookings_technician_id_fkey;

-- Then add the correct foreign key constraint that references profiles.id
ALTER TABLE public.direct_bookings 
ADD CONSTRAINT direct_bookings_technician_id_fkey 
FOREIGN KEY (technician_id) REFERENCES public.profiles(id);

-- Verify the constraint was added correctly
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='direct_bookings'
    AND kcu.column_name='technician_id';
