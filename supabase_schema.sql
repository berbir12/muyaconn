-- ======================================
-- TASKRABBIT-STYLE APP DATABASE SCHEMA
-- Complete SQL for Supabase (ACTUAL SCHEMA)
-- ======================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================================
-- 1. PROFILES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  phone text,
  bio text,
  skills ARRAY,
  available boolean DEFAULT true,
  verification_status text DEFAULT 'pending'::text CHECK (verification_status IN ('pending'::text, 'verified'::text, 'rejected'::text)),
  address text,
  city text,
  state text,
  zip_code text,
  latitude numeric,
  longitude numeric,
  total_tasks_completed integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  role text DEFAULT 'customer'::text CHECK (role IN ('customer'::text, 'tasker'::text, 'both'::text)),
  rating_average numeric DEFAULT 0.00,
  rating_count integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  last_active timestamp with time zone DEFAULT now(),
  portfolio_images ARRAY DEFAULT '{}'::text[],
  experience_years integer DEFAULT 0,
  certifications ARRAY DEFAULT '{}'::text[],
  languages ARRAY DEFAULT '{}'::text[],
  response_time text DEFAULT 'Within 1 hour'::text,
  location text,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  hourly_rate numeric,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ======================================
-- 2. TASK CATEGORIES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.task_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT task_categories_pkey PRIMARY KEY (id)
);

-- ======================================
-- 3. TASKS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  tasker_id uuid,
  category_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude numeric,
  longitude numeric,
  task_date date,
  task_time time without time zone,
  flexible_date boolean DEFAULT false,
  estimated_hours numeric,
  budget numeric NOT NULL,
  task_size text DEFAULT 'medium'::text CHECK (task_size IN ('small'::text, 'medium'::text, 'large'::text)),
  urgency text DEFAULT 'flexible'::text CHECK (urgency IN ('flexible'::text, 'within_week'::text, 'urgent'::text)),
  status text DEFAULT 'open'::text CHECK (status IN ('open'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text)),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  requirements ARRAY,
  attachments ARRAY,
  tags ARRAY,
  is_featured boolean DEFAULT false,
  is_urgent boolean DEFAULT false,
  expires_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_review text,
  tasker_rating integer CHECK (tasker_rating >= 1 AND tasker_rating <= 5),
  tasker_review text,
  payment_status text DEFAULT 'pending'::text CHECK (payment_status IN ('pending'::text, 'partial'::text, 'completed'::text, 'refunded'::text)),
  payment_method text,
  transaction_id text,
  final_price numeric,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT tasks_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.profiles(id),
  CONSTRAINT tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.task_categories(id)
);

-- ======================================
-- 4. TASK APPLICATIONS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.task_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL,
  tasker_id uuid NOT NULL,
  proposed_price numeric NOT NULL,
  estimated_time numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status IN ('pending'::text, 'accepted'::text, 'rejected'::text)),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  applicant_id uuid,
  proposed_duration interval,
  message text NOT NULL,
  attachments ARRAY,
  is_cover_letter boolean DEFAULT false,
  availability_date text NOT NULL,
  CONSTRAINT task_applications_pkey PRIMARY KEY (id),
  CONSTRAINT task_applications_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.profiles(id),
  CONSTRAINT task_applications_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.profiles(id)
);

-- ======================================
-- 5. REVIEWS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id)
);

-- ======================================
-- 6. MESSAGES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text'::text CHECK (message_type IN ('text'::text, 'image'::text, 'system'::text)),
  attachments ARRAY,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  chat_type text DEFAULT 'task'::text CHECK (chat_type IN ('task'::text, 'direct'::text)),
  direct_chat_id text,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id)
);

-- ======================================
-- 7. NOTIFICATIONS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'system'::text CHECK (type IN ('task'::text, 'application'::text, 'message'::text, 'review'::text, 'system'::text)),
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  data jsonb,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- ======================================
-- 8. DIRECT BOOKINGS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.direct_bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  technician_id uuid NOT NULL,
  service_name text NOT NULL,
  service_description text,
  base_price numeric NOT NULL,
  agreed_price numeric NOT NULL,
  price_type text DEFAULT 'hourly'::text CHECK (price_type = ANY (ARRAY['hourly'::text, 'fixed'::text, 'negotiable'::text])),
  booking_date date NOT NULL CHECK (booking_date >= CURRENT_DATE),
  start_time time without time zone NOT NULL,
  end_time time without time zone,
  estimated_duration_hours numeric,
  city text,
  state text,
  address text,
  zip_code text,
  latitude numeric,
  longitude numeric,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  total_amount numeric,
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])),
  customer_notes text,
  technician_notes text,
  special_instructions text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT direct_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT direct_bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT direct_bookings_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.profiles(id)
);

