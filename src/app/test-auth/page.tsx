'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTasksStore } from '@/store/tasks-supabase'
import { useEffect } from 'react'

export default function TestAuthPage() {
  const { user, profile, loading } = useAuth()
  const { tasks, initializeTasks } = useTasksStore()

  useEffect(() => {
    if (user) {
      initializeTasks()
    }
  }, [user, initializeTasks])

  if (loading) {
    return <div className="text-center p-8">Loading...</div>
  }

  if (!user) {
    return <div className="text-center p-8">Not authenticated - redirecting...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🔐 Authentication Test</h1>
        <p className="text-muted-foreground">Verify your authentication setup is working correctly</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            User Information 
            <Badge variant="secondary">Authenticated ✅</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">User ID:</label>
              <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email:</label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Full Name:</label>
              <p className="text-sm text-muted-foreground">{profile?.full_name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email Confirmed:</label>
              <p className="text-sm text-muted-foreground">
                {user.email_confirmed_at ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            User-Specific Data 
            <Badge variant={tasks.length > 0 ? "default" : "secondary"}>
              {tasks.length} tasks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Your personal tasks (only you can see these):
              </p>
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{task.title}</span>
                  <Badge variant={
                    task.priority === 'high' ? 'destructive' : 
                    task.priority === 'medium' ? 'default' : 'secondary'
                  }>
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {tasks.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  ...and {tasks.length - 5} more tasks
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No tasks found. Create some tasks to test data isolation.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Create Tasks</p>
                <p className="text-sm text-muted-foreground">
                  Go to the main Tasks page and create some tasks. They should be associated with your user.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Test Data Isolation</p>
                <p className="text-sm text-muted-foreground">
                  Sign out, create another account, and verify you can't see the first user's tasks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Test Cross-Device Sync</p>
                <p className="text-sm text-muted-foreground">
                  Sign in from another browser/device with the same account. Changes should sync instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Test Profile Updates</p>
                <p className="text-sm text-muted-foreground">
                  Go to Profile page and update your full name. It should reflect here immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button asChild className="w-full">
              <a href="/">Go to Tasks Page</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}