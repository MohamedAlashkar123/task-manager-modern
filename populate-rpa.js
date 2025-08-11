const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing')
  console.log('SUPABASE_KEY:', supabaseKey ? '✓ Set' : '❌ Missing')
  process.exit(1)
}

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
  },
  {
    name: 'Customer Data Migration',
    description: 'Migrates customer data from legacy CRM system to new platform with data validation and error handling.',
    status: 'on-hold',
    owner: 'Sales Operations',
    department: 'Sales',
    entity_name: 'InnovaCorp Ltd',
    due_date: '2024-10-10'
  },
  {
    name: 'Purchase Order Automation',
    description: 'Automates purchase order processing from request to approval and vendor notification.',
    status: 'active',
    owner: 'Procurement Team',
    department: 'Procurement',
    entity_name: 'MegaCorp Industries',
    due_date: '2024-09-01'
  },
  {
    name: 'Quality Assurance Reporting',
    description: 'Automated quality assurance reporting system that compiles test results and generates compliance reports.',
    status: 'in-progress',
    owner: 'QA Team',
    department: 'Quality',
    entity_name: 'TechFlow Industries',
    due_date: '2024-08-25'
  }
]

async function populateRPAProcesses() {
  try {
    console.log('🚀 Starting RPA processes population...')
    
    // First, check if the table exists and what columns it has
    console.log('🔍 Checking table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('rpa_processes')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table access error:', tableError.message)
      console.log('💡 The table might not exist or columns might be missing.')
      console.log('💡 Please run the schema migration first or check your database.')
      return
    }
    
    // Clear existing data
    console.log('🗑️  Clearing existing RPA processes...')
    const { error: deleteError } = await supabase
      .from('rpa_processes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.warn('⚠️  Could not clear existing data:', deleteError.message)
    } else {
      console.log('✅ Existing data cleared')
    }
    
    // Insert new sample data
    console.log('📝 Inserting sample RPA processes...')
    const { data, error } = await supabase
      .from('rpa_processes')
      .insert(sampleProcesses)
      .select()
    
    if (error) {
      console.error('❌ Insert error:', error.message)
      console.log('💡 Error details:', error)
      
      // Try to get more info about the table structure
      console.log('🔍 Let me check what went wrong...')
      
      // Try inserting one record to see the exact error
      const { data: singleTest, error: singleError } = await supabase
        .from('rpa_processes')
        .insert([sampleProcesses[0]])
        .select()
      
      if (singleError) {
        console.error('❌ Single insert error:', singleError.message)
        console.log('💡 This suggests the table structure might be different than expected.')
      }
      
      return
    }
    
    console.log(`✅ Successfully inserted ${data?.length || sampleProcesses.length} RPA processes!`)
    
    // Verify the data was inserted
    console.log('🔍 Verifying data...')
    const { data: allProcesses, error: queryError } = await supabase
      .from('rpa_processes')
      .select('*')
    
    if (queryError) {
      console.error('❌ Query error:', queryError.message)
    } else {
      console.log(`📊 Total processes in database: ${allProcesses.length}`)
      console.log('📋 Sample processes:')
      allProcesses.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (${p.status}) - Due: ${p.due_date || 'No due date'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Population failed:', error)
  }
}

populateRPAProcesses()