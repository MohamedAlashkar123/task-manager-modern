'use client'

import { useState } from 'react'
import { Calendar, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Note, ViewMode } from '@/types'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  viewMode?: ViewMode
  isDragging?: boolean
}

export function NoteCard({ note, onEdit, onDelete, viewMode = 'grid', isDragging = false }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden h-full',
        'animate-in slide-in-from-bottom-1 duration-300',
        isDragging && 'opacity-50 shadow-lg rotate-2',
        viewMode === 'list' && 'flex flex-row items-stretch'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className={cn(
        'pb-3 relative',
        viewMode === 'list' && 'flex-none w-80'
      )}>
        <div className={cn(
          'absolute top-4 right-4 flex gap-1 transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(note)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(note.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <h3 
          className={cn(
            'font-semibold cursor-pointer hover:text-primary transition-colors pr-16',
            viewMode === 'grid' ? 'text-lg' : 'text-base'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(note)
          }}
        >
          {note.title}
        </h3>
        
        <div className={cn(
          'flex items-center gap-1 text-muted-foreground',
          viewMode === 'grid' ? 'text-sm' : 'text-xs'
        )}>
          <Calendar className="h-3 w-3" />
          Last edited: {formatDate(note.lastEdited)}
        </div>
      </CardHeader>
      
      <CardContent 
        className={cn(
          'cursor-pointer hover:bg-muted/20 transition-colors',
          viewMode === 'list' && 'flex-1'
        )}
        onClick={(e) => {
          e.stopPropagation()
          onEdit(note)
        }}
      >
        <p className={cn(
          'text-muted-foreground leading-relaxed',
          viewMode === 'grid' ? 'line-clamp-4' : 'line-clamp-3'
        )}>
          {note.content}
        </p>
      </CardContent>
    </Card>
  )
}