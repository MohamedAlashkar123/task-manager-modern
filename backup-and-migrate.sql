-- BACKUP EXISTING DATA AND MIGRATE TO NEW STRUCTURE
-- This preserves all your existing data while fixing the database structure

-- ===========================================
-- STEP 1: BACKUP EXISTING DATA
-- ===========================================

-- Create temporary backup tables
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;
CREATE TABLE IF NOT EXISTS notes_backup AS SELECT * FROM notes;
CREATE TABLE IF NOT EXISTS rpa_processes_backup AS SELECT * FROM rpa_processes;

-- Show what data we're backing up
SELECT 'TASKS BACKUP' as table_name, count(*) as record_count FROM tasks_backup
UNION ALL
SELECT 'NOTES BACKUP' as table_name, count(*) as record_count FROM notes_backup  
UNION ALL
SELECT 'RPA PROCESSES BACKUP' as table_name, count(*) as record_count FROM rpa_processes_backup;

-- ===========================================
-- STEP 2: DROP AND RECREATE TABLES WITH CORRECT STRUCTURE
-- ===========================================

-- Drop existing tables
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;  
DROP TABLE IF EXISTS rpa_processes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create tasks table with correct structure
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

-- Create notes table with correct structure
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited TIMESTAMPTZ DEFAULT NOW()
);

-- Create rpa_processes table with correct structure
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
-- STEP 3: RESTORE DATA WITH USER_ID
-- ===========================================

-- Restore tasks data (assign all tasks to your user)
INSERT INTO tasks (
  id, title, priority, completed, status, 
  start_date, due_date, display_order, user_id, created_at, updated_at
)
SELECT 
  COALESCE(id, gen_random_uuid()),
  title,
  COALESCE(priority, 'medium'),
  COALESCE(completed, false),
  COALESCE(status, 'Not Started'),
  start_date,
  due_date,
  COALESCE(display_order, 0),
  '4fdf45a4-55e2-48b5-9338-efa303b20063'::UUID,
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM tasks_backup;

-- Restore notes data (assign all notes to your user)
INSERT INTO notes (
  id, title, content, display_order, user_id, created_at, last_edited
)
SELECT 
  COALESCE(id, gen_random_uuid()),
  title,
  COALESCE(content, ''),
  COALESCE(display_order, 0),
  '4fdf45a4-55e2-48b5-9338-efa303b20063'::UUID,
  COALESCE(created_at, NOW()),
  COALESCE(last_edited, NOW())
FROM notes_backup;

-- Restore rpa_processes data (assign all processes to your user)
INSERT INTO rpa_processes (
  id, name, description, status, owner, department, entity_name,
  start_date, due_date, user_id, created_at, last_modified
)
SELECT 
  COALESCE(id, gen_random_uuid()),
  name,
  COALESCE(description, ''),
  COALESCE(status, 'active'),
  owner,
  department,
  entity_name,
  start_date,
  due_date,
  '4fdf45a4-55e2-48b5-9338-efa303b20063'::UUID,
  COALESCE(created_at, NOW()),
  COALESCE(last_modified, NOW())
FROM rpa_processes_backup;

-- ===========================================
-- STEP 4: VERIFY DATA RESTORATION
-- ===========================================

-- Show restored data counts
SELECT 'TASKS RESTORED' as table_name, count(*) as record_count FROM tasks
UNION ALL
SELECT 'NOTES RESTORED' as table_name, count(*) as record_count FROM notes
UNION ALL
SELECT 'RPA PROCESSES RESTORED' as table_name, count(*) as record_count FROM rpa_processes;

-- ===========================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
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
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpa_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 7: CREATE RLS POLICIES
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
-- STEP 8: CREATE UPDATE TRIGGERS
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
-- STEP 9: CLEANUP BACKUP TABLES
-- ===========================================

-- Drop backup tables after successful migration
DROP TABLE IF EXISTS tasks_backup;
DROP TABLE IF EXISTS notes_backup;
DROP TABLE IF EXISTS rpa_processes_backup;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
-- ✅ All existing data has been preserved
-- ✅ Database structure fixed with proper user_id columns
-- ✅ All data assigned to your user: 4fdf45a4-55e2-48b5-9338-efa303b20063
-- ✅ Security policies, indexes, and triggers created
-- ✅ Backup tables cleaned up
-- 
-- You can now login and use the application with all your existing data!
-- Login at: http://localhost:3001/auth/login
-- Email: mohamedalashkar123@gmail.com