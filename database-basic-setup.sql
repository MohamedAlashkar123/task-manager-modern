-- BASIC DATABASE SETUP - Run this first in Supabase SQL Editor
-- Creates the essential table structure for the task manager app

-- ===========================================
-- CREATE BASIC TABLES FROM SCRATCH
-- ===========================================

-- Drop existing tables if they exist (BE CAREFUL - this will delete data)
-- Comment out these DROP statements if you want to keep existing data
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;  
DROP TABLE IF EXISTS rpa_processes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create tasks table
CREATE TABLE tasks (
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

-- Create notes table  
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited TIMESTAMPTZ DEFAULT NOW()
);

-- Create rpa_processes table
CREATE TABLE rpa_processes (
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

-- Create user_profiles table
CREATE TABLE user_profiles (
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
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_display_order ON tasks(display_order);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Notes indexes  
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_display_order ON notes(display_order);
CREATE INDEX idx_notes_created_at ON notes(created_at);

-- RPA Processes indexes
CREATE INDEX idx_rpa_processes_user_id ON rpa_processes(user_id);
CREATE INDEX idx_rpa_processes_status ON rpa_processes(status);
CREATE INDEX idx_rpa_processes_created_at ON rpa_processes(created_at);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

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
-- SETUP COMPLETE
-- ===========================================
-- ✅ All tables created with correct structure
-- ✅ All required columns including user_id
-- ✅ Row Level Security enabled
-- ✅ Proper indexes for performance
-- ✅ Update triggers for timestamps
-- 
-- You can now create a user account and use the application!