-- =====================================================
-- Fix RLS Policies and Populate RPA Processes Table
-- =====================================================

-- First, let's ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS public.rpa_processes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    owner TEXT DEFAULT '',
    department TEXT DEFAULT '',
    entity_name TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE public.rpa_processes 
ADD COLUMN IF NOT EXISTS entity_name TEXT;

ALTER TABLE public.rpa_processes 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Fix the status constraint
ALTER TABLE public.rpa_processes 
DROP CONSTRAINT IF EXISTS rpa_processes_status_check;

ALTER TABLE public.rpa_processes 
ADD CONSTRAINT rpa_processes_status_check 
CHECK (status IN ('active', 'in-progress', 'completed', 'on-hold'));

-- Enable RLS
ALTER TABLE public.rpa_processes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to rpa_processes" ON public.rpa_processes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rpa_processes;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.rpa_processes;
DROP POLICY IF EXISTS "Enable update for all users" ON public.rpa_processes;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.rpa_processes;

-- Create comprehensive policies that allow all operations
CREATE POLICY "Enable read access for all users" ON public.rpa_processes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.rpa_processes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.rpa_processes
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON public.rpa_processes
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rpa_processes_status ON public.rpa_processes(status);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_department ON public.rpa_processes(department);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_due_date ON public.rpa_processes(due_date);
CREATE INDEX IF NOT EXISTS idx_rpa_processes_entity_name ON public.rpa_processes(entity_name);

-- Clear existing data and insert sample processes
DELETE FROM public.rpa_processes;

-- Insert sample RPA processes with all fields
INSERT INTO public.rpa_processes (name, description, status, owner, department, entity_name, due_date) VALUES
('Invoice Processing Automation', 'Automates the processing of vendor invoices from receipt to approval, including data extraction, validation, and routing to appropriate approvers.', 'active', 'Finance Team', 'Finance', 'Acme Corporation', '2024-09-15'),
('Employee Onboarding Process', 'Streamlines new employee onboarding by automating account creation, document collection, and system access provisioning.', 'in-progress', 'HR Department', 'HR', 'Global Tech Solutions', '2024-08-30'),
('Report Generation Bot', 'Automatically generates and distributes monthly financial reports to stakeholders, reducing manual effort and ensuring consistency.', 'completed', 'IT Operations', 'IT', 'TechFlow Industries', '2024-07-20'),
('Customer Data Migration', 'Migrates customer data from legacy CRM system to new platform with data validation and error handling.', 'on-hold', 'Sales Operations', 'Sales', 'InnovaCorp Ltd', '2024-10-10'),
('Purchase Order Automation', 'Automates purchase order processing from request to approval and vendor notification.', 'active', 'Procurement Team', 'Procurement', 'MegaCorp Industries', '2024-09-01'),
('Quality Assurance Reporting', 'Automated quality assurance reporting system that compiles test results and generates compliance reports.', 'in-progress', 'QA Team', 'Quality', 'TechFlow Industries', '2024-08-25');

-- Create update trigger for last_modified
CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rpa_processes_last_modified ON public.rpa_processes;
CREATE TRIGGER update_rpa_processes_last_modified 
    BEFORE UPDATE ON public.rpa_processes
    FOR EACH ROW EXECUTE FUNCTION update_last_modified_column();

-- Verify the setup
SELECT 
    'SUCCESS: ' || COUNT(*) || ' RPA processes created' as result
FROM public.rpa_processes;

-- Show the data
SELECT 
    id, 
    name, 
    status, 
    entity_name, 
    due_date,
    owner,
    department
FROM public.rpa_processes 
ORDER BY created_at;