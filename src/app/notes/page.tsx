'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { NoteCard } from '@/components/notes/note-card'
import { NoteFormDialog } from '@/components/notes/note-form-dialog'
import { NotesSearch } from '@/components/notes/notes-search'
import { SortableLayout } from '@/components/layout/SortableLayout'
import { useNotesStore } from '@/store/notes-supabase'
import { useRequireAuth } from '@/contexts/AuthContext'
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences'
import { Note } from '@/types'

export default function NotesPage() {
  // Require authentication for this page
  const { user, loading: authLoading } = useRequireAuth()
  
  const { 
    notes, 
    currentSearch, 
    error,
    deleteNote, 
    reorderNotes,
    initializeNotes,
    clearError
  } = useNotesStore()
  const { preferences, setViewMode, isLoaded } = useLayoutPreferences('notes-layout')
  const [selectedNote, setSelectedNote] = useState<Note | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  // Initialize notes from Supabase when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      initializeNotes()
    }
  }, [user, authLoading, initializeNotes])

  const filteredNotes = notes.filter(note => {
    if (!currentSearch) return true
    const searchTerm = currentSearch.toLowerCase()
    return (
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    )
  })

  const sortedNotes = filteredNotes.sort((a, b) => {
    if (!currentSearch) {
      return a.order - b.order
    }
    return new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
  })

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setIsFormOpen(true)
  }

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId)
  }

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete)
      setNoteToDelete(null)
    }
  }

  // Show loading if auth is still loading
  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[200px]">Loading your notes...</div>
  }

  // This will redirect to login if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <Header 
        title="Notes" 
        subtitle="Organize your thoughts and ideas" 
      />
      
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
      
      <NotesSearch />
      
      {sortedNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">No notes found</h3>
          <p className="text-muted-foreground mb-4">
            {currentSearch 
              ? 'Try adjusting your search terms'
              : 'Create your first note to get started'
            }
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Note
          </Button>
        </div>
      ) : (
        <SortableLayout
          items={sortedNotes}
          onReorder={reorderNotes}
          viewMode={preferences.viewMode}
          onViewModeChange={setViewMode}
          renderItem={(note, isDragging) => (
            <NoteCard
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              viewMode={preferences.viewMode}
              isDragging={isDragging}
            />
          )}
          renderDragOverlay={(note) => (
            <NoteCard
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              viewMode={preferences.viewMode}
              isDragging={true}
            />
          )}
          disabled={!isLoaded || !!currentSearch}
          showHandles={preferences.viewMode === 'list'}
          aria-label="Notes list"
          gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          listClassName="space-y-3"
        />
      )}

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          setSelectedNote(undefined)
          setIsFormOpen(true)
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <NoteFormDialog
        note={selectedNote}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedNote(undefined)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNoteToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}