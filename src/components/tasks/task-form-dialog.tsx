'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task } from '@/types'
import { useTasksStore } from '@/store/tasks-supabase'

interface TaskFormDialogProps {
  task?: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskFormDialog({ task, open, onOpenChange }: TaskFormDialogProps) {
  const { addTask, updateTask } = useTasksStore()
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium' as Task['priority'],
    startDate: '',
    dueDate: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        priority: task.priority,
        startDate: task.startDate || '',
        dueDate: task.dueDate || '',
      })
    } else {
      setFormData({
        title: '',
        priority: 'medium' as Task['priority'],
        startDate: '',
        dueDate: '',
      })
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      if (task) {
        await updateTask(task.id, {
          title: formData.title.trim(),
          priority: formData.priority,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
        })
      } else {
        await addTask({
          title: formData.title.trim(),
          priority: formData.priority,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
          completed: false,
          status: 'Not Started',
          displayOrder: 0,
        })
      }
      
      onOpenChange(false)
      setFormData({ title: '', priority: 'medium', startDate: '', dueDate: '' })
    } catch (error) {
      console.error('Error submitting form:', error)
      // Error will be handled by the store and displayed in the UI
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update your task details.' : 'Create a new task to track your work.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date (optional)</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {task ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                task ? 'Update Task' : 'Add Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}