'use client'

import { useState } from 'react'
import { SortableLayout } from '@/components/layout/SortableLayout'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

interface TestItem {
  id: string
  title: string
  description: string
}

export default function TestDragPage() {
  const [items, setItems] = useState<TestItem[]>([
    { id: '1', title: 'Item 1', description: 'First test item' },
    { id: '2', title: 'Item 2', description: 'Second test item' },
    { id: '3', title: 'Item 3', description: 'Third test item' },
    { id: '4', title: 'Item 4', description: 'Fourth test item' },
    { id: '5', title: 'Item 5', description: 'Fifth test item' },
  ])

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const handleReorder = (reorderedItems: TestItem[]) => {
    console.log('Test page: reordering items', reorderedItems)
    setItems(reorderedItems)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Drag and Drop Test</h1>
      
      <SortableLayout
        items={items}
        onReorder={handleReorder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        renderItem={(item, isDragging) => (
          <Card className={isDragging ? 'opacity-50' : ''}>
            <CardHeader>
              <h3 className="font-semibold">{item.title}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        )}
        showHandles={true}
        aria-label="Test items"
      />
    </div>
  )
}