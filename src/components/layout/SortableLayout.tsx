'use client'

import { useState, ReactNode, useCallback } from 'react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { restrictToParentElement, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import { List, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ViewMode } from '@/types'
import { SortableItem } from './SortableItem'

export interface SortableItemData {
  id: string
  [key: string]: unknown
}

interface SortableLayoutProps<T extends SortableItemData> {
  items: T[]
  onReorder: (items: T[]) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  renderItem: (item: T, isDragging?: boolean) => ReactNode
  renderDragOverlay?: (item: T) => ReactNode
  className?: string
  gridClassName?: string
  listClassName?: string
  emptyState?: ReactNode
  disabled?: boolean
  showHandles?: boolean
  'aria-label'?: string
}

export function SortableLayout<T extends SortableItemData>({
  items,
  onReorder,
  viewMode,
  onViewModeChange,
  renderItem,
  renderDragOverlay,
  className = '',
  gridClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  listClassName = 'space-y-4',
  emptyState,
  disabled = false,
  showHandles = true,
  'aria-label': ariaLabel = 'Sortable items'
}: SortableLayoutProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 0,
        tolerance: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log('Drag started:', event.active.id)
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    console.log('Drag ended:', { activeId: active.id, overId: over?.id })

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)
      
      console.log('Reordering:', { oldIndex, newIndex, itemsCount: items.length })
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(items, oldIndex, newIndex)
        console.log('Calling onReorder with', reorderedItems.length, 'items')
        onReorder(reorderedItems)
      }
    }

    setActiveId(null)
  }, [items, onReorder])

  const activeItem = items.find(item => item.id === activeId)
  
  const sortingStrategy = viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy

  if (items.length === 0 && emptyState) {
    return (
      <div className={className}>
        <ViewToggle 
          viewMode={viewMode} 
          onViewModeChange={onViewModeChange}
          disabled={disabled}
        />
        {emptyState}
      </div>
    )
  }

  return (
    <div className={className}>
      <ViewToggle 
        viewMode={viewMode} 
        onViewModeChange={onViewModeChange}
        disabled={disabled}
      />
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement, restrictToFirstScrollableAncestor]}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Picked up item ${active.id}`,
            onDragOver: ({ active, over }) => 
              over ? `Item ${active.id} is over ${over.id}` : `Item ${active.id} is no longer over a droppable area`,
            onDragEnd: ({ active, over }) => 
              over ? `Item ${active.id} was dropped over ${over.id}` : `Item ${active.id} was dropped`,
            onDragCancel: ({ active }) => `Dragging was cancelled. Item ${active.id} was dropped`,
          },
        }}
      >
        <SortableContext 
          items={items.map(item => item.id)} 
          strategy={sortingStrategy}
          disabled={disabled}
        >
          <div 
            className={viewMode === 'grid' ? gridClassName : listClassName}
            role="list"
            aria-label={ariaLabel}
          >
            {items.map((item) => (
              <SortableItem 
                key={item.id} 
                id={item.id} 
                disabled={disabled}
                showHandle={showHandles}
              >
                {renderItem(item, item.id === activeId)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && activeItem ? (
            <div style={{ transform: 'rotate(5deg)' }}>
              {renderDragOverlay ? renderDragOverlay(activeItem) : renderItem(activeItem, true)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  disabled?: boolean
}

function ViewToggle({ viewMode, onViewModeChange, disabled }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm font-medium text-muted-foreground">View:</span>
      <div className="flex items-center border rounded-lg p-1">
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          disabled={disabled}
          className="h-8 px-3"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          disabled={disabled}
          className="h-8 px-3"
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}