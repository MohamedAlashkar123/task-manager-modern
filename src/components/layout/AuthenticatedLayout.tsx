'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Pages that don't require authentication
  const publicPages = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password']
  const isPublicPage = publicPages.includes(pathname)

  // Show loading spinner during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // For public pages (auth pages), render without main layout
  if (isPublicPage) {
    return <>{children}</>
  }

  // For protected pages, redirect to login if not authenticated
  if (!user) {
    // This is handled by the useRequireAuth hook in individual components
    // But we can also handle it here for extra safety
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-muted-foreground">Redirecting to login...</span>
          </div>
        </div>
      </div>
    )
  }

  // Render main layout for authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Navigation />
        {children}
      </div>
    </div>
  )
}