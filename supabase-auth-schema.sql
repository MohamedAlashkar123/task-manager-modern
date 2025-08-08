-- =====================================================
-- Task Manager - Authentication & Authorization Schema
-- =====================================================

-- First, let's add user_id columns to existing tables
ALTER TABLE public.tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.rpa_processes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_rpa_processes_user_id ON public.rpa_processes(user_id);

-- =====================================================
-- User Profiles Table
-- =====================================================
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- User can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- Update RLS Policies for User-Specific Data
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access to notes" ON public.notes;
DROP POLICY IF EXISTS "Allow all access to rpa_processes" ON public.rpa_processes;

-- Tasks - User can only see/manage their own tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Notes - User can only see/manage their own notes
CREATE POLICY "Users can view own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- RPA Processes - User can only see/manage their own processes
CREATE POLICY "Users can view own rpa_processes" ON public.rpa_processes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rpa_processes" ON public.rpa_processes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rpa_processes" ON public.rpa_processes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rpa_processes" ON public.rpa_processes
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Functions for User Profile Management
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user profile with auth context
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT up.id, up.email, up.full_name, up.avatar_url, up.created_at, up.updated_at
    FROM public.user_profiles up
    WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Update Helper Functions with User Context
-- =====================================================

-- Function to increment display_order for user's tasks only
CREATE OR REPLACE FUNCTION increment_user_task_display_order()
RETURNS void AS $$
BEGIN
    UPDATE public.tasks 
    SET display_order = display_order + 1
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk update task order for user
CREATE OR REPLACE FUNCTION bulk_update_user_task_order(updates jsonb)
RETURNS void AS $$
DECLARE
    update_record jsonb;
BEGIN
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        UPDATE public.tasks 
        SET display_order = (update_record->>'display_order')::integer,
            updated_at = NOW()
        WHERE id = (update_record->>'id')::uuid 
        AND user_id = auth.uid();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's tasks with proper ordering
CREATE OR REPLACE FUNCTION get_user_tasks_ordered()
RETURNS TABLE (
    id uuid,
    title text,
    priority text,
    completed boolean,
    status text,
    due_date date,
    display_order integer,
    created_at timestamptz,
    updated_at timestamptz,
    user_id uuid
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.title, t.priority, t.completed, t.status, 
           t.due_date, t.display_order, t.created_at, t.updated_at, t.user_id
    FROM public.tasks t
    WHERE t.user_id = auth.uid()
    ORDER BY 
        CASE t.priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
        END,
        t.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Sample Data Migration (Optional)
-- =====================================================

-- If you want to migrate existing sample data to a specific user,
-- you'll need to first create a user account, then run:
-- 
-- UPDATE public.tasks SET user_id = 'your-user-id-here' WHERE user_id IS NULL;
-- UPDATE public.notes SET user_id = 'your-user-id-here' WHERE user_id IS NULL;
-- UPDATE public.rpa_processes SET user_id = 'your-user-id-here' WHERE user_id IS NULL;

-- =====================================================
-- Enable Realtime for authenticated users
-- =====================================================

-- Enable realtime on tables (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rpa_processes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check RLS policies are in place
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE schemaname = 'public';

-- Check user profiles table structure
-- \d public.user_profiles;

-- Test user context (run after authentication)
-- SELECT auth.uid(), auth.email();
-- SELECT * FROM get_user_profile();