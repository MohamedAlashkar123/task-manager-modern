'use client'

import { useEffect } from 'react'
import { initWebVitals, observeLongTasks } from '@/lib/performance'

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance monitoring
    initWebVitals()
    observeLongTasks()
  }, [])

  return <>{children}</>
}