'use client'

import dynamic from 'next/dynamic'
import { PageLoadingSpinner } from '@/components/layout/LoadingSpinner'

// Lazy load heavy components with loading fallbacks
export const LazyTaskFormDialog = dynamic(
  () => import('@/components/tasks/task-form-dialog').then(mod => ({ default: mod.TaskFormDialog })),
  {
    loading: () => <PageLoadingSpinner text="Loading form..." />,
    ssr: false
  }
)

export const LazyProcessFormDialog = dynamic(
  () => import('@/components/rpa/process-form-dialog').then(mod => ({ default: mod.ProcessFormDialog })),
  {
    loading: () => <PageLoadingSpinner text="Loading form..." />,
    ssr: false
  }
)

export const LazySortableLayout = dynamic(
  () => import('@/components/layout/SortableLayout').then(mod => ({ default: mod.SortableLayout })),
  {
    loading: () => <PageLoadingSpinner text="Loading tasks..." />,
    ssr: false
  }
)

export const LazyNotesPage = dynamic(
  () => import('@/app/notes/page'),
  {
    loading: () => <PageLoadingSpinner text="Loading notes..." />,
    ssr: false
  }
)

export const LazyRPAProcessesPage = dynamic(
  () => import('@/app/rpa-processes/page'),
  {
    loading: () => <PageLoadingSpinner text="Loading RPA processes..." />,
    ssr: false
  }
)