import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, FilterType } from '@/types'

interface TasksState {
  tasks: Task[]
  currentFilter: FilterType
  currentSearch: string
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  setFilter: (filter: FilterType) => void
  setSearch: (search: string) => void
  reorderTasks: (draggedTaskId: string, afterTaskId: string | null) => void
}

const getDefaultTasks = (): Task[] => [
  {
    id: '1',
    title: "Prepare Mom to Parks DRM",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: "2024-08-10",
    displayOrder: 0,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '2',
    title: "Check the errors in the DRM-Send Warning to tenants and centers process",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: "2024-08-08",
    displayOrder: 1,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '3',
    title: "Check the reem's required processes and prepare the timeline",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 2,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '4',
    title: "Contact companies to get cost of migration to Power Automate",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 3,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '5',
    title: "Continue developing the HR weekly report GM Process",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 4,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '6',
    title: "Clear all fake data from the DMT IOT Platform",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 5,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '7',
    title: "Check the SMS for all processes",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 6,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '8',
    title: "Make sure all stakeholders will attend the handover meeting",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 7,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '9',
    title: "Follow up with Tahaluf team re: handover issues to DRM",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 8,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '10',
    title: "Discuss next phase with MK & confirm support extension",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 9,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '11',
    title: "Develop the increasing Area process for AAM",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 10,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '12',
    title: "Prepare a use case for Microsoft Power Automate",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 11,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '13',
    title: "Send email to Microsoft regarding the training and migration",
    priority: "high",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 12,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '14',
    title: "Check the updating soil data process",
    priority: "medium",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 13,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '15',
    title: "Smart Parks Platform development",
    priority: "medium",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 14,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '16',
    title: "Continue developing the Task management system",
    priority: "medium",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 15,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '17',
    title: "Test all smart park DMT IOT Platform APIs",
    priority: "medium",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 16,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '18',
    title: "Read the park's Policies, check them with Tala",
    priority: "low",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 17,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '19',
    title: "Check with Abdullah 360 AI Platform",
    priority: "low",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 18,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '20',
    title: "Request access to AKS and Azure AI services",
    priority: "low",
    completed: false,
    status: "Not Started",
    dueDate: null,
    displayOrder: 19,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString()
  }
]

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: getDefaultTasks(),
      currentFilter: 'all',
      currentSearch: '',
      
      addTask: (taskData) => set((state) => {
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        // Update display order for existing tasks
        const updatedTasks = state.tasks.map(task => ({
          ...task,
          displayOrder: task.displayOrder + 1
        }))
        
        return {
          tasks: [newTask, ...updatedTasks]
        }
      }),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === id 
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
      })),
      
      toggleTask: (id) => set((state) => {
        const task = state.tasks.find(t => t.id === id)
        if (!task) return state
        
        const completed = !task.completed
        const status = completed ? 'Completed' : 'Not Started'
        
        return {
          tasks: state.tasks.map(t =>
            t.id === id 
              ? { ...t, completed, status, updatedAt: new Date().toISOString() }
              : t
          )
        }
      }),
      
      setFilter: (filter) => set({ currentFilter: filter }),
      
      setSearch: (search) => set({ currentSearch: search }),
      
      reorderTasks: (draggedTaskId, afterTaskId) => set((state) => {
        const draggedTaskIndex = state.tasks.findIndex(task => task.id === draggedTaskId)
        const draggedTask = state.tasks[draggedTaskIndex]
        
        if (!draggedTask) return state
        
        const newTasks = state.tasks.filter(task => task.id !== draggedTaskId)
        
        if (afterTaskId === null) {
          newTasks.push(draggedTask)
        } else {
          const afterIndex = newTasks.findIndex(task => task.id === afterTaskId)
          newTasks.splice(afterIndex, 0, draggedTask)
        }
        
        // Update display order
        const updatedTasks = newTasks.map((task, index) => ({
          ...task,
          displayOrder: index,
          updatedAt: new Date().toISOString()
        }))
        
        return { tasks: updatedTasks }
      }),
    }),
    {
      name: 'tasks-storage',
    }
  )
)