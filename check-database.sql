-- CHECK EXISTING DATABASE STRUCTURE
-- Run this first to see what tables and columns exist

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check columns in tasks table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check columns in notes table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check columns in rpa_processes table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'rpa_processes' AND table_schema = 'public'
ORDER BY ordinal_position;