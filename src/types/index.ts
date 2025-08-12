export interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  status: 'Not Started' | 'In Progress' | 'Completed'
  startDate: string | null
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
  entityName?: string | null
  startDate?: string | null
  dueDate?: string | null
  createdAt: string
  lastModified: string
}

export type FilterType = 'all' | 'pending' | 'completed' | 'overdue' | 'due-today' | 'high' | 'medium' | 'low'
export type RPAFilterType = 'all' | 'active' | 'in-progress' | 'completed' | 'on-hold'
export type ViewMode = 'grid' | 'list'

export interface UserProfile {
  id: string
  user_id: string
  full_name?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export interface AuthError {
  message: string
  status?: number
}

export interface SupabaseRow {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  status: 'Not Started' | 'In Progress' | 'Completed'
  start_date: string | null
  due_date: string | null
  display_order: number
  created_at: string
  updated_at: string
  user_id: string
}