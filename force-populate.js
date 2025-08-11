const { createClient } = require('@supabase/supabase-js')

// Load environment variables  
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleProcesses = [
  {
    name: 'Invoice Processing Automation',
    description: 'Automates the processing of vendor invoices from receipt to approval, including data extraction, validation, and routing to appropriate approvers.',
    status: 'active',
    owner: 'Finance Team',
    department: 'Finance',
    entity_name: 'Acme Corporation',
    due_date: '2024-09-15'
  },
  {
    name: 'Employee Onboarding Process',
    description: 'Streamlines new employee onboarding by automating account creation, document collection, and system access provisioning.',
    status: 'in-progress',
    owner: 'HR Department',
    department: 'HR',
    entity_name: 'Global Tech Solutions',
    due_date: '2024-08-30'
  },
  {
    name: 'Report Generation Bot',
    description: 'Automatically generates and distributes monthly financial reports to stakeholders, reducing manual effort and ensuring consistency.',
    status: 'completed',
    owner: 'IT Operations',
    department: 'IT',
    entity_name: 'TechFlow Industries',
    due_date: '2024-07-20'
  }
]

async function forcePopulate() {
  try {
    console.log('🚀 Force populating RPA processes...')
    
    // First, let's check the current table structure
    const { data: existingData, error: structureError } = await supabase
      .from('rpa_processes')
      .select('*')
      .limit(1)
    
    if (structureError) {
      console.error('❌ Table structure error:', structureError.message)
      console.log('💡 This suggests the table might not exist or have wrong structure.')
      
      // Let's try to see what tables exist
      console.log('🔍 Checking available tables...')
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (!tablesError && tables) {
        console.log('📋 Available tables:', tables.map(t => t.table_name))
      }
      
      return
    }
    
    console.log('✅ Table structure OK')
    
    // Try to insert one record at a time to see which fails
    for (let i = 0; i < sampleProcesses.length; i++) {
      const process = sampleProcesses[i]
      console.log(`📝 Inserting process ${i + 1}: ${process.name}`)
      
      const { data, error } = await supabase
        .from('rpa_processes')
        .insert([process])
        .select()
      
      if (error) {
        console.error(`❌ Failed to insert process ${i + 1}:`, error.message)
        console.error('   Error details:', error)
        
        // If it's an RLS error, let's check if we can query anything
        if (error.code === '42501') {
          console.log('🔐 RLS policy is blocking the insert')
          console.log('💡 Checking if we can read from the table...')
          
          const { data: readTest, error: readError } = await supabase
            .from('rpa_processes')
            .select('count(*)')
          
          if (readError) {
            console.error('❌ Can\'t even read from table:', readError.message)
          } else {
            console.log('✅ Can read from table, RLS is blocking writes only')
          }
        }
        
        break
      } else {
        console.log(`✅ Successfully inserted: ${process.name}`)
      }
    }
    
    // Final check
    const { data: finalCheck, error: finalError } = await supabase
      .from('rpa_processes')
      .select('count(*)')
    
    if (!finalError && finalCheck) {
      console.log(`📊 Final count: ${finalCheck.length > 0 ? finalCheck[0].count : 0} processes`)
    }
    
  } catch (error) {
    console.error('❌ Force populate failed:', error.message)
  }
}

forcePopulate()