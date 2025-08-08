'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterType } from '@/types'
import { useTasksStore } from '@/store/tasks'
import { cn } from '@/lib/utils'

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All Tasks' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'due-today', label: 'Due Today' },
  { key: 'high', label: 'High Priority' },
  { key: 'medium', label: 'Medium Priority' },
  { key: 'low', label: 'Low Priority' },
]

export function TaskFilters() {
  const { currentFilter, currentSearch, setFilter, setSearch } = useTasksStore()

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={currentSearch}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((filter) => (
          <Button
            key={filter.key}
            variant={currentFilter === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(filter.key)}
            className={cn(
              'transition-all',
              currentFilter !== filter.key && 'hover:bg-primary/10'
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  )
}