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

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    console.log('🌐 URL:', supabaseUrl)
    
    // Test database connection
    const { data: processes, error: queryError } = await supabase
      .from('rpa_processes')
      .select('id, name, status, entity_name, due_date')
      .limit(5)
    
    if (queryError) {
      console.error('❌ Database query error:', queryError.message)
      return
    }
    
    console.log(`✅ Connection successful! Found ${processes.length} RPA processes`)
    
    if (processes.length > 0) {
      console.log('📋 Sample processes:')
      processes.forEach((process, i) => {
        console.log(`  ${i + 1}. ${process.name}`)
        console.log(`     Status: ${process.status}`)
        console.log(`     Entity: ${process.entity_name || 'N/A'}`) 
        console.log(`     Due: ${process.due_date || 'No due date'}`)
        console.log()
      })
    } else {
      console.log('📋 Database is empty. Please run the SQL migration in your Supabase dashboard.')
      console.log('💡 Check setup-supabase.md for instructions.')
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
  }
}

testConnection()