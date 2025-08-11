-- =====================================================
-- RPA Processes Table Migration - Add Due Date and Entity Name
-- =====================================================

-- 1. Add entity_name column
ALTER TABLE public.rpa_processes 
ADD COLUMN IF NOT EXISTS entity_name TEXT;

-- 2. Add due_date column
ALTER TABLE public.rpa_processes 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- 3. Update status constraint to match frontend expectations
ALTER TABLE public.rpa_processes 
DROP CONSTRAINT IF EXISTS rpa_processes_status_check;

ALTER TABLE public.rpa_processes 
ADD CONSTRAINT rpa_processes_status_check 
CHECK (status IN ('active', 'in-progress', 'completed', 'on-hold'));

-- 4. Update existing records to use correct status values (if any exist)
UPDATE public.rpa_processes 
SET status = CASE 
    WHEN status = 'inactive' THEN 'on-hold'
    WHEN status = 'draft' THEN 'active'
    WHEN status = 'error' THEN 'on-hold'
    ELSE status 
END;

-- 5. Create index for due_date for better query performance
CREATE INDEX IF NOT EXISTS idx_rpa_processes_due_date ON public.rpa_processes(due_date);

-- 6. Create index for entity_name for better query performance
CREATE INDEX IF NOT EXISTS idx_rpa_processes_entity_name ON public.rpa_processes(entity_name);

-- 7. Clear any existing sample data and insert new sample data with all fields
DELETE FROM public.rpa_processes;

INSERT INTO public.rpa_processes (name, description, status, owner, department, entity_name, due_date) VALUES
('Invoice Processing Automation', 'Automates the processing of vendor invoices from receipt to approval, including data extraction, validation, and routing to appropriate approvers.', 'active', 'Finance Team', 'Finance', 'Acme Corporation', '2024-09-15'),
('Employee Onboarding Process', 'Streamlines new employee onboarding by automating account creation, document collection, and system access provisioning.', 'in-progress', 'HR Department', 'HR', 'Global Tech Solutions', '2024-08-30'),
('Report Generation Bot', 'Automatically generates and distributes monthly financial reports to stakeholders, reducing manual effort and ensuring consistency.', 'completed', 'IT Operations', 'IT', 'TechFlow Industries', '2024-07-20'),
('Customer Data Migration', 'Migrates customer data from legacy CRM system to new platform with data validation and error handling.', 'on-hold', 'Sales Operations', 'Sales', 'InnovaCorp Ltd', '2024-10-10'),
('Purchase Order Automation', 'Automates purchase order processing from request to approval and vendor notification.', 'active', 'Procurement Team', 'Procurement', 'MegaCorp Industries', '2024-09-01'),
('Quality Assurance Reporting', 'Automated quality assurance reporting system that compiles test results and generates compliance reports.', 'in-progress', 'QA Team', 'Quality', 'TechFlow Industries', '2024-08-25');

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Verify the migration worked correctly
-- SELECT 
--     id, 
--     name, 
--     status, 
--     owner, 
--     department, 
--     entity_name, 
--     due_date,
--     created_at,
--     last_modified
-- FROM public.rpa_processes 
-- ORDER BY created_at;

-- Check column exists
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'rpa_processes' 
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;