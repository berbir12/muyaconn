-- Database setup script for Muyacon app
-- Run this in your Supabase SQL editor

-- Create phone_verifications table
CREATE TABLE IF NOT EXISTS phone_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  verification_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  email text,
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  phone text UNIQUE NOT NULL,
  bio text,
  skills text[],
  available boolean DEFAULT true,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  address text,
  city text,
  state text,
  zip_code text,
  latitude double precision,
  longitude double precision,
  total_tasks_completed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'tasker', 'both')),
  rating_average double precision DEFAULT 0,
  rating_count integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  last_active timestamp with time zone DEFAULT timezone('utc'::text, now()),
  portfolio_images text[],
  experience_years integer DEFAULT 0,
  certifications text[],
  languages text[],
  response_time text DEFAULT 'within 24 hours',
  location text,
  average_rating double precision DEFAULT 0,
  total_reviews integer DEFAULT 0,
  hourly_rate double precision,
  is_admin boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  phone_verification_code text,
  phone_verification_expires_at timestamp with time zone
);

-- Create task_categories table
CREATE TABLE IF NOT EXISTS task_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'briefcase',
  color text DEFAULT '#8B5CF6',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  budget double precision NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude double precision,
  longitude double precision,
  task_date timestamp with time zone,
  task_time text,
  flexible_date boolean DEFAULT true,
  estimated_hours integer,
  task_size text DEFAULT 'medium' CHECK (task_size IN ('small', 'medium', 'large')),
  urgency text DEFAULT 'flexible' CHECK (urgency IN ('flexible', 'within_week', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  customer_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tasker_id text REFERENCES profiles(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES task_categories(id) ON DELETE RESTRICT,
  requirements text[],
  attachments text[],
  tags text[],
  is_featured boolean DEFAULT false,
  is_urgent boolean DEFAULT false,
  expires_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  customer_rating double precision CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_review text,
  tasker_rating double precision CHECK (tasker_rating >= 1 AND tasker_rating <= 5),
  tasker_review text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
  payment_method text,
  transaction_id text,
  final_price double precision,
  special_instructions text,
  photos text[],
  estimated_duration_hours integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create task_applications table
CREATE TABLE IF NOT EXISTS task_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tasker_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_price double precision NOT NULL,
  estimated_time integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message text NOT NULL,
  attachments text[],
  availability_date timestamp with time zone NOT NULL,
  estimated_hours integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(task_id, tasker_id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  technician_id text REFERENCES profiles(id) ON DELETE SET NULL,
  service_type text NOT NULL,
  description text,
  scheduled_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  location jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  attachments text[],
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable all for phone verifications" ON phone_verifications;

-- Create RLS policies for phone_verifications
CREATE POLICY "Enable all for phone verifications" ON phone_verifications FOR ALL USING (true);

-- Create RLS policies for profiles
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON profiles FOR DELETE USING (true);

-- Create RLS policies for task_categories
CREATE POLICY "Enable read access for all users" ON task_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON task_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON task_categories FOR UPDATE USING (true);

-- Create RLS policies for tasks
CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON tasks FOR DELETE USING (true);

-- Create RLS policies for task_applications
CREATE POLICY "Enable read access for all users" ON task_applications FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON task_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON task_applications FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON task_applications FOR DELETE USING (true);

-- Create RLS policies for bookings
CREATE POLICY "Enable read access for all users" ON bookings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON bookings FOR DELETE USING (true);

-- Create RLS policies for messages
CREATE POLICY "Enable read access for all users" ON messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON messages FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON messages FOR DELETE USING (true);

-- Insert some default task categories
INSERT INTO task_categories (name, slug, description, icon, color, sort_order) VALUES
('Cleaning', 'cleaning', 'House and office cleaning services', 'sparkles', '#10B981', 1),
('Handyman', 'handyman', 'General repair and maintenance work', 'hammer', '#F59E0B', 2),
('Delivery', 'delivery', 'Package and item delivery services', 'car', '#3B82F6', 3),
('Photography', 'photography', 'Professional photography services', 'camera', '#8B5CF6', 4),
('Technology', 'technology', 'IT support and tech services', 'laptop', '#06B6D4', 5),
('Gardening', 'gardening', 'Landscaping and garden maintenance', 'leaf', '#22C55E', 6),
('Pet Care', 'pet-care', 'Pet sitting and care services', 'paw', '#F97316', 7),
('Moving', 'moving', 'Moving and relocation services', 'cube', '#84CC16', 8),
('Tutoring', 'tutoring', 'Educational and tutoring services', 'school', '#A8E6CF', 9),
('Cooking', 'cooking', 'Catering and cooking services', 'restaurant', '#FFB6C1', 10),
('Painting', 'painting', 'Interior and exterior painting', 'color-palette', '#DDA0DD', 11),
('Plumbing', 'plumbing', 'Plumbing repair and installation', 'water', '#87CEEB', 12),
('Electrical', 'electrical', 'Electrical work and repairs', 'flash', '#F0E68C', 13),
('Carpentry', 'carpentry', 'Woodworking and carpentry services', 'construct', '#DEB887', 14),
('Landscaping', 'landscaping', 'Outdoor landscaping services', 'leaf-outline', '#98FB98', 15),
('Event Planning', 'event-planning', 'Event organization and planning', 'calendar', '#FFA07A', 16)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tasker_id ON tasks(tasker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_task_id ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_tasker_id ON task_applications(tasker_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_code ON phone_verifications(verification_code);