-- ======================================
-- 9. TECHNICIANS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS public.technicians (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  hourly_rate numeric DEFAULT 50.00,
  is_verified boolean DEFAULT false,
  is_available boolean DEFAULT true,
  services ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT technicians_pkey PRIMARY KEY (id),
  CONSTRAINT technicians_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

-- ======================================
-- 10. BOOKINGS TABLE (NEW)
-- ======================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  tasker_id uuid NOT NULL,
  status text DEFAULT 'in_progress'::text CHECK (status IN ('in_progress'::text, 'completed'::text, 'cancelled'::text)),
  accepted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_review text,
  tasker_rating integer CHECK (tasker_rating >= 1 AND tasker_rating <= 5),
  tasker_review text,
  final_price numeric,
  payment_status text DEFAULT 'pending'::text CHECK (payment_status IN ('pending'::text, 'partial'::text, 'completed'::text, 'refunded'::text)),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_unique_task UNIQUE (task_id)
);

-- ======================================
-- 11. CHATS TABLE (NEW)
-- ======================================
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid,
  customer_id uuid NOT NULL,
  tasker_id uuid NOT NULL,
  last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT chats_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT chats_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.profiles(id),
  CONSTRAINT chats_unique_task UNIQUE (task_id)
);

-- ======================================
-- ROW LEVEL SECURITY POLICIES
-- ======================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY; -- Not currently used

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Task categories policies
CREATE POLICY "Task categories are viewable by everyone" ON public.task_categories
  FOR SELECT USING (is_active = true);

-- Tasks policies
CREATE POLICY "Users can view all active tasks" ON public.tasks
  FOR SELECT USING (status != 'cancelled');

CREATE POLICY "Customers can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('customer', 'both'))
  );

CREATE POLICY "Task owners and assigned taskers can update tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = tasker_id);

-- Task applications policies
CREATE POLICY "Task applications viewable by task owner and applicant" ON public.task_applications
  FOR SELECT USING (
    auth.uid() = tasker_id OR 
    auth.uid() = (SELECT customer_id FROM public.tasks WHERE id = task_id)
  );

CREATE POLICY "Taskers can create applications" ON public.task_applications
  FOR INSERT WITH CHECK (
    auth.uid() = tasker_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tasker', 'both'))
  );

CREATE POLICY "Applications can be updated by tasker or customer" ON public.task_applications
  FOR UPDATE USING (
    auth.uid() = tasker_id OR 
    auth.uid() = (SELECT customer_id FROM public.tasks WHERE id = task_id)
  );

-- Reviews policies
CREATE POLICY "Reviews are publicly viewable" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for completed tasks" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE id = task_id 
      AND status = 'completed' 
      AND (customer_id = auth.uid() OR tasker_id = auth.uid())
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages for their tasks" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages for their tasks" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE id = task_id 
      AND (customer_id = auth.uid() OR tasker_id = auth.uid())
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow insert for system functions (triggers)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Technicians policies (Note: Currently not used in the app - profiles table is used instead)
-- CREATE POLICY "Technicians are viewable by everyone" ON public.technicians
--   FOR SELECT USING (true);

-- CREATE POLICY "Users can update their own technician profile" ON public.technicians
--   FOR UPDATE USING (auth.uid() = profile_id);

-- CREATE POLICY "Users can insert their own technician profile" ON public.technicians
--   FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Direct bookings policies
CREATE POLICY "Users can view their own bookings" ON public.direct_bookings
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = technician_id);

CREATE POLICY "Users can create bookings" ON public.direct_bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own bookings" ON public.direct_bookings
  FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = technician_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = tasker_id
  );

CREATE POLICY "Users can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = tasker_id
  );

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = customer_id OR auth.uid() = tasker_id
  );

CREATE POLICY "Users can delete their own bookings" ON public.bookings
  FOR DELETE USING (auth.uid() = customer_id);

-- Chats policies
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = tasker_id
  );

CREATE POLICY "Users can insert chats" ON public.chats
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = tasker_id
  );

