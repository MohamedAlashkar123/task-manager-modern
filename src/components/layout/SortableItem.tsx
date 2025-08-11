'use client'

import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableItemProps {
  id: string
  children: ReactNode
  disabled?: boolean
  className?: string
  showHandle?: boolean
  handleClassName?: string
}

export function SortableItem({ 
  id, 
  children, 
  disabled = false,
  className = '',
  showHandle = true,
  handleClassName = ''
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    isSorting,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group transition-all duration-200',
        !disabled && 'hover:shadow-md',
        isDragging && 'z-50 opacity-50 rotate-1 scale-105 shadow-lg',
        isOver && 'ring-2 ring-primary ring-opacity-50',
        isSorting && 'transition-transform duration-200',
        className
      )}
      {...attributes}
      {...(!showHandle && !disabled ? listeners : {})}
    >
      {showHandle && !disabled && (
        <div
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 z-10',
            'opacity-60 group-hover:opacity-100 transition-opacity duration-200',
            'p-2 rounded-md hover:bg-muted/50 cursor-grab active:cursor-grabbing',
            'bg-background/80 backdrop-blur-sm border border-border/50',
            handleClassName
          )}
          aria-label="Drag handle"
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <div 
        className={cn(showHandle && !disabled && 'pl-8')}
        {...(!showHandle && !disabled && { style: { cursor: 'grab' } })}
      >
        {children}
      </div>
    </div>
  )
}