import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientWithAuth } from '@/lib/supabase-server'
import { secureConsole } from '@/lib/secure-logging'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClientWithAuth()
    const body = await request.json()
    const { id } = await params

    const { data, error } = await supabase
      .from('tasks')
      .update(body)
      .match({ id })
      .select()
      .single()

    if (error) {
      secureConsole.error('Database error:', error.message)
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    return NextResponse.json({ task: data })
  } catch (error) {
    secureConsole.error('Server error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClientWithAuth()
    const { id } = await params

    const { error } = await supabase
      .from('tasks')
      .delete()
      .match({ id })

    if (error) {
      secureConsole.error('Database error:', error.message)
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    secureConsole.error('Server error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}