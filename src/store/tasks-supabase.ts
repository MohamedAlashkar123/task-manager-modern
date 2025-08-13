import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Task, FilterType, SupabaseRow } from '@/types'
import { cache, cacheKeys } from '@/lib/cache'
import { secureConsole } from '@/lib/secure-logging'

interface TasksState {
  tasks: Task[]
  currentFilter: FilterType
  currentSearch: string
  loading: boolean
  error: string | null
  
  // Actions
  initializeTasks: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  setFilter: (filter: FilterType) => void
  setSearch: (search: string) => void
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>
  clearError: () => void
}

// Retry utility for failed operations
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError!
}

// Convert Supabase row to Task interface  
const convertSupabaseRowToTask = (row: SupabaseRow): Task => ({
  id: row.id,
  title: row.title,
  priority: row.priority,
  completed: row.completed,
  status: row.status,
  startDate: row.start_date,
  dueDate: row.due_date,
  displayOrder: row.display_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

// Convert Task to Supabase insert format
const convertTaskToSupabaseInsert = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => ({
  title: task.title,
  priority: task.priority,
  completed: task.completed,
  status: task.status,
  start_date: task.startDate,
  due_date: task.dueDate,
  display_order: task.displayOrder,
  user_id: userId
})

// Convert Task updates to Supabase update format
const convertTaskToSupabaseUpdate = (updates: Partial<Task>) => {
  const supabaseUpdate: Partial<SupabaseRow> = {}
  
  if (updates.title !== undefined) supabaseUpdate.title = updates.title
  if (updates.priority !== undefined) supabaseUpdate.priority = updates.priority
  if (updates.completed !== undefined) supabaseUpdate.completed = updates.completed
  if (updates.status !== undefined) supabaseUpdate.status = updates.status
  if (updates.startDate !== undefined) supabaseUpdate.start_date = updates.startDate
  if (updates.dueDate !== undefined) supabaseUpdate.due_date = updates.dueDate
  if (updates.displayOrder !== undefined) supabaseUpdate.display_order = updates.displayOrder
  
  return supabaseUpdate
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  currentFilter: 'all',
  currentSearch: '',
  loading: false,
  error: null,

  initializeTasks: async () => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const cacheKey = cacheKeys.tasks(user.id)
      
      // Check cache first
      const cachedTasks = cache.get<Task[]>(cacheKey)
      if (cachedTasks) {
        set({ tasks: cachedTasks, loading: false, error: null })
        return
      }

      set({ loading: true, error: null })
      
      const response = await fetch('/api/tasks')
      const result = await response.json()

      if (!response.ok) {
        secureConsole.error('API tasks fetch error:', result.error)
        
        if (result.error?.includes('relation "tasks" does not exist')) {
          throw new Error('Database table not found. Please run the database setup script.')
        } else {
          throw new Error(result.error || 'Failed to load tasks')
        }
      }
      
      const tasks = result.tasks?.map(convertSupabaseRowToTask) || []
      
      // Cache the results
      cache.set(cacheKey, tasks, 5 * 60 * 1000) // 5 minutes
      
      set({ tasks, loading: false, error: null })
      
    } catch (error) {
      secureConsole.error('Error loading tasks:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load tasks',
        loading: false 
      })
    }
  },

  addTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Optimistic update - immediately add to local state
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`, // Temporary ID
      title: taskData.title as string,
      priority: taskData.priority as 'high' | 'medium' | 'low',
      completed: taskData.completed as boolean,
      status: taskData.status as 'Not Started' | 'In Progress' | 'Completed',
      startDate: taskData.startDate as string | null,
      dueDate: taskData.dueDate as string | null,
      displayOrder: taskData.displayOrder as number,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      tasks: [optimisticTask, ...state.tasks.map(task => ({
        ...task,
        displayOrder: task.displayOrder + 1
      }))],
      error: null
    }))
    
    try {
      await retryOperation(async () => {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Insert the new task with display_order = 0 (single operation)
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            ...convertTaskToSupabaseInsert(taskData, user.id),
            display_order: 0
          }])
          .select()
          .single()

        if (error) {
          secureConsole.error('Supabase tasks insert error:', error)
          
          // Check if it's a table doesn't exist error
          if (error.message?.includes('relation "tasks" does not exist')) {
            throw new Error('Database table not found. Please run the database setup script.')
          } else {
            throw error
          }
        }

        const newTask = convertSupabaseRowToTask(data)
        
        // Invalidate cache
        cache.delete(cacheKeys.tasks(user.id))
        
        // Replace optimistic task with real task
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === optimisticTask.id ? newTask : task
          )
        }))
      })

    } catch (error) {
      secureConsole.error('Error adding task:', error)
      
      // Revert optimistic update on error
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== optimisticTask.id).map(task => ({
          ...task,
          displayOrder: task.displayOrder - 1
        })),
        error: error instanceof Error ? error.message : 'Failed to add task'
      }))
    }
  },

  updateTask: async (id, updates) => {
    // Store original task for rollback
    const originalTask = get().tasks.find(t => t.id === id)
    if (!originalTask) return

    // Optimistic update - immediately update local state
    set((state) => ({
      tasks: state.tasks.map(task =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ),
      error: null
    }))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .update(convertTaskToSupabaseUpdate(updates))
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      const updatedTask = convertSupabaseRowToTask(data)
      
      // Sync with server response
      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === id ? updatedTask : task
        )
      }))

    } catch (error) {
      secureConsole.error('Error updating task:', error)
      
      // Revert optimistic update on error
      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === id ? originalTask : task
        ),
        error: error instanceof Error ? error.message : 'Failed to update task'
      }))
    }
  },

  deleteTask: async (id) => {
    // Store original task for rollback
    const originalTask = get().tasks.find(t => t.id === id)
    if (!originalTask) return

    // Optimistic update - immediately remove from local state
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== id),
      error: null
    }))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

    } catch (error) {
      secureConsole.error('Error deleting task:', error)
      
      // Revert optimistic update on error
      set((state) => ({
        tasks: [...state.tasks, originalTask].sort((a, b) => a.displayOrder - b.displayOrder),
        error: error instanceof Error ? error.message : 'Failed to delete task'
      }))
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return

    const completed = !task.completed
    const status = completed ? 'Completed' : 'Not Started'

    // Use optimized updateTask which already handles optimistic updates
    await get().updateTask(id, { completed, status })
  },

  setFilter: (filter) => set({ currentFilter: filter }),

  setSearch: (search) => set({ currentSearch: search }),

  reorderTasks: async (reorderedTasks) => {
    // Store original order for rollback
    const originalTasks = [...get().tasks]
    
    // Optimistic update - immediately update local state
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      displayOrder: index,
      updatedAt: new Date().toISOString()
    }))

    set({ tasks: updatedTasks, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Batch update using upsert for better performance
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        user_id: user.id,
        display_order: index
      }))

      // Try to use batch update - more efficient than individual updates
      const { error } = await supabase
        .from('tasks')
        .upsert(
          updates.map(update => ({ 
            id: update.id,
            user_id: update.user_id,
            display_order: update.display_order 
          })),
          { onConflict: 'id' }
        )

      if (error) {
        // Fallback to individual updates if batch fails
        const updatePromises = updates.map(update => 
          supabase
            .from('tasks')
            .update({ display_order: update.display_order })
            .eq('id', update.id)
            .eq('user_id', user.id)
        )
        
        const results = await Promise.allSettled(updatePromises)
        const failures = results.filter(result => result.status === 'rejected')
        
        if (failures.length > 0) {
          throw new Error(`Failed to update ${failures.length} tasks`)
        }
      }

    } catch (error) {
      secureConsole.error('Error reordering tasks:', error)
      
      // Revert optimistic update on error
      set({ 
        tasks: originalTasks,
        error: error instanceof Error ? error.message : 'Failed to reorder tasks'
      })
    }
  },

  clearError: () => set({ error: null })
}))

// Real-time subscriptions removed for security
// Data will be refreshed through secure API calls and periodic polling