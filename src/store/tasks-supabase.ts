import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Task, FilterType } from '@/types'

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
  reorderTasks: (draggedTaskId: string, afterTaskId: string | null) => Promise<void>
  clearError: () => void
}

// Convert Supabase row to Task interface
const convertSupabaseRowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  priority: row.priority,
  completed: row.completed,
  status: row.status,
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
  due_date: task.dueDate,
  display_order: task.displayOrder,
  user_id: null // Will be set by RLS using auth.uid()
})

// Convert Task updates to Supabase update format
const convertTaskToSupabaseUpdate = (updates: Partial<Task>) => {
  const supabaseUpdate: any = {}
  
  if (updates.title !== undefined) supabaseUpdate.title = updates.title
  if (updates.priority !== undefined) supabaseUpdate.priority = updates.priority
  if (updates.completed !== undefined) supabaseUpdate.completed = updates.completed
  if (updates.status !== undefined) supabaseUpdate.status = updates.status
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
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      
      const tasks = data?.map(convertSupabaseRowToTask) || []
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
    set({ loading: true, error: null })
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First, increment display_order of all existing tasks for this user
      const { error: updateError } = await supabase.rpc('increment_user_task_display_order')
      if (updateError) throw updateError

      // Insert the new task with display_order = 0
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...convertTaskToSupabaseInsert(taskData),
          display_order: 0,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      const newTask = convertSupabaseRowToTask(data)
      
      // Update local state
      set((state) => ({
        tasks: [newTask, ...state.tasks.map(task => ({
          ...task,
          displayOrder: task.displayOrder + 1
        }))],
        loading: false
      }))

    } catch (error) {
      console.error('Error adding task:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add task',
        loading: false 
      })
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(convertTaskToSupabaseUpdate(updates))
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedTask = convertSupabaseRowToTask(data)
      
      // Update local state
      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === id ? updatedTask : task
        ),
        loading: false
      }))

    } catch (error) {
      console.error('Error updating task:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task',
        loading: false 
      })
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null })
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false
      }))

    } catch (error) {
      console.error('Error deleting task:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task',
        loading: false 
      })
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return

    const completed = !task.completed
    const status = completed ? 'Completed' : 'Not Started'

    await get().updateTask(id, { completed, status })
  },

  setFilter: (filter) => set({ currentFilter: filter }),

  setSearch: (search) => set({ currentSearch: search }),

  reorderTasks: async (draggedTaskId, afterTaskId) => {
    set({ loading: true, error: null })
    
    try {
      const state = get()
      const draggedTask = state.tasks.find(task => task.id === draggedTaskId)
      if (!draggedTask) return

      const newTasks = state.tasks.filter(task => task.id !== draggedTaskId)

      if (afterTaskId === null) {
        newTasks.push(draggedTask)
      } else {
        const afterIndex = newTasks.findIndex(task => task.id === afterTaskId)
        newTasks.splice(afterIndex, 0, draggedTask)
      }

      // Update display orders in bulk
      const updates = newTasks.map((task, index) => ({
        id: task.id,
        display_order: index
      }))

      // Use Supabase batch update
      const { error } = await supabase.rpc('bulk_update_user_task_order', {
        updates
      })

      if (error) throw error

      // Update local state
      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        displayOrder: index
      }))

      set({ tasks: updatedTasks, loading: false })

    } catch (error) {
      console.error('Error reordering tasks:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reorder tasks',
        loading: false 
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