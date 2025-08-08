-- =====================================================
-- Task Manager Modern - Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TASKS Table
-- =====================================================
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    completed BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
    due_date DATE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later with auth)
CREATE POLICY "Allow all access to tasks" ON public.tasks
    FOR ALL USING (true);

-- Create index for better performance
CREATE INDEX idx_tasks_display_order ON public.tasks(display_order);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- =====================================================
-- 2. NOTES Table
-- =====================================================
CREATE TABLE public.notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_edited TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for notes
CREATE POLICY "Allow all access to notes" ON public.notes
    FOR ALL USING (true);

-- Create index for notes
CREATE INDEX idx_notes_display_order ON public.notes(display_order);
CREATE INDEX idx_notes_created_at ON public.notes(created_at);

-- =====================================================
-- 3. RPA PROCESSES Table
-- =====================================================
CREATE TABLE public.rpa_processes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'draft', 'error')),
    owner TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for RPA processes
ALTER TABLE public.rpa_processes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for RPA processes
CREATE POLICY "Allow all access to rpa_processes" ON public.rpa_processes
    FOR ALL USING (true);

-- Create indexes for RPA processes
CREATE INDEX idx_rpa_processes_status ON public.rpa_processes(status);
CREATE INDEX idx_rpa_processes_department ON public.rpa_processes(department);

-- =====================================================
-- 4. UPDATE TRIGGERS for updated_at/last_modified
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_last_edited_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_edited = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_last_edited BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION update_last_edited_column();

CREATE TRIGGER update_rpa_processes_last_modified BEFORE UPDATE ON public.rpa_processes
    FOR EACH ROW EXECUTE FUNCTION update_last_modified_column();

-- =====================================================
-- 5. INSERT SAMPLE DATA (Your Current Tasks)
-- =====================================================

INSERT INTO public.tasks (title, priority, status, due_date, display_order) VALUES
('Prepare Mom to Parks DRM', 'high', 'Not Started', '2024-08-10', 0),
('Check the errors in the DRM-Send Warning to tenants and centers process', 'high', 'Not Started', '2024-08-08', 1),
('Check the reem''s required processes and prepare the timeline', 'high', 'Not Started', NULL, 2),
('Contact companies to get cost of migration to Power Automate', 'high', 'Not Started', NULL, 3),
('Continue developing the HR weekly report GM Process', 'high', 'Not Started', NULL, 4),
('Clear all fake data from the DMT IOT Platform', 'high', 'Not Started', NULL, 5),
('Check the SMS for all processes', 'high', 'Not Started', NULL, 6),
('Make sure all stakeholders will attend the handover meeting', 'high', 'Not Started', NULL, 7),
('Follow up with Tahaluf team re: handover issues to DRM', 'high', 'Not Started', NULL, 8),
('Discuss next phase with MK & confirm support extension', 'high', 'Not Started', NULL, 9),
('Develop the increasing Area process for AAM', 'high', 'Not Started', NULL, 10),
('Prepare a use case for Microsoft Power Automate', 'high', 'Not Started', NULL, 11),
('Send email to Microsoft regarding the training and migration', 'high', 'Not Started', NULL, 12),
('Check the updating soil data process', 'medium', 'Not Started', NULL, 13),
('Smart Parks Platform development', 'medium', 'Not Started', NULL, 14),
('Continue developing the Task management system', 'medium', 'Not Started', NULL, 15),
('Test all smart park DMT IOT Platform APIs', 'medium', 'Not Started', NULL, 16),
('Read the park''s Policies, check them with Tala', 'low', 'Not Started', NULL, 17),
('Check with Abdullah 360 AI Platform', 'low', 'Not Started', NULL, 18),
('Request access to AKS and Azure AI services', 'low', 'Not Started', NULL, 19);

-- =====================================================
-- 6. HELPFUL QUERIES for Testing
-- =====================================================

-- View all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Count records in each table
-- SELECT 'tasks' as table_name, COUNT(*) as count FROM public.tasks
-- UNION ALL
-- SELECT 'notes' as table_name, COUNT(*) as count FROM public.notes  
-- UNION ALL
-- SELECT 'rpa_processes' as table_name, COUNT(*) as count FROM public.rpa_processes;

-- View all tasks ordered by priority and display order
-- SELECT id, title, priority, status, due_date, display_order 
-- FROM public.tasks 
-- ORDER BY 
--   CASE priority 
--     WHEN 'high' THEN 1 
--     WHEN 'medium' THEN 2 
--     WHEN 'low' THEN 3 
--   END, 
--   display_order;