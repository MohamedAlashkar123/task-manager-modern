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
  reorderNotes: (draggedNoteId: string, afterNoteId: string | null) => void
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
      
      reorderNotes: (draggedNoteId, afterNoteId) => set((state) => {
        const draggedNoteIndex = state.notes.findIndex(note => note.id === draggedNoteId)
        const draggedNote = state.notes[draggedNoteIndex]
        
        if (!draggedNote) return state
        
        const newNotes = state.notes.filter(note => note.id !== draggedNoteId)
        
        if (afterNoteId === null) {
          newNotes.push(draggedNote)
        } else {
          const afterIndex = newNotes.findIndex(note => note.id === afterNoteId)
          newNotes.splice(afterIndex, 0, draggedNote)
        }
        
        // Update order
        const updatedNotes = newNotes.map((note, index) => ({
          ...note,
          order: index,
          lastEdited: new Date().toISOString()
        }))
        
        return { notes: updatedNotes }
      }),
    }),
    {
      name: 'notes-storage',
    }
  )
)