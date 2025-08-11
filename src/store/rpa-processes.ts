import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RPAProcess, RPAFilterType, ViewMode } from '@/types'

interface RPAProcessesState {
  processes: RPAProcess[]
  currentFilter: RPAFilterType
  currentSearch: string
  viewMode: ViewMode
  
  // Actions
  addProcess: (process: Omit<RPAProcess, 'id' | 'createdAt' | 'lastModified'>) => void
  updateProcess: (id: string, updates: Partial<Omit<RPAProcess, 'id' | 'createdAt'>>) => void
  deleteProcess: (id: string) => void
  setFilter: (filter: RPAFilterType) => void
  setSearch: (search: string) => void
  setViewMode: (mode: ViewMode) => void
  reorderProcesses: (reorderedProcesses: RPAProcess[]) => void
}

const getDefaultProcesses = (): RPAProcess[] => [
  {
    id: 'default-1',
    name: 'Invoice Processing Automation',
    description: 'Automates the processing of vendor invoices from receipt to approval, including data extraction, validation, and routing to appropriate approvers.',
    status: 'active',
    owner: 'Finance Team',
    department: 'Finance',
    entityName: 'Acme Corporation',
    dueDate: '2024-09-15',
    createdAt: new Date('2024-01-15').toISOString(),
    lastModified: new Date('2024-01-20').toISOString()
  },
  {
    id: 'default-2',
    name: 'Employee Onboarding Process',
    description: 'Streamlines new employee onboarding by automating account creation, document collection, and system access provisioning.',
    status: 'in-progress',
    owner: 'HR Department',
    department: 'HR',
    entityName: 'Global Tech Solutions',
    dueDate: '2024-08-30',
    createdAt: new Date('2024-02-01').toISOString(),
    lastModified: new Date('2024-02-05').toISOString()
  },
  {
    id: 'default-3',
    name: 'Report Generation Bot',
    description: 'Automatically generates and distributes monthly financial reports to stakeholders, reducing manual effort and ensuring consistency.',
    status: 'completed',
    owner: 'IT Operations',
    department: 'IT',
    entityName: 'TechFlow Industries',
    dueDate: '2024-07-20',
    createdAt: new Date('2023-12-01').toISOString(),
    lastModified: new Date('2024-01-10').toISOString()
  },
  {
    id: 'default-4',
    name: 'Customer Data Migration',
    description: 'Migrates customer data from legacy CRM system to new platform with data validation and error handling.',
    status: 'on-hold',
    owner: 'Sales Operations',
    department: 'Sales',
    entityName: 'InnovaCorp Ltd',
    dueDate: '2024-10-10',
    createdAt: new Date('2024-01-30').toISOString(),
    lastModified: new Date('2024-02-01').toISOString()
  },
  {
    id: 'default-5',
    name: 'Purchase Order Automation',
    description: 'Automates purchase order processing from request to approval and vendor notification.',
    status: 'active',
    owner: 'Procurement Team',
    department: 'Procurement',
    entityName: 'MegaCorp Industries',
    dueDate: '2024-09-01',
    createdAt: new Date('2024-02-10').toISOString(),
    lastModified: new Date('2024-02-12').toISOString()
  },
  {
    id: 'default-6',
    name: 'Quality Assurance Reporting',
    description: 'Automated quality assurance reporting system that compiles test results and generates compliance reports.',
    status: 'in-progress',
    owner: 'QA Team',
    department: 'Quality',
    entityName: 'TechFlow Industries',
    dueDate: '2024-08-25',
    createdAt: new Date('2024-02-15').toISOString(),
    lastModified: new Date('2024-02-18').toISOString()
  }
]

export const useRPAProcessesStore = create<RPAProcessesState>()(
  persist(
    (set) => ({
      processes: getDefaultProcesses(),
      currentFilter: 'all',
      currentSearch: '',
      viewMode: 'grid',
      
      addProcess: (processData) => set((state) => {
        const now = new Date().toISOString()
        const newProcess: RPAProcess = {
          ...processData,
          id: Date.now().toString(),
          createdAt: now,
          lastModified: now,
        }
        
        return {
          processes: [newProcess, ...state.processes]
        }
      }),
      
      updateProcess: (id, updates) => set((state) => ({
        processes: state.processes.map(process =>
          process.id === id 
            ? { ...process, ...updates, lastModified: new Date().toISOString() }
            : process
        )
      })),
      
      deleteProcess: (id) => set((state) => ({
        processes: state.processes.filter(process => process.id !== id)
      })),
      
      setFilter: (filter) => set({ currentFilter: filter }),
      
      setSearch: (search) => set({ currentSearch: search }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      reorderProcesses: (reorderedProcesses) => set(() => {
        const now = new Date().toISOString()
        const updatedProcesses = reorderedProcesses.map((process) => ({
          ...process,
          lastModified: now
        }))
        
        return { processes: updatedProcesses }
      }),
    }),
    {
      name: 'rpa-processes-storage',
    }
  )
)