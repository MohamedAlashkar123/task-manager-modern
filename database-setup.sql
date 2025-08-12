-- Migration script to add user_id support to existing tables
-- Run this in your Supabase SQL Editor

-- ===========================================
-- RPA PROCESSES TABLE MIGRATION
-- ===========================================

-- Add missing columns to existing rpa_processes table if they don't exist
DO $$ 
BEGIN
  -- Add user_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add start_date column  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN start_date DATE;
  END IF;
  
  -- Add due_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN due_date DATE;
  END IF;
  
  -- Add entity_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'entity_name'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN entity_name TEXT;
  END IF;
  
  -- Add owner column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'owner'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN owner TEXT;
  END IF;
  
  -- Add department column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'department'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN department TEXT;
  END IF;
  
  -- Add created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add last_modified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'last_modified'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN last_modified TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing records to use the current user (if any records exist without user_id)
UPDATE rpa_processes 
SET user_id = auth.uid() 
WHERE user_id IS NULL AND auth.uid() IS NOT NULL;

-- Make user_id NOT NULL after updating existing records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE rpa_processes ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rpa_processes_user_id ON rpa_processes(user_id);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_status ON rpa_processes(status);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_created_at ON rpa_processes(created_at);

-- Set up Row Level Security (RLS) 
ALTER TABLE rpa_processes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own processes" ON rpa_processes;
DROP POLICY IF EXISTS "Users can insert own processes" ON rpa_processes;
DROP POLICY IF EXISTS "Users can update own processes" ON rpa_processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON rpa_processes;

-- Create new RLS policies
CREATE POLICY "Users can view own processes" ON rpa_processes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processes" ON rpa_processes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processes" ON rpa_processes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own processes" ON rpa_processes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Update trigger to automatically update last_modified
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rpa_processes_last_modified ON rpa_processes;
CREATE TRIGGER update_rpa_processes_last_modified
  BEFORE UPDATE ON rpa_processes
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- ===========================================
-- NOTES TABLE MIGRATION
-- ===========================================

-- Add missing columns to existing notes table if they don't exist
DO $$ 
BEGIN
  -- Add user_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add display_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE notes ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- Add created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE notes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add last_edited column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'last_edited'
  ) THEN
    ALTER TABLE notes ADD COLUMN last_edited TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing records to use the current user
UPDATE notes 
SET user_id = auth.uid() 
WHERE user_id IS NULL AND auth.uid() IS NOT NULL;

-- Make user_id NOT NULL after updating existing records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_display_order ON notes(display_order);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Set up Row Level Security (RLS) for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Create new RLS policies
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Update trigger to automatically update last_edited for notes
DROP TRIGGER IF EXISTS update_notes_last_edited ON notes;
CREATE TRIGGER update_notes_last_edited
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();


-- ===========================================
-- TASKS TABLE MIGRATION
-- ===========================================

-- Add missing columns to existing tasks table if they don't exist
DO $$ 
BEGIN
  -- Add user_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_date DATE;
  END IF;
  
  -- Add due_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_date DATE;
  END IF;
  
  -- Add display_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE tasks ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- Add created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing records to use the current user
UPDATE tasks 
SET user_id = auth.uid() 
WHERE user_id IS NULL AND auth.uid() IS NOT NULL;

-- Make user_id NOT NULL after updating existing records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(display_order);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Set up Row Level Security (RLS) for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create new RLS policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Update trigger to automatically update updated_at for tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
-- All existing tables have been updated with:
-- ✅ user_id columns and constraints
-- ✅ Proper indexes for performance
-- ✅ Row Level Security policies for user isolation
-- ✅ Auto-update triggers for timestamps
-- 
-- Your existing data has been preserved and associated with the current user.
-- The application should now work properly with user-specific data isolation.

