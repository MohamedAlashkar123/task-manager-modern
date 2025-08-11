import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Note } from '@/types'

interface NotesState {
  notes: Note[]
  currentSearch: string
  
  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'lastEdited'>) => void
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void
  deleteNote: (id: string) => void
  setSearch: (search: string) => void
  reorderNotes: (reorderedNotes: Note[]) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      currentSearch: '',
      
      addNote: (noteData) => set((state) => {
        const now = new Date().toISOString()
        const newNote: Note = {
          ...noteData,
          id: Date.now().toString(),
          createdAt: now,
          lastEdited: now,
        }
        
        // Update order for existing notes
        const updatedNotes = state.notes.map(note => ({
          ...note,
          order: note.order + 1
        }))
        
        return {
          notes: [newNote, ...updatedNotes]
        }
      }),
      
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note =>
          note.id === id 
            ? { ...note, ...updates, lastEdited: new Date().toISOString() }
            : note
        )
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id)
      })),
      
      setSearch: (search) => set({ currentSearch: search }),
      
      reorderNotes: (reorderedNotes) => set(() => {
        const now = new Date().toISOString()
        const updatedNotes = reorderedNotes.map((note, index) => ({
          ...note,
          order: index,
          lastEdited: now
        }))
        
        return { notes: updatedNotes }
      }),
    }),
    {
      name: 'notes-storage',
    }
  )
)