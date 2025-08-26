-- Row Level Security (RLS) Setup for Task Manager
-- Run this in your Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rpa_processes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only access their own notes" ON notes;
DROP POLICY IF EXISTS "Users can only access their own RPA processes" ON rpa_processes;

-- Tasks RLS Policies
CREATE POLICY "Users can only access their own tasks" ON tasks
FOR ALL USING (auth.uid() = user_id::uuid);

-- Notes RLS Policies  
CREATE POLICY "Users can only access their own notes" ON notes
FOR ALL USING (auth.uid() = user_id::uuid);

-- RPA Processes RLS Policies
CREATE POLICY "Users can only access their own RPA processes" ON rpa_processes
FOR ALL USING (auth.uid() = user_id::uuid);

-- Create user_id columns if they don't exist (with default for existing data)
DO $$ 
BEGIN
    -- Add user_id to tasks if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN user_id UUID DEFAULT auth.uid();
        -- Set a default user_id for existing records (you may want to update this)
        UPDATE tasks SET user_id = auth.uid() WHERE user_id IS NULL;
        ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
    END IF;

    -- Add user_id to notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE notes ADD COLUMN user_id UUID DEFAULT auth.uid();
        UPDATE notes SET user_id = auth.uid() WHERE user_id IS NULL;
        ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
    END IF;

    -- Add user_id to rpa_processes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rpa_processes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE rpa_processes ADD COLUMN user_id UUID DEFAULT auth.uid();
        UPDATE rpa_processes SET user_id = auth.uid() WHERE user_id IS NULL;
        ALTER TABLE rpa_processes ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Create indexes for better performance with user_id filtering
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_user_id ON rpa_processes(user_id);

-- Create functions to automatically set user_id for new records
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger AS $$
BEGIN
    NEW.user_id := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id on INSERT
DROP TRIGGER IF EXISTS set_user_id_trigger ON tasks;
CREATE TRIGGER set_user_id_trigger
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON notes;
CREATE TRIGGER set_user_id_trigger
    BEFORE INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_trigger ON rpa_processes;
CREATE TRIGGER set_user_id_trigger
    BEFORE INSERT ON rpa_processes
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Security note: The anon user should only have limited access
-- Revoke unnecessary permissions from anon users
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Multi-Factor Authentication (MFA) Enforcement
-- Create function to check MFA requirement
CREATE OR REPLACE FUNCTION public.enforce_mfa()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has completed MFA (Authentication Assurance Level 2)
  RETURN (SELECT auth.jwt()->>'aal') = 'aal2';
END;
$$;

-- Create MFA audit log table
CREATE TABLE IF NOT EXISTS mfa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  factor_type TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on MFA audit log
ALTER TABLE mfa_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for MFA audit log (users can only see their own logs)
CREATE POLICY "Users can only access their own MFA logs" ON mfa_audit_log
FOR ALL USING (auth.uid() = user_id);

-- Create trigger function to log MFA events
CREATE OR REPLACE FUNCTION log_mfa_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO mfa_audit_log (user_id, event_type, factor_type)
  VALUES (NEW.user_id, NEW.event_type, NEW.factor_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply MFA enforcement to sensitive operations
-- Update existing RLS policies to require MFA for sensitive data

-- Enhanced Tasks RLS Policies with MFA requirement for sensitive operations
DROP POLICY IF EXISTS "Users can only access their own tasks" ON tasks;
CREATE POLICY "Users can only access their own tasks" ON tasks
FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own tasks" ON tasks
FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own tasks" ON tasks
FOR UPDATE USING (auth.uid() = user_id::uuid);

-- Require MFA for deleting tasks (sensitive operation)
CREATE POLICY "Users can delete their own tasks with MFA" ON tasks
FOR DELETE USING (
  auth.uid() = user_id::uuid AND 
  public.enforce_mfa()
);

-- Enhanced Notes RLS Policies with MFA requirement for sensitive operations  
DROP POLICY IF EXISTS "Users can only access their own notes" ON notes;
CREATE POLICY "Users can only access their own notes" ON notes
FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own notes" ON notes
FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own notes" ON notes
FOR UPDATE USING (auth.uid() = user_id::uuid);

-- Require MFA for deleting notes (sensitive operation)
CREATE POLICY "Users can delete their own notes with MFA" ON notes
FOR DELETE USING (
  auth.uid() = user_id::uuid AND 
  public.enforce_mfa()
);

-- Enhanced RPA Processes RLS Policies with MFA requirement for sensitive operations
DROP POLICY IF EXISTS "Users can only access their own RPA processes" ON rpa_processes;
CREATE POLICY "Users can only access their own RPA processes" ON rpa_processes
FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own RPA processes" ON rpa_processes
FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

-- Require MFA for updating/deleting RPA processes (sensitive operations)
CREATE POLICY "Users can update their own RPA processes with MFA" ON rpa_processes
FOR UPDATE USING (
  auth.uid() = user_id::uuid AND 
  public.enforce_mfa()
);

CREATE POLICY "Users can delete their own RPA processes with MFA" ON rpa_processes
FOR DELETE USING (
  auth.uid() = user_id::uuid AND 
  public.enforce_mfa()
);

-- Create user profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles RLS policy
CREATE POLICY "Users can only access their own profile" ON user_profiles
FOR ALL USING (auth.uid() = id);

-- Function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_mfa_audit_log_user_id ON mfa_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_audit_log_timestamp ON mfa_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);