'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { ProcessCard } from '@/components/rpa/process-card'
import { ProcessFormDialog } from '@/components/rpa/process-form-dialog'
import { ProcessFilters } from '@/components/rpa/process-filters'
import { ProcessStats } from '@/components/rpa/process-stats'
import { SortableLayout } from '@/components/layout/SortableLayout'
import { useRPAProcessesStore } from '@/store/rpa-processes-supabase'
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences'
import { RPAProcess } from '@/types'

export default function RPAProcessesPage() {
  const { 
    processes, 
    currentFilter, 
    currentSearch, 
    isLoading,
    error,
    fetchProcesses,
    deleteProcess,
    reorderProcesses
  } = useRPAProcessesStore()
  const { preferences, setViewMode, isLoaded } = useLayoutPreferences('rpa-layout')
  
  const [selectedProcess, setSelectedProcess] = useState<RPAProcess | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [processToDelete, setProcessToDelete] = useState<string | null>(null)
  
  const handleReorderProcesses = useCallback((items: unknown[]) => {
    reorderProcesses(items as RPAProcess[])
  }, [reorderProcesses])

  // Fetch processes on component mount
  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  const filterProcesses = (processes: RPAProcess[]): RPAProcess[] => {
    let filtered = [...processes]

    // Apply status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(process => process.status === currentFilter)
    }

    // Apply search filter
    if (currentSearch) {
      const searchTerm = currentSearch.toLowerCase()
      filtered = filtered.filter(process =>
        process.name.toLowerCase().includes(searchTerm) ||
        process.description.toLowerCase().includes(searchTerm) ||
        (process.owner && process.owner.toLowerCase().includes(searchTerm)) ||
        (process.department && process.department.toLowerCase().includes(searchTerm)) ||
        (process.entityName && process.entityName.toLowerCase().includes(searchTerm)) ||
        (process.dueDate && process.dueDate.includes(searchTerm))
      )
    }

    return filtered
  }

  const groupProcessesByStatus = (processes: RPAProcess[]) => {
    const statusOrder = ['active', 'in-progress', 'on-hold', 'completed'] as const
    const grouped: Record<string, RPAProcess[]> = {}
    
    statusOrder.forEach(status => {
      const processesInGroup = processes.filter(p => p.status === status)
      if (processesInGroup.length > 0) {
        grouped[status.replace('-', ' ').toUpperCase()] = processesInGroup
      }
    })
    
    return grouped
  }

  const filteredProcesses = filterProcesses(processes)
  const shouldGroupByStatus = currentFilter === 'all' && !currentSearch && preferences.viewMode === 'grid'

  const handleEditProcess = (process: RPAProcess) => {
    setSelectedProcess(process)
    setIsFormOpen(true)
  }

  const handleDeleteProcess = (processId: string) => {
    setProcessToDelete(processId)
  }

  const confirmDelete = () => {
    if (processToDelete) {
      deleteProcess(processToDelete)
      setProcessToDelete(null)
    }
  }

  const renderProcessLayout = (processes: RPAProcess[]) => {
    return (
      <SortableLayout
        items={processes}
        onReorder={handleReorderProcesses}
        viewMode={preferences.viewMode}
        onViewModeChange={setViewMode}
        renderItem={(process, isDragging) => (
          <ProcessCard
            process={process as RPAProcess}
            onEdit={handleEditProcess}
            onDelete={handleDeleteProcess}
            viewMode={preferences.viewMode}
            isDragging={isDragging}
          />
        )}
        renderDragOverlay={(process) => (
          <ProcessCard
            process={process as RPAProcess}
            onEdit={handleEditProcess}
            onDelete={handleDeleteProcess}
            viewMode={preferences.viewMode}
            isDragging={true}
          />
        )}
        disabled={!isLoaded || currentFilter !== 'all' || !!currentSearch}
        showHandles={preferences.viewMode === 'list'}
        aria-label="RPA processes list"
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        listClassName="space-y-4"
      />
    )
  }

  // Show loading state
  if (isLoading && processes.length === 0) {
    return (
      <div className="space-y-6">
        <Header 
          title="RPA Processes" 
          subtitle="Manage and track your automation processes" 
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading RPA processes...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <Header 
          title="RPA Processes" 
          subtitle="Manage and track your automation processes" 
        />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Processes</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchProcesses}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header 
        title="RPA Processes" 
        subtitle="Manage and track your automation processes" 
      />
      
      <ProcessStats />
      
      <ProcessFilters />
      
      {filteredProcesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold mb-2">No RPA processes found</h3>
          <p className="text-muted-foreground mb-4">
            {currentSearch || currentFilter !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Create your first automation process to get started'
            }
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Process
          </Button>
        </div>
      ) : shouldGroupByStatus ? (
        <div className="space-y-8">
          {Object.entries(groupProcessesByStatus(filteredProcesses)).map(([groupName, groupProcesses]) => (
            <div key={groupName} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{groupName}</h3>
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm font-medium">
                  {groupProcesses.length}
                </span>
              </div>
              {renderProcessLayout(groupProcesses)}
            </div>
          ))}
        </div>
      ) : (
        renderProcessLayout(filteredProcesses)
      )}

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          setSelectedProcess(undefined)
          setIsFormOpen(true)
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <ProcessFormDialog
        process={selectedProcess}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedProcess(undefined)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!processToDelete} onOpenChange={() => setProcessToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete RPA Process</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this RPA process? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProcessToDelete(null)}>
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