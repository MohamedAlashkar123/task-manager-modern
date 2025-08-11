'use client'

import { useState, useEffect } from 'react'
import { ViewMode } from '@/types'

interface LayoutPreferences {
  viewMode: ViewMode
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  viewMode: 'list'
}

export function useLayoutPreferences(storageKey: string) {
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<LayoutPreferences>
          setPreferences(prev => ({ ...prev, ...parsed }))
        }
      } catch (error) {
        console.warn('Failed to load layout preferences:', error)
      } finally {
        setIsLoaded(true)
      }
    }
  }, [storageKey])

  const updatePreferences = (updates: Partial<LayoutPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newPreferences))
      } catch (error) {
        console.warn('Failed to save layout preferences:', error)
      }
    }
  }

  const setViewMode = (viewMode: ViewMode) => {
    updatePreferences({ viewMode })
  }

  return {
    preferences,
    isLoaded,
    setViewMode,
    updatePreferences
  }
}