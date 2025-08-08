'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RPAProcess } from '@/types'
import { useRPAProcessesStore } from '@/store/rpa-processes'

interface ProcessFormDialogProps {
  process?: RPAProcess
  open: boolean
  onOpenChange: (open: boolean) => void
}

const departments = [
  'Finance',
  'HR',
  'IT', 
  'Operations',
  'Marketing',
  'Sales',
  'Customer Service',
  'Procurement',
  'Legal',
  'Other'
]

export function ProcessFormDialog({ process, open, onOpenChange }: ProcessFormDialogProps) {
  const { addProcess, updateProcess } = useRPAProcessesStore()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as RPAProcess['status'],
    owner: '',
    department: '',
  })

  useEffect(() => {
    if (process) {
      setFormData({
        name: process.name,
        description: process.description,
        status: process.status,
        owner: process.owner || '',
        department: process.department || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'active',
        owner: '',
        department: '',
      })
    }
  }, [process, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.description.trim()) return
    
    if (process) {
      updateProcess(process.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        owner: formData.owner.trim() || null,
        department: formData.department || null,
      })
    } else {
      addProcess({
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        owner: formData.owner.trim() || null,
        department: formData.department || null,
      })
    }
    
    onOpenChange(false)
    setFormData({ name: '', description: '', status: 'active', owner: '', department: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{process ? 'Edit RPA Process' : 'Add New RPA Process'}</DialogTitle>
          <DialogDescription>
            {process ? 'Update your RPA process details.' : 'Create a new RPA process to track automation initiatives.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Process Name *</Label>
            <Input
              id="name"
              placeholder="Enter process name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Process Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this RPA process does..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[100px] resize-y"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: RPAProcess['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="owner">Owner/Business Unit</Label>
            <Input
              id="owner"
              placeholder="Enter owner or business unit..."
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {process ? 'Update Process' : 'Save Process'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}