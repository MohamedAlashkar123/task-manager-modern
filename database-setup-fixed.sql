-- Fixed database setup script 
-- Run this in your Supabase SQL Editor to fix the field naming issue

-- ===========================================
-- CREATE OR UPDATE TABLES WITH CORRECT FIELD NAMES
-- ===========================================

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
  start_date DATE,
  due_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table if it doesn't exist  
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited TIMESTAMPTZ DEFAULT NOW()
);

-- Create rpa_processes table if it doesn't exist
CREATE TABLE IF NOT EXISTS rpa_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in-progress', 'completed', 'on-hold')),
  owner TEXT,
  department TEXT,
  entity_name TEXT,
  start_date DATE,
  due_date DATE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

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
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ===========================================

-- Add missing columns to tasks table
DO $$ 
BEGIN
  -- Add user_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add other missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'start_date') THEN
    ALTER TABLE tasks ADD COLUMN start_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
    ALTER TABLE tasks ADD COLUMN due_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'display_order') THEN
    ALTER TABLE tasks ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_at') THEN
    ALTER TABLE tasks ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
    ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add missing columns to notes table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
    ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'display_order') THEN
    ALTER TABLE notes ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'created_at') THEN
    ALTER TABLE notes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'last_edited') THEN
    ALTER TABLE notes ADD COLUMN last_edited TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add missing columns to rpa_processes table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'user_id') THEN
    ALTER TABLE rpa_processes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'owner') THEN
    ALTER TABLE rpa_processes ADD COLUMN owner TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'department') THEN
    ALTER TABLE rpa_processes ADD COLUMN department TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'entity_name') THEN
    ALTER TABLE rpa_processes ADD COLUMN entity_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'start_date') THEN
    ALTER TABLE rpa_processes ADD COLUMN start_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'due_date') THEN
    ALTER TABLE rpa_processes ADD COLUMN due_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'created_at') THEN
    ALTER TABLE rpa_processes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rpa_processes' AND column_name = 'last_modified') THEN
    ALTER TABLE rpa_processes ADD COLUMN last_modified TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ===========================================
-- CREATE CORRECT TRIGGER FUNCTIONS
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

-- ===========================================
-- CREATE TRIGGERS
-- ===========================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_tasks_updated_at_trigger ON tasks;
DROP TRIGGER IF EXISTS update_notes_last_edited_trigger ON notes;
DROP TRIGGER IF EXISTS update_rpa_processes_last_modified_trigger ON rpa_processes;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;

-- Create new triggers with correct field names
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
-- CREATE INDEXES
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

-- Drop existing policies to avoid conflicts
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
-- SETUP COMPLETE
-- ===========================================
-- ✅ All tables created with correct field names
-- ✅ Triggers use the correct field names (updated_at, last_edited, last_modified)
-- ✅ Indexes created for performance
-- ✅ Row Level Security enabled with proper policies
-- ✅ User isolation implemented
--
-- The database is now ready for the task manager application!