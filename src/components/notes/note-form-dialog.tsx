'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Note } from '@/types'
import { useNotesStore } from '@/store/notes'

interface NoteFormDialogProps {
  note?: Note
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoteFormDialog({ note, open, onOpenChange }: NoteFormDialogProps) {
  const { addNote, updateNote } = useNotesStore()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
      })
    } else {
      setFormData({
        title: '',
        content: '',
      })
    }
  }, [note, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) return
    
    if (note) {
      updateNote(note.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
      })
    } else {
      addNote({
        title: formData.title.trim(),
        content: formData.content.trim(),
        order: 0,
      })
    }
    
    onOpenChange(false)
    setFormData({ title: '', content: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Add New Note'}</DialogTitle>
          <DialogDescription>
            {note ? 'Update your note content.' : 'Create a new note to capture your thoughts.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter note title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your note content here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="min-h-[150px] resize-y"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {note ? 'Update Note' : 'Save Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}