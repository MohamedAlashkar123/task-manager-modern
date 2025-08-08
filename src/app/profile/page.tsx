'use client'

import { Header } from '@/components/layout/header'
import { UserProfile } from '@/components/auth/UserProfile'
import { useRequireAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const { user, loading } = useRequireAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="space-y-6">
      <Header
        title="Profile Settings"
        subtitle="Manage your account information and preferences"
      />
      <UserProfile />
    </div>
  )
}