CREATE POLICY "Users can update their own chats" ON public.chats
  FOR UPDATE USING (
    auth.uid() = customer_id OR auth.uid() = tasker_id
  );

CREATE POLICY "Users can delete their own chats" ON public.chats
  FOR DELETE USING (
    auth.uid() = customer_id OR auth.uid() = tasker_id
  );

-- ======================================
-- FUNCTIONS AND TRIGGERS
-- ======================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'tasker' THEN 'tasker'
      WHEN NEW.raw_user_meta_data->>'role' = 'both' THEN 'both'
      ELSE 'customer'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS trigger AS $$
BEGIN
  -- Update tasker stats when a review is added
  IF TG_TABLE_NAME = 'reviews' THEN
    UPDATE public.profiles SET
      rating_average = (
        SELECT AVG(rating)::numeric(3,2) 
        FROM public.reviews 
        WHERE reviewee_id = NEW.reviewee_id
      ),
      rating_count = (
        SELECT COUNT(*) 
        FROM public.reviews 
        WHERE reviewee_id = NEW.reviewee_id
      ),
      updated_at = now()
    WHERE id = NEW.reviewee_id;
  END IF;
  
  -- Update completed tasks count when task is completed
  IF TG_TABLE_NAME = 'tasks' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.profiles SET
      completed_tasks = completed_tasks + 1,
      updated_at = now()
    WHERE id = NEW.tasker_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for task applications
CREATE OR REPLACE FUNCTION public.notify_task_application()
RETURNS trigger AS $$
BEGIN
  -- Create notification for task owner when someone applies
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    data
  ) VALUES (
    (SELECT customer_id FROM public.tasks WHERE id = NEW.task_id),
    'New Task Application',
    (SELECT full_name FROM public.profiles WHERE id = NEW.tasker_id) || ' has applied to your task "' || 
    (SELECT title FROM public.tasks WHERE id = NEW.task_id) || '"',
    'application',
    jsonb_build_object(
      'task_id', NEW.task_id,
      'tasker_id', NEW.tasker_id,
      'application_id', NEW.id,
      'proposed_price', NEW.proposed_price
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for direct bookings
CREATE OR REPLACE FUNCTION public.notify_direct_booking()
RETURNS trigger AS $$
BEGIN
  -- Create notification for technician when someone books them
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    data
  ) VALUES (
    NEW.technician_id,
    'New Booking Request',
    (SELECT full_name FROM public.profiles WHERE id = NEW.customer_id) || ' has sent you a booking request for "' || 
    NEW.service_name || '"',
    'task',
    jsonb_build_object(
      'booking_id', NEW.id,
      'customer_id', NEW.customer_id,
      'service_name', NEW.service_name,
      'agreed_price', NEW.agreed_price,
      'booking_date', NEW.booking_date
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_stats_on_review ON public.reviews;
DROP TRIGGER IF EXISTS update_stats_on_task_completion ON public.tasks;

-- Create triggers for stats updates
CREATE TRIGGER update_stats_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

CREATE TRIGGER update_stats_on_task_completion
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

-- Create triggers for notifications
CREATE TRIGGER notify_on_task_application
  AFTER INSERT ON public.task_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_application();

CREATE TRIGGER notify_on_direct_booking
  AFTER INSERT ON public.direct_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_direct_booking();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_applications_updated_at BEFORE UPDATE ON public.task_applications 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ======================================
-- INDEXES FOR PERFORMANCE
-- ======================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_profiles_available ON public.profiles(available) WHERE role IN ('tasker', 'both');
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON public.tasks(city, state);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_customer ON public.tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tasker ON public.tasks(tasker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- Task applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_task ON public.task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_applications_tasker ON public.task_applications(tasker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.task_applications(status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_task ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_task ON public.reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_task ON public.bookings(task_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tasker ON public.bookings(tasker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- Chats indexes
CREATE INDEX IF NOT EXISTS idx_chats_task ON public.chats(task_id);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON public.chats(customer_id, tasker_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON public.chats(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at);

-- ======================================
-- COMPLETION MESSAGE
-- ======================================

DO $$
BEGIN
    RAISE NOTICE 'TaskRabbit-style database schema created successfully!';
    RAISE NOTICE 'Tables created: profiles, task_categories, tasks, task_applications, reviews, messages, notifications, direct_bookings, technicians, bookings, chats';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Triggers and functions created for auto-profile creation and stats updates';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Ready to start using the TaskRabbit clone!';
END $$;