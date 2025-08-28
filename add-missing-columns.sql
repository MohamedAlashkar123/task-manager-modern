-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Run this in your Supabase SQL Editor

-- ===========================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ===========================================

-- Add user_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id UUID;
    -- Update existing records to use your user ID
    UPDATE tasks SET user_id = '4fdf45a4-55e2-48b5-9338-efa303b20063' WHERE user_id IS NULL;
    -- Make it NOT NULL and add foreign key constraint
    ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to notes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE notes ADD COLUMN user_id UUID;
    -- Update existing records to use your user ID
    UPDATE notes SET user_id = '4fdf45a4-55e2-48b5-9338-efa303b20063' WHERE user_id IS NULL;
    -- Make it NOT NULL and add foreign key constraint
    ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE notes ADD CONSTRAINT fk_notes_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to rpa_processes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN user_id UUID;
    -- Update existing records to use your user ID
    UPDATE rpa_processes SET user_id = '4fdf45a4-55e2-48b5-9338-efa303b20063' WHERE user_id IS NULL;
    -- Make it NOT NULL and add foreign key constraint
    ALTER TABLE rpa_processes ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE rpa_processes ADD CONSTRAINT fk_rpa_processes_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add other missing columns to tasks table
DO $$ 
BEGIN
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

-- Add other missing columns to notes table
DO $$ 
BEGIN
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

-- Add other missing columns to rpa_processes table
DO $$ 
BEGIN
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
  
  -- Add entity_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rpa_processes' AND column_name = 'entity_name'
  ) THEN
    ALTER TABLE rpa_processes ADD COLUMN entity_name TEXT;
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

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ===========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(display_order);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Notes indexes  
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_display_order ON notes(display_order);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- RPA Processes indexes
CREATE INDEX IF NOT EXISTS idx_rpa_processes_user_id ON rpa_processes(user_id);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_status ON rpa_processes(status);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_created_at ON rpa_processes(created_at);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE RLS POLICIES
-- ===========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

DROP POLICY IF EXISTS "Users can view own processes" ON rpa_processes;
DROP POLICY IF EXISTS "Users can insert own processes" ON rpa_processes;
DROP POLICY IF EXISTS "Users can update own processes" ON rpa_processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON rpa_processes;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notes policies  
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RPA Processes policies
CREATE POLICY "Users can view own processes" ON rpa_processes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processes" ON rpa_processes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processes" ON rpa_processes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own processes" ON rpa_processes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===========================================
-- CREATE UPDATE TRIGGERS
-- ===========================================

-- Trigger function for tasks (updates updated_at)
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for notes (updates last_edited)  
CREATE OR REPLACE FUNCTION update_notes_last_edited()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for rpa_processes (updates last_modified)
CREATE OR REPLACE FUNCTION update_rpa_processes_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for user_profiles (updates updated_at)
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_tasks_updated_at_trigger ON tasks;
DROP TRIGGER IF EXISTS update_notes_last_edited_trigger ON notes;
DROP TRIGGER IF EXISTS update_rpa_processes_last_modified_trigger ON rpa_processes;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;

-- Create triggers
CREATE TRIGGER update_tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

CREATE TRIGGER update_notes_last_edited_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_last_edited();

CREATE TRIGGER update_rpa_processes_last_modified_trigger
  BEFORE UPDATE ON rpa_processes
  FOR EACH ROW
  EXECUTE FUNCTION update_rpa_processes_last_modified();

CREATE TRIGGER update_user_profiles_updated_at_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
-- ✅ Added user_id column to all existing tables
-- ✅ Associated existing data with your user ID: 4fdf45a4-55e2-48b5-9338-efa303b20063
-- ✅ Added all missing columns
-- ✅ Created proper indexes and triggers
-- ✅ Set up Row Level Security
-- 
-- You can now login and use the application!