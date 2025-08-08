'use client'

import { useState } from 'react'
import { Calendar, Edit, Trash2, User, Building, PlayCircle, PauseCircle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RPAProcess } from '@/types'
import { cn } from '@/lib/utils'

interface ProcessCardProps {
  process: RPAProcess
  onEdit: (process: RPAProcess) => void
  onDelete: (processId: string) => void
}

export function ProcessCard({ process, onEdit, onDelete }: ProcessCardProps) {
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

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden',
        'animate-in slide-in-from-bottom-1 duration-300'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3 relative">
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
          className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors pr-16 mb-2"
          onClick={() => onEdit(process)}
        >
          {process.name}
        </h3>
        
        {process.owner && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <User className="h-3 w-3" />
            {process.owner}
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
        className="cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => onEdit(process)}
      >
        <p className="text-muted-foreground line-clamp-3 leading-relaxed mb-3">
          {process.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Modified: {formatDate(process.lastModified)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}