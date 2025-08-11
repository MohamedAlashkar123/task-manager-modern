import { create } from 'zustand'
import { RPAProcess, RPAFilterType, ViewMode } from '@/types'
import { supabase } from '@/lib/supabase'

interface DatabaseRPAProcess {
  id: string
  name: string
  description: string
  status: string
  owner: string | null
  department: string | null
  entity_name: string | null
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
  dueDate: record.due_date,
  createdAt: record.created_at,
  lastModified: record.last_modified,
})

// Helper function to transform RPAProcess to database record
const transformToDbRecord = (process: Partial<RPAProcess>) => ({
  name: process.name,
  description: process.description,
  status: process.status,
  owner: process.owner,
  department: process.department,
  entity_name: process.entityName,
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
      const { data, error } = await supabase
        .from('rpa_processes')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      const processes = data.map(transformDbRecord)
      set({ processes, isLoading: false })
    } catch (error) {
      console.error('Error fetching RPA processes:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch processes',
        isLoading: false 
      })
    }
  },

  addProcess: async (processData) => {
    set({ isLoading: true, error: null })
    
    try {
      const dbRecord = transformToDbRecord(processData)
      
      const { data, error } = await supabase
        .from('rpa_processes')
        .insert([dbRecord])
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      const newProcess = transformDbRecord(data)
      set(state => ({
        processes: [newProcess, ...state.processes],
        isLoading: false
      }))
    } catch (error) {
      console.error('Error adding RPA process:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add process',
        isLoading: false 
      })
      throw error
    }
  },

  updateProcess: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      const dbUpdates = transformToDbRecord(updates)
      
      const { data, error } = await supabase
        .from('rpa_processes')
        .update(dbUpdates)
        .eq('id', id)
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
      const { error } = await supabase
        .from('rpa_processes')
        .delete()
        .eq('id', id)
      
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