'use client'

import { Calendar, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task, ViewMode } from '@/types'
import { useTasksStore } from '@/store/tasks-supabase'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  viewMode?: ViewMode
  isDragging?: boolean
}

export function TaskCard({ task, onEdit, onDelete, viewMode = 'list', isDragging = false }: TaskCardProps) {
  const { toggleTask, updateTask } = useTasksStore()
  
  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false
    return new Date(task.dueDate) < new Date()
  }
  
  const isDueToday = () => {
    if (!task.dueDate || task.completed) return false
    const today = new Date()
    const dueDate = new Date(task.dueDate)
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === today.getTime()
  }
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }
  
  const getStatusColor = () => {
    if (task.completed) return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    if (isOverdue()) return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    if (isDueToday()) return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
    return ''
  }
  
  const handleStatusChange = async (status: string) => {
    await updateTask(task.id, { 
      status: status as Task['status'],
      completed: status === 'Completed'
    })
  }
  
  if (viewMode === 'grid') {
    return (
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md h-full',
        getStatusColor(),
        task.completed && 'opacity-75',
        isDragging && 'opacity-50 transform rotate-2'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <Badge variant={getPriorityColor()}>
                {task.priority}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(task)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(task.id)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h3 
            className={cn(
              'font-semibold cursor-pointer hover:text-primary transition-colors text-sm',
              task.completed && 'line-through text-muted-foreground'
            )}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
          >
            {task.title}
          </h3>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {task.dueDate && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue() ? 'text-destructive' : isDueToday() ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
              )}>
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger 
                className="w-full h-8 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      getStatusColor(),
      task.completed && 'opacity-75',
      isDragging && 'opacity-50 shadow-lg'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <h3 
              className={cn(
                'font-semibold cursor-pointer flex-1 hover:text-primary transition-colors',
                task.completed && 'line-through text-muted-foreground'
              )}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}
            >
              {task.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Badge variant={getPriorityColor()}>
              {task.priority}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(task)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(task.id)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {task.dueDate && (
              <div className={cn(
                'flex items-center gap-1 text-sm',
                isOverdue() ? 'text-destructive' : isDueToday() ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
              )}>
                <Calendar className="h-4 w-4" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger 
              className="w-32"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}