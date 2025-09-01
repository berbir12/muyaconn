-- Database schema updates for Muyacon app
-- Run these commands to align the database with the app requirements

-- 1) Add final_price to tasks (nullable, for completed payouts)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS final_price numeric;

-- 2) Fix array column types to be properly typed as text[]
-- Note: Your schema already defines these as ARRAY, so we just ensure they're text[]
ALTER TABLE public.messages
ALTER COLUMN attachments TYPE text[] USING
  CASE
    WHEN attachments IS NULL THEN NULL
    WHEN array_length(attachments, 1) IS NOT NULL THEN attachments
    ELSE ARRAY[]::text[]
  END;

ALTER TABLE public.task_applications
ALTER COLUMN attachments TYPE text[] USING
  CASE
    WHEN attachments IS NULL THEN NULL
    WHEN array_length(attachments, 1) IS NOT NULL THEN attachments
    ELSE ARRAY[]::text[]
  END;

-- 3) Ensure other array columns are properly typed
ALTER TABLE public.profiles
ALTER COLUMN skills TYPE text[] USING
  CASE
    WHEN skills IS NULL THEN ARRAY[]::text[]
    WHEN array_length(skills, 1) IS NOT NULL THEN skills
    ELSE ARRAY[]::text[]
  END;

ALTER TABLE public.profiles
ALTER COLUMN portfolio_images TYPE text[] USING
  CASE
    WHEN portfolio_images IS NULL THEN ARRAY[]::text[]
    WHEN array_length(portfolio_images, 1) IS NOT NULL THEN portfolio_images
    ELSE ARRAY[]::text[]
  END;

ALTER TABLE public.profiles
ALTER COLUMN certifications TYPE text[] USING
  CASE
    WHEN certifications IS NULL THEN ARRAY[]::text[]
    WHEN array_length(certifications, 1) IS NOT NULL THEN certifications
    ELSE ARRAY[]::text[]
  END;

ALTER TABLE public.profiles
ALTER COLUMN languages TYPE text[] USING
  CASE
    WHEN languages IS NULL THEN ARRAY[]::text[]
    WHEN array_length(languages, 1) IS NOT NULL THEN languages
    ELSE ARRAY[]::text[]
  END;

-- 4) Create a convenience view for technicians to map profiles role
CREATE OR REPLACE VIEW public.v_technicians AS
SELECT
  p.id AS profile_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.bio,
  COALESCE(p.hourly_rate, 0) AS hourly_rate,
  p.available AS is_available,
  COALESCE(p.rating_average, 0) AS rating_average,
  COALESCE(p.rating_count, 0) AS rating_count,
  p.total_tasks_completed,
  p.experience_years,
  p.skills,
  p.certifications,
  p.languages,
  p.response_time,
  p.location,
  p.city,
  p.state,
  p.created_at
FROM public.profiles p
WHERE p.role IN ('tasker', 'both');

-- 5) Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tasker_id ON public.tasks(tasker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_task_id ON public.task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_tasker_id ON public.task_applications(tasker_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- 6) Add comments for documentation
COMMENT ON COLUMN public.tasks.final_price IS 'Final agreed price for the completed task';
COMMENT ON COLUMN public.messages.chat_type IS 'Type of chat: task or direct';
COMMENT ON COLUMN public.messages.direct_chat_id IS 'ID for direct messaging between users';
COMMENT ON COLUMN public.profiles.role IS 'User role: customer, tasker, or both';
COMMENT ON VIEW public.v_technicians IS 'View of all available technicians/taskers from profiles';

-- Update tasks table to include 'assigned' status
-- This prevents new applications once a tasker is assigned

-- First, drop the existing constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add the new constraint with 'assigned' status
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled'));

-- Update any existing tasks that have a tasker_id but status is 'open' to 'assigned'
UPDATE public.tasks 
SET status = 'assigned' 
WHERE tasker_id IS NOT NULL AND status = 'open';

-- Add a comment explaining the status flow
COMMENT ON COLUMN public.tasks.status IS 'Task status: open (available), assigned (tasker selected), in_progress (work started), completed, cancelled';
