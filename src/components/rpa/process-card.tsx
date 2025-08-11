'use client'

import { useState } from 'react'
import { Calendar, Edit, Trash2, User, Building, PlayCircle, PauseCircle, CheckCircle, Clock, Factory, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RPAProcess, ViewMode } from '@/types'
import { cn } from '@/lib/utils'

interface ProcessCardProps {
  process: RPAProcess
  onEdit: (process: RPAProcess) => void
  onDelete: (processId: string) => void
  viewMode?: ViewMode
  isDragging?: boolean
}

export function ProcessCard({ process, onEdit, onDelete, viewMode = 'grid', isDragging = false }: ProcessCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getStatusIcon = (status: RPAProcess['status']) => {
    switch (status) {
      case 'active': return PlayCircle
      case 'in-progress': return Clock
      case 'completed': return CheckCircle
      case 'on-hold': return PauseCircle
      default: return Clock
    }
  }
  
  const getStatusColor = (status: RPAProcess['status']) => {
    switch (status) {
      case 'active': return 'default'
      case 'in-progress': return 'secondary'
      case 'completed': return 'secondary'
      case 'on-hold': return 'outline'
      default: return 'outline'
    }
  }
  
  const getStatusStyle = (status: RPAProcess['status']) => {
    switch (status) {
      case 'active': 
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
      case 'in-progress': 
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
      case 'completed': 
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
      case 'on-hold': 
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
      default: 
        return ''
    }
  }
  
  const StatusIcon = getStatusIcon(process.status)
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDueDateStatus = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { status: 'overdue', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' }
    if (diffDays === 0) return { status: 'due-today', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800' }
    if (diffDays <= 7) return { status: 'due-soon', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' }
    return { status: 'normal', color: 'text-muted-foreground', bgColor: '' }
  }

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden h-full',
        'animate-in slide-in-from-bottom-1 duration-300',
        isDragging && 'opacity-50 shadow-lg rotate-2',
        viewMode === 'list' && 'flex flex-row items-stretch'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className={cn(
        'pb-3 relative',
        viewMode === 'list' && 'flex-none w-96'
      )}>
        <div className={cn(
          'absolute top-4 right-4 flex gap-1 transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(process)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(process.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <h3 
          className={cn(
            'font-semibold cursor-pointer hover:text-primary transition-colors pr-16 mb-2',
            viewMode === 'grid' ? 'text-lg' : 'text-base'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(process)
          }}
        >
          {process.name}
        </h3>
        
        {process.owner && (
          <div className={cn(
            'flex items-center gap-1 text-muted-foreground mb-2',
            viewMode === 'grid' ? 'text-sm' : 'text-xs'
          )}>
            <User className="h-3 w-3" />
            {process.owner}
          </div>
        )}
        
        {process.entityName && (
          <div className={cn(
            'flex items-center gap-1 text-muted-foreground mb-2',
            viewMode === 'grid' ? 'text-sm' : 'text-xs'
          )}>
            <Factory className="h-3 w-3" />
            {process.entityName}
          </div>
        )}

        {process.dueDate && (
          <div className={cn(
            'flex items-center gap-1 mb-2',
            viewMode === 'grid' ? 'text-sm' : 'text-xs',
            getDueDateStatus(process.dueDate).color
          )}>
            <CalendarDays className="h-3 w-3" />
            <span>Due: {formatDueDate(process.dueDate)}</span>
            {getDueDateStatus(process.dueDate).status === 'overdue' && (
              <Badge variant="destructive" className="ml-1 text-xs px-1 py-0">
                Overdue
              </Badge>
            )}
            {getDueDateStatus(process.dueDate).status === 'due-today' && (
              <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                Due Today
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <Badge 
            variant={getStatusColor(process.status)}
            className={cn('flex items-center gap-1', getStatusStyle(process.status))}
          >
            <StatusIcon className="h-3 w-3" />
            {process.status.replace('-', ' ').toUpperCase()}
          </Badge>
          
          {process.department && (
            <Badge variant="outline" className="text-xs">
              <Building className="h-3 w-3 mr-1" />
              {process.department}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent 
        className={cn(
          'cursor-pointer hover:bg-muted/20 transition-colors',
          viewMode === 'list' && 'flex-1'
        )}
        onClick={(e) => {
          e.stopPropagation()
          onEdit(process)
        }}
      >
        <p className={cn(
          'text-muted-foreground leading-relaxed mb-3',
          viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'
        )}>
          {process.description}
        </p>
        
        <div className={cn(
          'flex items-center justify-between text-muted-foreground',
          viewMode === 'grid' ? 'text-xs' : 'text-xs'
        )}>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Modified: {formatDate(process.lastModified)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}