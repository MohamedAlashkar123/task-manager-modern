const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addMissingColumns() {
  try {
    console.log('🚀 Checking current table structure...')
    
    // First, let's see what columns currently exist
    const { data: existingData, error: queryError } = await supabase
      .from('rpa_processes')
      .select('*')
      .limit(1)
    
    if (queryError) {
      console.error('❌ Could not query table:', queryError.message)
      return
    }
    
    console.log('📋 Current table structure detected')
    if (existingData && existingData.length > 0) {
      console.log('🔍 Sample record keys:', Object.keys(existingData[0]))
    }
    
    // Try to add the entity_name column if it doesn't exist
    console.log('🔧 Attempting to add entity_name column...')
    try {
      const { data: testEntityName } = await supabase
        .from('rpa_processes')
        .select('entity_name')
        .limit(1)
      
      console.log('✅ entity_name column already exists')
    } catch (error) {
      console.log('➕ entity_name column needs to be added')
    }
    
    // Try to add the due_date column if it doesn't exist  
    console.log('🔧 Attempting to add due_date column...')
    try {
      const { data: testDueDate } = await supabase
        .from('rpa_processes')
        .select('due_date')
        .limit(1)
      
      console.log('✅ due_date column already exists')
    } catch (error) {
      console.log('➕ due_date column needs to be added')
    }
    
    console.log('💡 To add the missing columns, you need to run the SQL migration directly in Supabase.')
    console.log('💡 Please go to your Supabase dashboard > SQL Editor and run the migration.')
    console.log('💡 Here are the key SQL commands you need:')
    console.log('')
    console.log('-- Add missing columns:')
    console.log('ALTER TABLE public.rpa_processes ADD COLUMN IF NOT EXISTS entity_name TEXT;')
    console.log('ALTER TABLE public.rpa_processes ADD COLUMN IF NOT EXISTS due_date DATE;')
    console.log('')
    console.log('-- Update status constraint:')
    console.log('ALTER TABLE public.rpa_processes DROP CONSTRAINT IF EXISTS rpa_processes_status_check;')
    console.log(`ALTER TABLE public.rpa_processes ADD CONSTRAINT rpa_processes_status_check CHECK (status IN ('active', 'in-progress', 'completed', 'on-hold'));`)
    console.log('')
    console.log('-- Then run the populate-rpa.js script again')
    
  } catch (error) {
    console.error('❌ Failed to check table structure:', error)
  }
}

addMissingColumns()