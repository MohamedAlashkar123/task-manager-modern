// Form validation utilities
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface TaskFormData {
  title: string
  priority: 'high' | 'medium' | 'low'
  startDate?: string
  dueDate?: string
}

export interface RPAProcessFormData {
  name: string
  description: string
  status: 'active' | 'in-progress' | 'completed' | 'on-hold'
  owner?: string
  department?: string
  entityName?: string
  startDate?: string
  dueDate?: string
}

export interface NoteFormData {
  title: string
  content: string
}

// Task validation
export function validateTaskForm(data: TaskFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Title validation
  if (!data.title?.trim()) {
    errors.title = 'Task title is required'
  } else if (data.title.trim().length < 3) {
    errors.title = 'Task title must be at least 3 characters'
  } else if (data.title.trim().length > 200) {
    errors.title = 'Task title must be less than 200 characters'
  }

  // Date validation
  if (data.startDate && data.dueDate) {
    const startDate = new Date(data.startDate)
    const dueDate = new Date(data.dueDate)
    
    if (startDate > dueDate) {
      errors.dueDate = 'Due date must be after start date'
    }
  }

  // Due date validation (not in the past for new tasks)
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (dueDate < today) {
      errors.dueDate = 'Due date cannot be in the past'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// RPA Process validation
export function validateRPAProcessForm(data: RPAProcessFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Name validation
  if (!data.name?.trim()) {
    errors.name = 'Process name is required'
  } else if (data.name.trim().length < 3) {
    errors.name = 'Process name must be at least 3 characters'
  } else if (data.name.trim().length > 100) {
    errors.name = 'Process name must be less than 100 characters'
  }

  // Description validation
  if (!data.description?.trim()) {
    errors.description = 'Process description is required'
  } else if (data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters'
  } else if (data.description.trim().length > 1000) {
    errors.description = 'Description must be less than 1000 characters'
  }

  // Owner validation
  if (data.owner && data.owner.length > 100) {
    errors.owner = 'Owner name must be less than 100 characters'
  }

  // Entity name validation
  if (data.entityName && data.entityName.length > 100) {
    errors.entityName = 'Entity name must be less than 100 characters'
  }

  // Date validation
  if (data.startDate && data.dueDate) {
    const startDate = new Date(data.startDate)
    const dueDate = new Date(data.dueDate)
    
    if (startDate > dueDate) {
      errors.dueDate = 'Due date must be after start date'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Note validation
export function validateNoteForm(data: NoteFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Title validation
  if (!data.title?.trim()) {
    errors.title = 'Note title is required'
  } else if (data.title.trim().length < 2) {
    errors.title = 'Note title must be at least 2 characters'
  } else if (data.title.trim().length > 200) {
    errors.title = 'Note title must be less than 200 characters'
  }

  // Content validation
  if (!data.content?.trim()) {
    errors.content = 'Note content is required'
  } else if (data.content.trim().length < 5) {
    errors.content = 'Note content must be at least 5 characters'
  } else if (data.content.trim().length > 10000) {
    errors.content = 'Note content must be less than 10,000 characters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  const errors: Record<string, string> = {}

  if (!password) {
    errors.password = 'Password is required'
  } else {
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain at least one number'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}