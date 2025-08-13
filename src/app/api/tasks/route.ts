import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientWithAuth } from '@/lib/supabase-server'
import { secureConsole } from '@/lib/secure-logging'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClientWithAuth()
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      secureConsole.error('Database error:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tasks: data })
  } catch (error) {
    secureConsole.error('Server error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClientWithAuth()
    const body = await request.json()

    const { data, error } = await supabase
      .from('tasks')
      .insert([body])
      .select()
      .single()

    if (error) {
      secureConsole.error('Database error:', error.message)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    secureConsole.error('Server error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}