import { create } from 'zustand'
import { RPAProcess, RPAFilterType, ViewMode } from '@/types'
import { supabase } from '@/lib/supabase'

interface DatabaseRPAProcess {
  id: string
  user_id: string
  name: string
  description: string
  status: string
  owner: string | null
  department: string | null
  entity_name: string | null
  start_date: string | null
  due_date: string | null
  created_at: string
  last_modified: string
}

interface RPAProcessesState {
  processes: RPAProcess[]
  currentFilter: RPAFilterType
  currentSearch: string
  viewMode: ViewMode
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchProcesses: () => Promise<void>
  addProcess: (process: Omit<RPAProcess, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>
  updateProcess: (id: string, updates: Partial<Omit<RPAProcess, 'id' | 'createdAt'>>) => Promise<void>
  deleteProcess: (id: string) => Promise<void>
  setFilter: (filter: RPAFilterType) => void
  setSearch: (search: string) => void
  setViewMode: (mode: ViewMode) => void
  reorderProcesses: (reorderedProcesses: RPAProcess[]) => Promise<void>
}

// Helper function to transform database record to RPAProcess
const transformDbRecord = (record: DatabaseRPAProcess): RPAProcess => ({
  id: record.id,
  name: record.name,
  description: record.description,
  status: record.status,
  owner: record.owner,
  department: record.department,
  entityName: record.entity_name,
  startDate: record.start_date,
  dueDate: record.due_date,
  createdAt: record.created_at,
  lastModified: record.last_modified,
})

// Helper function to transform RPAProcess to database record
const transformToDbRecord = (process: Partial<RPAProcess>, userId: string) => ({
  user_id: userId,
  name: process.name,
  description: process.description,
  status: process.status,
  owner: process.owner,
  department: process.department,
  entity_name: process.entityName,
  start_date: process.startDate,
  due_date: process.dueDate,
})

export const useRPAProcessesStore = create<RPAProcessesState>((set) => ({
  processes: [],
  currentFilter: 'all',
  currentSearch: '',
  viewMode: 'grid',
  isLoading: false,
  error: null,

  fetchProcesses: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // First, try to query with user_id filter
      let query = supabase
        .from('rpa_processes')
        .select('*')
        .order('created_at', { ascending: false })

      // Try to add user_id filter, but fallback if column doesn't exist
      try {
        const { data, error } = await query.eq('user_id', user.id)
        
        if (error) {
          console.error('Supabase fetch error:', error)
          
          // Check if required columns don't exist
          if (error.message?.includes('column "user_id" does not exist') || 
              error.message?.includes('start_date') || 
              error.message?.includes('due_date') ||
              error.message?.includes('entity_name')) {
            console.warn('user_id column not found, fetching all processes. Please run the database migration script.')
            // Fallback: fetch all processes without user filter
            const fallbackResult = await supabase
              .from('rpa_processes')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (fallbackResult.error) throw fallbackResult.error
            
            const processes = fallbackResult.data.map(transformDbRecord)
            set({ 
              processes, 
              isLoading: false,
              error: 'Database migration required. All processes are shown. Please run the migration script for proper user isolation.'
            })
            return
          }
          
          throw error
        }
        
        const processes = data.map(transformDbRecord)
        set({ processes, isLoading: false })
        
      } catch (queryError) {
        throw queryError
      }
      
    } catch (error) {
      console.error('Error fetching RPA processes:', error)
      
      // Check if it's a table doesn't exist error
      if (error?.message?.includes('relation "rpa_processes" does not exist')) {
        set({ 
          error: 'Database table not found. Please run the database setup script.',
          isLoading: false 
        })
      } else if (error?.message?.includes('column "user_id" does not exist')) {
        set({ 
          error: 'Database migration required. Please run the migration script to add user isolation.',
          isLoading: false 
        })
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch processes',
          isLoading: false 
        })
      }
    }
  },

  addProcess: async (processData) => {
    set({ isLoading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Try to insert with user_id, but fallback if column doesn't exist
      try {
        const dbRecord = transformToDbRecord(processData, user.id)
        
        const { data, error } = await supabase
          .from('rpa_processes')
          .insert([dbRecord])
          .select()
          .single()
        
        if (error) {
          console.error('Supabase error:', error)
          
          // Check if required columns don't exist
          if (error.message?.includes('column "user_id" does not exist') || 
              error.message?.includes('start_date') || 
              error.message?.includes('due_date') ||
              error.message?.includes('entity_name')) {
            console.warn('Missing database columns detected, using fallback insert. Please run the database migration script.')
            
            // Fallback: insert without user_id and optional columns
            const fallbackRecord: any = {
              name: processData.name,
              description: processData.description,
              status: processData.status,
            }
            
            // Only add optional fields if they exist
            if (processData.owner) fallbackRecord.owner = processData.owner
            if (processData.department) fallbackRecord.department = processData.department
            if (processData.entityName) fallbackRecord.entity_name = processData.entityName
            
            // Don't include start_date/due_date if columns don't exist
            // These will be handled by the migration script
            
            const fallbackResult = await supabase
              .from('rpa_processes')
              .insert([fallbackRecord])
              .select()
              .single()
            
            if (fallbackResult.error) throw fallbackResult.error
            
            const newProcess = {
              id: fallbackResult.data.id,
              name: fallbackResult.data.name,
              description: fallbackResult.data.description,
              status: fallbackResult.data.status,
              owner: fallbackResult.data.owner,
              department: fallbackResult.data.department,
              entityName: fallbackResult.data.entity_name,
              startDate: fallbackResult.data.start_date,
              dueDate: fallbackResult.data.due_date,
              createdAt: fallbackResult.data.created_at,
              lastModified: fallbackResult.data.last_modified,
            }
            
            set(state => ({
              processes: [newProcess, ...state.processes],
              isLoading: false,
              error: 'Process added successfully. Database migration required for user isolation.'
            }))
            return
          }
          
          throw error
        }
        
        const newProcess = transformDbRecord(data)
        set(state => ({
          processes: [newProcess, ...state.processes],
          isLoading: false
        }))
        
      } catch (insertError) {
        throw insertError
      }
      
    } catch (error) {
      console.error('Error adding RPA process:', error)
      
      // Check if it's a table doesn't exist error
      if (error?.message?.includes('relation "rpa_processes" does not exist')) {
        set({ 
          error: 'Database table not found. Please run the database setup script.',
          isLoading: false 
        })
      } else if (error?.message?.includes('column "user_id" does not exist')) {
        set({ 
          error: 'Database migration required. Please run the migration script to add user isolation.',
          isLoading: false 
        })
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add process',
          isLoading: false 
        })
      }
      throw error
    }
  },

  updateProcess: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const dbUpdates = transformToDbRecord(updates, user.id)
      
      const { data, error } = await supabase
        .from('rpa_processes')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      const updatedProcess = transformDbRecord(data)
      set(state => ({
        processes: state.processes.map(process =>
          process.id === id ? updatedProcess : process
        ),
        isLoading: false
      }))
    } catch (error) {
      console.error('Error updating RPA process:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update process',
        isLoading: false 
      })
      throw error
    }
  },

  deleteProcess: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('rpa_processes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) {
        throw error
      }
      
      set(state => ({
        processes: state.processes.filter(process => process.id !== id),
        isLoading: false
      }))
    } catch (error) {
      console.error('Error deleting RPA process:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete process',
        isLoading: false 
      })
      throw error
    }
  },

  setFilter: (filter) => set({ currentFilter: filter }),

  setSearch: (search) => set({ currentSearch: search }),

  setViewMode: (mode) => set({ viewMode: mode }),

  reorderProcesses: async (reorderedProcesses) => {
    // For now, just update the local state
    // In a full implementation, you might want to update display_order in the database
    set({ processes: reorderedProcesses })
    
    // Optional: Update display order in database
    // Note: This would require a display_order column in your database
    // For now, we'll just update the local state
  },
}))