'use client'

import { Search, Grid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RPAFilterType } from '@/types'
import { useRPAProcessesStore } from '@/store/rpa-processes-supabase'
import { cn } from '@/lib/utils'

const filterOptions: { key: RPAFilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'on-hold', label: 'On Hold' },
]

export function ProcessFilters() {
  const { 
    currentFilter, 
    currentSearch, 
    viewMode, 
    setFilter, 
    setSearch, 
    setViewMode 
  } = useRPAProcessesStore()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search processes by name, description, or owner..."
            value={currentSearch}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="px-3"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
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