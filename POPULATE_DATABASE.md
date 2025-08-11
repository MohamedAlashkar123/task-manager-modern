# 🚀 Quick Database Setup Guide

## Why you're seeing "No RPA processes found"

Your app is now connected to Supabase, but the database table is empty. You need to run one SQL script to add the sample data.

## Step-by-Step Setup (5 minutes)

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard/projects
- Click on your project: `pvrcuacpmcfkhqolyfhc`

### 2. Navigate to SQL Editor
- In the left sidebar, click on **"SQL Editor"**
- Click **"New query"** (or use the existing blank query)

### 3. Copy and Paste This SQL

```sql
-- Add missing columns if they don't exist
ALTER TABLE public.rpa_processes 
ADD COLUMN IF NOT EXISTS entity_name TEXT;

ALTER TABLE public.rpa_processes 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Update status constraint to match frontend
ALTER TABLE public.rpa_processes 
DROP CONSTRAINT IF EXISTS rpa_processes_status_check;

ALTER TABLE public.rpa_processes 
ADD CONSTRAINT rpa_processes_status_check 
CHECK (status IN ('active', 'in-progress', 'completed', 'on-hold'));

-- Clear any existing data and add sample processes
DELETE FROM public.rpa_processes;

INSERT INTO public.rpa_processes (name, description, status, owner, department, entity_name, due_date) VALUES
('Invoice Processing Automation', 'Automates the processing of vendor invoices from receipt to approval, including data extraction, validation, and routing to appropriate approvers.', 'active', 'Finance Team', 'Finance', 'Acme Corporation', '2024-09-15'),
('Employee Onboarding Process', 'Streamlines new employee onboarding by automating account creation, document collection, and system access provisioning.', 'in-progress', 'HR Department', 'HR', 'Global Tech Solutions', '2024-08-30'),
('Report Generation Bot', 'Automatically generates and distributes monthly financial reports to stakeholders, reducing manual effort and ensuring consistency.', 'completed', 'IT Operations', 'IT', 'TechFlow Industries', '2024-07-20'),
('Customer Data Migration', 'Migrates customer data from legacy CRM system to new platform with data validation and error handling.', 'on-hold', 'Sales Operations', 'Sales', 'InnovaCorp Ltd', '2024-10-10'),
('Purchase Order Automation', 'Automates purchase order processing from request to approval and vendor notification.', 'active', 'Procurement Team', 'Procurement', 'MegaCorp Industries', '2024-09-01'),
('Quality Assurance Reporting', 'Automated quality assurance reporting system that compiles test results and generates compliance reports.', 'in-progress', 'QA Team', 'Quality', 'TechFlow Industries', '2024-08-25');

-- Verify the data was inserted
SELECT 
    id, 
    name, 
    status, 
    entity_name, 
    due_date
FROM public.rpa_processes 
ORDER BY created_at;
```

### 4. Run the SQL
- Click the **"Run"** button (or press `Ctrl+Enter`)
- You should see a success message and 6 rows returned

### 5. Verify in Table Editor
- Go to **"Table Editor"** in the left sidebar
- Click on **"rpa_processes"** table
- You should see 6 processes with entity names and due dates

## Expected Result

After running the SQL, you should see:
- ✅ 6 RPA processes in your database
- ✅ Each process has an entity name and due date
- ✅ Processes have different statuses (active, in-progress, completed, on-hold)

## Test Your App

1. Refresh your RPA processes page: `/rpa-processes`
2. You should now see 6 processes with:
   - Color-coded due date indicators
   - Entity names displayed
   - Proper status badges
   - Working drag-and-drop

## Troubleshooting

If you still see "No RPA processes found":

1. **Check the SQL ran successfully** - Look for success messages in Supabase
2. **Verify data in Table Editor** - Go to Table Editor > rpa_processes
3. **Check browser console** - Look for any error messages
4. **Test connection** - Run: `node test-connection.js` in your terminal

## Quick Test Commands

```bash
# Test database connection
cd "/home/mohamed/work/Projects/Daily Tasks manager - Enhanced/task-manager-modern"
node test-connection.js

# Start your app
npm run dev
```

Once the SQL is executed, your app will show all 6 processes with due dates and entity information!