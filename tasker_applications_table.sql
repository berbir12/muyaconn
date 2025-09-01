-- Create tasker_applications table
CREATE TABLE IF NOT EXISTS tasker_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')) DEFAULT 'pending',
  
  -- Personal Information (stored as JSONB for flexibility)
  personal_info JSONB NOT NULL DEFAULT '{}',
  
  -- Professional Information
  professional_info JSONB NOT NULL DEFAULT '{}',
  
  -- Verification & Requirements
  verification JSONB NOT NULL DEFAULT '{}',
  
  -- Additional Information
  additional_info JSONB NOT NULL DEFAULT '{}',
  
  -- Admin Review Fields
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasker_applications_user_id ON tasker_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tasker_applications_status ON tasker_applications(status);
CREATE INDEX IF NOT EXISTS idx_tasker_applications_created_at ON tasker_applications(created_at);

-- Enable Row Level Security
ALTER TABLE tasker_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON tasker_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON tasker_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications (only if pending)
CREATE POLICY "Users can update own pending applications" ON tasker_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications (you'll need to implement admin role checking)
CREATE POLICY "Admins can view all applications" ON tasker_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasker_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER tasker_applications_updated_at
  BEFORE UPDATE ON tasker_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_tasker_applications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE tasker_applications IS 'Stores applications from users who want to become taskers';
COMMENT ON COLUMN tasker_applications.personal_info IS 'JSON containing: full_name, phone, date_of_birth, nationality, id_number';
COMMENT ON COLUMN tasker_applications.professional_info IS 'JSON containing: experience, skills, hourly_rate, availability, preferred_categories';
COMMENT ON COLUMN tasker_applications.verification IS 'JSON containing: has_valid_id, has_background_check, has_insurance, has_references';
COMMENT ON COLUMN tasker_applications.additional_info IS 'JSON containing: bio, why_tasker';
COMMENT ON COLUMN tasker_applications.status IS 'Application status: pending, approved, rejected, under_review';
