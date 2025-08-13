import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Note } from '@/types'
import { cache } from '@/lib/cache'

// Cache keys
const cacheKeys = {
  notes: (userId: string) => `notes:${userId}`,
  note: (userId: string, noteId: string) => `note:${userId}:${noteId}`,
}

// Database record type (matches Supabase schema)
interface DatabaseNote {
  id: string
  user_id: string
  title: string
  content: string
  display_order: number
  created_at: string
  last_edited: string
}

// Transform database record to app format
const transformDbRecord = (record: DatabaseNote): Note => ({
  id: record.id,
  title: record.title,
  content: record.content,
  order: record.display_order,
  createdAt: record.created_at,
  lastEdited: record.last_edited,
})

// Transform app format to database record
const transformToDbRecord = (note: Partial<Note>, userId: string): Partial<DatabaseNote> => ({
  id: note.id,
  user_id: userId,
  title: note.title,
  content: note.content,
  display_order: note.order,
  created_at: note.createdAt,
  last_edited: note.lastEdited,
})

interface NotesStore {
  notes: Note[]
  currentSearch: string
  loading: boolean
  error: string | null
  
  // Actions
  initializeNotes: () => Promise<void>
  addNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'lastEdited'>) => Promise<void>
  updateNote: (id: string, noteData: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  setSearch: (search: string) => void
  reorderNotes: (reorderedNotes: Note[]) => void
  clearError: () => void
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  currentSearch: '',
  loading: false,
  error: null,

  initializeNotes: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Check cache first
      const cacheKey = cacheKeys.notes(user.id)
      const cached = cache.get(cacheKey)
      if (cached && Array.isArray(cached)) {
        set({ notes: cached as Note[], loading: false })
        return
      }

      set({ loading: true, error: null })

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Supabase notes fetch error:', error)
        
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "notes" does not exist')) {
          throw new Error('Database table not found. Please run the database setup script.')
        } else {
          throw new Error(`Failed to fetch notes: ${error.message}`)
        }
      }

      const transformedNotes = (data || []).map(transformDbRecord)
      
      // Cache the results
      cache.set(cacheKey, transformedNotes)
      
      set({ notes: transformedNotes, loading: false })
    } catch (error) {
      console.error('Error initializing notes:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load notes',
        loading: false 
      })
    }
  },

  addNote: async (noteData: Omit<Note, 'id' | 'createdAt' | 'lastEdited'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      set({ loading: true, error: null })

      const { notes } = get()
      const maxOrder = Math.max(...notes.map(n => n.order), 0)
      
      const now = new Date().toISOString()
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: noteData.title as string,
        content: noteData.content as string,
        order: maxOrder + 1,
        createdAt: now,
        lastEdited: now,
      }

      // Optimistic update
      set({ notes: [...notes, newNote] })

      const dbRecord = transformToDbRecord(newNote, user.id)
      const { error } = await supabase
        .from('notes')
        .insert([dbRecord])

      if (error) {
        console.error('Supabase notes error:', error)
        // Rollback optimistic update
        set({ notes })
        
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "notes" does not exist')) {
          throw new Error('Database table not found. Please run the database setup script.')
        } else {
          throw new Error(`Failed to create note: ${error.message}`)
        }
      }

      // Clear cache to force refresh
      cache.delete(cacheKeys.notes(user.id))
      
      set({ loading: false })
    } catch (error) {
      console.error('Error adding note:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create note',
        loading: false 
      })
      throw error
    }
  },

  updateNote: async (id, noteData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      set({ loading: true, error: null })

      const { notes } = get()
      const existingNote = notes.find(n => n.id === id)
      if (!existingNote) {
        throw new Error('Note not found')
      }

      const updatedNote = {
        ...existingNote,
        ...noteData,
        lastEdited: new Date().toISOString(),
      }

      // Optimistic update
      const updatedNotes = notes.map(n => n.id === id ? updatedNote : n)
      set({ notes: updatedNotes })

      const dbRecord = transformToDbRecord(updatedNote, user.id)
      const { error } = await supabase
        .from('notes')
        .update(dbRecord)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        // Rollback optimistic update
        set({ notes })
        throw new Error(`Failed to update note: ${error.message}`)
      }

      // Clear cache
      cache.delete(cacheKeys.notes(user.id))
      cache.delete(cacheKeys.note(user.id, id))
      
      set({ loading: false })
    } catch (error) {
      console.error('Error updating note:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update note',
        loading: false 
      })
    }
  },

  deleteNote: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      set({ loading: true, error: null })

      const { notes } = get()
      
      // Optimistic update
      const filteredNotes = notes.filter(n => n.id !== id)
      set({ notes: filteredNotes })

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        // Rollback optimistic update
        set({ notes })
        throw new Error(`Failed to delete note: ${error.message}`)
      }

      // Clear cache
      cache.delete(cacheKeys.notes(user.id))
      cache.delete(cacheKeys.note(user.id, id))
      
      set({ loading: false })
    } catch (error) {
      console.error('Error deleting note:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete note',
        loading: false 
      })
    }
  },

  setSearch: (search) => {
    set({ currentSearch: search })
  },

  reorderNotes: (reorderedNotes) => {
    set({ notes: reorderedNotes })
    
    // Update display order in background
    const updateOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const updates = reorderedNotes.map((note, index) => ({
          id: note.id,
          display_order: index,
        }))

        for (const update of updates) {
          await supabase
            .from('notes')
            .update({ display_order: update.display_order })
            .eq('id', update.id)
            .eq('user_id', user.id)
        }

        // Clear cache to ensure consistency
        cache.delete(cacheKeys.notes(user.id))
      } catch (error) {
        console.error('Error updating note order:', error)
      }
    }

    updateOrders()
  },

  clearError: () => set({ error: null }),
}))