'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { TaskCard } from '@/components/tasks/task-card'
import { TaskFilters } from '@/components/tasks/task-filters'
import { TaskStats } from '@/components/tasks/task-stats'
import { useTasksStore } from '@/store/tasks-supabase'
import { useRequireAuth } from '@/contexts/AuthContext'
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences'
import { useDebounce } from '@/hooks/useDebounce'
import { TaskSkeleton } from '@/components/ui/skeleton'
import { PageLoadingSpinner } from '@/components/layout/LoadingSpinner'
import { LazyTaskFormDialog, LazySortableLayout } from '@/components/pages/LazyPages'
import { Task } from '@/types'

export default function TasksPage() {
  // Require authentication for this page
  const { user, loading: authLoading } = useRequireAuth()
  
  const { 
    tasks, 
    currentFilter, 
    currentSearch, 
    loading, 
    error, 
    deleteTask, 
    reorderTasks,
    initializeTasks,
    clearError 
  } = useTasksStore()
  const { preferences, setViewMode, isLoaded } = useLayoutPreferences('tasks-layout')
  const [selectedTask, setSelectedTask] = useState<Task | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  // Initialize tasks from Supabase when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      initializeTasks()
    }
  }, [user, authLoading, initializeTasks])

  // Debounce search to avoid excessive filtering
  const debouncedSearch = useDebounce(currentSearch, 300)

  // Move filter and sort functions - must be before any conditional returns
  const filterTasks = useCallback((tasks: Task[], filter: typeof currentFilter, search: string): Task[] => {
    if (tasks.length === 0) return tasks
    
    let filtered = tasks

    // Apply status filter
    if (filter !== 'all') {
      switch (filter) {
        case 'completed':
          filtered = filtered.filter(task => task.completed)
          break
        case 'pending':
          filtered = filtered.filter(task => !task.completed)
          break
        case 'overdue':
          filtered = filtered.filter(task => {
            if (!task.dueDate || task.completed) return false
            return new Date(task.dueDate) < new Date()
          })
          break
        case 'due-today':
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          filtered = filtered.filter(task => {
            if (!task.dueDate || task.completed) return false
            const dueDate = new Date(task.dueDate)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate.getTime() === today.getTime()
          })
          break
        case 'high':
        case 'medium':
        case 'low':
          filtered = filtered.filter(task => task.priority === filter)
          break
      }
    }

    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase().trim()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  }, [])

  const sortTasks = useCallback((tasks: Task[]): Task[] => {
    if (tasks.length === 0) return tasks
    
    return [...tasks].sort((a, b) => {
      // If no filters and no search, use manual order
      if (currentFilter === 'all' && !debouncedSearch.trim()) {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1
        }
        return a.displayOrder - b.displayOrder
      }

      // Otherwise use smart sorting
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      // Priority sorting for non-completed tasks
      if (!a.completed && !b.completed) {
        const priorityOrder = { high: 1, medium: 2, low: 3 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff

        // Then by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        if (a.dueDate && !b.dueDate) return -1
        if (!a.dueDate && b.dueDate) return 1
      }

      return 0
    })
  }, [currentFilter, debouncedSearch])

  // Memoize expensive filtering and sorting operations
  const filteredAndSortedTasks = useMemo(() => {
    return sortTasks(filterTasks(tasks, currentFilter, debouncedSearch))
  }, [tasks, currentFilter, debouncedSearch, filterTasks, sortTasks])

  // Optimized callbacks to prevent unnecessary re-renders
  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }, [])

  const handleDeleteTask = useCallback((taskId: string) => {
    setTaskToDelete(taskId)
  }, [])

  const confirmDelete = useCallback(() => {
    if (taskToDelete) {
      deleteTask(taskToDelete)
      setTaskToDelete(null)
    }
  }, [taskToDelete, deleteTask])

  // Show loading if auth is still loading
  if (authLoading) {
    return <PageLoadingSpinner text="Loading your tasks..." />
  }

  // This will redirect to login if not authenticated
  if (!user) {
    return null
  }


  return (
    <div className="space-y-6">
      <Header 
        title="Today's Tasks" 
        subtitle="Stay organized and boost your productivity" 
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
      
      <TaskStats />
      
      <TaskFilters />

      {/* Loading State with Skeleton */}
      {loading && tasks.length === 0 && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TaskSkeleton key={i} />
          ))}
        </div>
      )}
      
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground mb-4">
            {currentSearch || currentFilter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Add a new task to get started'
            }
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Task
          </Button>
        </div>
      ) : (
        <LazySortableLayout
          items={filteredAndSortedTasks}
          onReorder={reorderTasks}
          viewMode={preferences.viewMode}
          onViewModeChange={setViewMode}
          renderItem={(task, isDragging) => (
            <TaskCard
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              viewMode={preferences.viewMode}
              isDragging={isDragging}
            />
          )}
          renderDragOverlay={(task) => (
            <TaskCard
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              viewMode={preferences.viewMode}
              isDragging={true}
            />
          )}
          disabled={!isLoaded || loading || currentFilter !== 'all' || !!debouncedSearch.trim()}
          showHandles={preferences.viewMode === 'list'}
          aria-label="Tasks list"
        />
      )}

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          setSelectedTask(undefined)
          setIsFormOpen(true)
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <LazyTaskFormDialog
        task={selectedTask}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedTask(undefined)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTaskToDelete(null)}>
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