'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, PlayCircle, Clock, CheckCircle, PauseCircle } from 'lucide-react'
import { useRPAProcessesStore } from '@/store/rpa-processes-supabase'

export function ProcessStats() {
  const { processes } = useRPAProcessesStore()
  
  const stats = {
    total: processes.length,
    active: processes.filter(process => process.status === 'active').length,
    inProgress: processes.filter(process => process.status === 'in-progress').length,
    completed: processes.filter(process => process.status === 'completed').length,
    onHold: processes.filter(process => process.status === 'on-hold').length,
  }
  
  const statCards = [
    {
      title: 'Total Processes',
      value: stats.total,
      icon: Settings,
      color: 'text-primary',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: PlayCircle,
      color: 'text-green-600',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-gray-600',
    },
    {
      title: 'On Hold',
      value: stats.onHold,
      icon: PauseCircle,
      color: 'text-yellow-600',
    },
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}