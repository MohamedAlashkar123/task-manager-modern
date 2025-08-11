'use client'

import { useState, ReactNode, useCallback, useMemo, useRef } from 'react'
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

export interface VirtualSortableItem {
  id: string
  [key: string]: unknown
}

interface VirtualizedSortableLayoutProps<T extends VirtualSortableItem> {
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
  'aria-label'?: string
  
  // Virtualization props
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  threshold?: number // Minimum items before virtualization kicks in
}

function useVirtualization<T extends VirtualSortableItem>({
  items,
  itemHeight = 200,
  containerHeight = 600,
  overscan = 5,
  threshold = 50
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan: number
  threshold: number
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const shouldVirtualize = items.length > threshold

  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: items.length }
    }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.length, start + visibleCount + overscan * 2)

    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length, shouldVirtualize])

  const virtualItems = useMemo(() => {
    if (!shouldVirtualize) {
      return items.map((item, index) => ({
        item,
        index,
        offsetTop: index * itemHeight
      }))
    }

    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      offsetTop: (visibleRange.start + index) * itemHeight
    }))
  }, [items, visibleRange, itemHeight, shouldVirtualize])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    scrollElementRef,
    virtualItems,
    totalHeight,
    handleScroll,
    shouldVirtualize,
    visibleRange
  }
}

export function VirtualizedSortableLayout<T extends VirtualSortableItem>({
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
  'aria-label': ariaLabel = 'Sortable items',
  itemHeight = 200,
  containerHeight = 600,
  overscan = 5,
  threshold = 50
}: VirtualizedSortableLayoutProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  
  const {
    scrollElementRef,
    virtualItems,
    totalHeight,
    handleScroll,
    shouldVirtualize
  } = useVirtualization({
    items,
    itemHeight,
    containerHeight,
    overscan,
    threshold
  })
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(items, oldIndex, newIndex)
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

  // For small datasets or grid view, use regular layout
  if (!shouldVirtualize || viewMode === 'grid') {
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
                <div key={item.id} role="listitem">
                  <SortableItem id={item.id} disabled={disabled}>
                    {renderItem(item, item.id === activeId)}
                  </SortableItem>
                </div>
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

  // Virtualized list view for large datasets
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
            ref={scrollElementRef}
            className="overflow-auto"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
            role="list"
            aria-label={ariaLabel}
          >
            <div
              style={{
                height: totalHeight,
                position: 'relative'
              }}
            >
              {virtualItems.map(({ item, offsetTop }) => (
                <div
                  key={item.id}
                  role="listitem"
                  style={{
                    position: 'absolute',
                    top: offsetTop,
                    left: 0,
                    right: 0,
                    height: itemHeight
                  }}
                >
                  <SortableItem id={item.id} disabled={disabled}>
                    {renderItem(item, item.id === activeId)}
                  </SortableItem>
                </div>
              ))}
            </div>
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