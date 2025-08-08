export interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  status: 'Not Started' | 'In Progress' | 'Completed'
  dueDate: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  lastEdited: string
  order: number
}

export interface RPAProcess {
  id: string
  name: string
  description: string
  status: 'active' | 'in-progress' | 'completed' | 'on-hold'
  owner?: string | null
  department?: string | null
  createdAt: string
  lastModified: string
}

export type FilterType = 'all' | 'pending' | 'completed' | 'overdue' | 'due-today' | 'high' | 'medium' | 'low'
export type RPAFilterType = 'all' | 'active' | 'in-progress' | 'completed' | 'on-hold'
export type ViewMode = 'grid' | 'list'