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