const { createClient } = require('@supabase/supabase-js')

// Load environment variables  
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSetup() {
  try {
    console.log('🔍 Checking database after setup...')
    
    // Test database connection
    const { data: processes, error: queryError } = await supabase
      .from('rpa_processes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (queryError) {
      console.error('❌ Database query error:', queryError.message)
      return
    }
    
    if (processes.length === 0) {
      console.log('❌ Still no processes found!')
      console.log('💡 Please follow the steps in POPULATE_DATABASE.md')
      console.log('💡 Make sure to run the SQL script in your Supabase dashboard')
      return
    }
    
    console.log(`🎉 SUCCESS! Found ${processes.length} RPA processes`)
    console.log('✅ Database is properly populated')
    console.log('')
    console.log('📋 Your RPA Processes:')
    
    processes.forEach((process, i) => {
      console.log(`\n  ${i + 1}. ${process.name}`)
      console.log(`     📊 Status: ${process.status}`)
      console.log(`     🏢 Entity: ${process.entity_name || 'No entity'}`)
      console.log(`     📅 Due: ${process.due_date || 'No due date'}`)
      console.log(`     👤 Owner: ${process.owner || 'No owner'}`)
      console.log(`     🏛️  Dept: ${process.department || 'No department'}`)
    })
    
    console.log('\n🚀 Your app should now show all processes!')
    console.log('📱 Visit: http://localhost:3000/rpa-processes')
    
  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkSetup()