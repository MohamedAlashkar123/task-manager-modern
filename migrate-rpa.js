const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing')
  console.log('SUPABASE_KEY:', supabaseServiceKey ? '✓ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting RPA processes migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase-rpa-migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      })
      
      if (error) {
        console.warn(`⚠️  Statement ${i + 1} failed:`, error.message)
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} completed`)
      }
    }
    
    // Verify the data was inserted
    console.log('🔍 Verifying RPA processes data...')
    const { data: processes, error: queryError } = await supabase
      .from('rpa_processes')
      .select('*')
    
    if (queryError) {
      console.error('❌ Error querying RPA processes:', queryError)
    } else {
      console.log(`✅ Migration completed! Found ${processes.length} RPA processes in database`)
      console.log('📊 Sample processes:')
      processes.slice(0, 3).forEach(p => {
        console.log(`  - ${p.name} (${p.status}) - Due: ${p.due_date || 'No due date'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()