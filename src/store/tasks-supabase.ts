import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Task, FilterType } from '@/types'
import { cache, cacheKeys } from '@/lib/cache'

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
const convertSupabaseRowToTask = (row: Record<string, any>): Task => ({
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
const convertTaskToSupabaseInsert = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => ({
  title: task.title,
  priority: task.priority,
  completed: task.completed,
  status: task.status,
  start_date: task.startDate,
  due_date: task.dueDate,
  display_order: task.displayOrder,
  user_id: null // Will be set by RLS using auth.uid()
})

// Convert Task updates to Supabase update format
const convertTaskToSupabaseUpdate = (updates: Partial<Task>) => {
  const supabaseUpdate: Record<string, any> = {}
  
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
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      
      const tasks = data?.map(convertSupabaseRowToTask) || []
      
      // Cache the results
      cache.set(cacheKey, tasks, 5 * 60 * 1000) // 5 minutes
      
      set({ tasks, loading: false })
      
    } catch (error) {
      console.error('Error loading tasks:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load tasks',
        loading: false 
      })
    }
  },

  addTask: async (taskData) => {
    // Optimistic update - immediately add to local state
    const optimisticTask: Task = {
      ...taskData,
      id: `temp-${Date.now()}`, // Temporary ID
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
            ...convertTaskToSupabaseInsert(taskData),
            display_order: 0
          }])
          .select()
          .single()

        if (error) throw error

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
      console.error('Error adding task:', error)
      
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
      const { data, error } = await supabase
        .from('tasks')
        .update(convertTaskToSupabaseUpdate(updates))
        .eq('id', id)
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
      console.error('Error updating task:', error)
      
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
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

    } catch (error) {
      console.error('Error deleting task:', error)
      
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
      // Batch update using upsert for better performance
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        display_order: index
      }))

      // Try to use batch update - more efficient than individual updates
      const { error } = await supabase
        .from('tasks')
        .upsert(
          updates.map(update => ({ 
            id: update.id, 
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
        )
        
        const results = await Promise.allSettled(updatePromises)
        const failures = results.filter(result => result.status === 'rejected')
        
        if (failures.length > 0) {
          throw new Error(`Failed to update ${failures.length} tasks`)
        }
      }

    } catch (error) {
      console.error('Error reordering tasks:', error)
      
      // Revert optimistic update on error
      set({ 
        tasks: originalTasks,
        error: error instanceof Error ? error.message : 'Failed to reorder tasks'
      })
    }
  },

  clearError: () => set({ error: null })
}))

// Subscribe to real-time changes
supabase
  .channel('tasks_channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      const store = useTasksStore.getState()
      
      if (payload.eventType === 'INSERT') {
        const newTask = convertSupabaseRowToTask(payload.new)
        store.initializeTasks() // Refresh to maintain order
      } else if (payload.eventType === 'UPDATE') {
        const updatedTask = convertSupabaseRowToTask(payload.new)
        useTasksStore.setState((state) => ({
          tasks: state.tasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          )
        }))
      } else if (payload.eventType === 'DELETE') {
        useTasksStore.setState((state) => ({
          tasks: state.tasks.filter(task => task.id !== payload.old.id)
        }))
      }
    }
  )
  .subscribe()