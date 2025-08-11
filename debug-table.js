const { createClient } = require('@supabase/supabase-js')

// Load environment variables  
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTable() {
  try {
    console.log('🔍 Debugging table structure...')
    
    // Check what's in the table
    const { data: allRecords, error: allError } = await supabase
      .from('rpa_processes')  
      .select('*')
    
    if (allError) {
      console.error('❌ Error fetching all records:', allError)
      return
    }
    
    console.log(`📊 Found ${allRecords.length} records in rpa_processes table`)
    
    if (allRecords.length > 0) {
      console.log('📋 Available columns:')
      console.log(Object.keys(allRecords[0]))
      
      console.log('\n🔍 Sample record:')
      console.log(JSON.stringify(allRecords[0], null, 2))
    } else {
      console.log('📋 Table is empty, let me try to insert a simple test record...')
      
      // Try minimal insert first
      const testRecord = {
        name: 'Test Process',
        description: 'Test Description',
        status: 'active'
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('rpa_processes')
        .insert([testRecord])
        .select()
      
      if (insertError) {
        console.error('❌ Failed to insert test record:', insertError)
      } else {
        console.log('✅ Test record inserted successfully!')
        console.log('📋 Available columns after insert:')
        console.log(Object.keys(insertData[0]))
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugTable()