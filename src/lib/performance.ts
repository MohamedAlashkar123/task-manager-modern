// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private isEnabled = typeof window !== 'undefined' && 'performance' in window

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }

  // Start timing an operation
  startTiming(label: string): () => void {
    if (!this.isEnabled) return () => {}
    
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.recordMetric(label, duration)
    }
  }

  // Record a metric
  recordMetric(label: string, value: number): void {
    if (!this.isEnabled) return
    
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const metrics = this.metrics.get(label)!
    metrics.push(value)
    
    // Keep only last 100 measurements to prevent memory leaks
    if (metrics.length > 100) {
      metrics.shift()
    }
    
    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && value > 1000) {
      console.warn(`🐌 Slow operation detected: ${label} took ${value.toFixed(2)}ms`)
    }
  }

  // Get average for a metric
  getAverage(label: string): number {
    const metrics = this.metrics.get(label)
    if (!metrics || metrics.length === 0) return 0
    
    const sum = metrics.reduce((a, b) => a + b, 0)
    return sum / metrics.length
  }

  // Get performance report
  getReport(): Record<string, { average: number; count: number; latest: number }> {
    const report: Record<string, { average: number; count: number; latest: number }> = {}
    
    for (const [label, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        const average = metrics.reduce((a, b) => a + b, 0) / metrics.length
        report[label] = {
          average: Math.round(average * 100) / 100,
          count: metrics.length,
          latest: Math.round(metrics[metrics.length - 1] * 100) / 100
        }
      }
    }
    
    return report
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear()
  }

  // Log performance report to console (development only)
  logReport(): void {
    if (process.env.NODE_ENV !== 'development') return
    
    const report = this.getReport()
    if (Object.keys(report).length > 0) {
      console.table(report)
    }
  }
}

// Global performance monitor instance
export const perfMonitor = PerformanceMonitor.getInstance()

// React hook for timing components
export function usePerformanceTimer(label: string) {
  const startTiming = () => perfMonitor.startTiming(label)
  
  return { startTiming }
}

// Decorator for timing functions
export function timed(label?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const timerLabel = label || `${(target as { constructor: { name: string } }).constructor.name}.${propertyKey}`
    
    descriptor.value = function (...args: unknown[]) {
      const endTiming = perfMonitor.startTiming(timerLabel)
      try {
        const result = originalMethod.apply(this, args)
        
        // Handle async methods
        if (result instanceof Promise) {
          return result.finally(() => endTiming())
        }
        
        endTiming()
        return result
      } catch (error) {
        endTiming()
        throw error
      }
    }
    
    return descriptor
  }
}

// Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Monitor Core Web Vitals
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      perfMonitor.recordMetric('CLS', metric.value)
    })
    
    onINP((metric) => {
      perfMonitor.recordMetric('INP', metric.value)
    })
    
    onFCP((metric) => {
      perfMonitor.recordMetric('FCP', metric.value)
    })
    
    onLCP((metric) => {
      perfMonitor.recordMetric('LCP', metric.value)
    })
    
    onTTFB((metric) => {
      perfMonitor.recordMetric('TTFB', metric.value)
    })
  }).catch(() => {
    // web-vitals not available, skip monitoring
  })
}

// Performance observer for long tasks
export function observeLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          perfMonitor.recordMetric('LongTask', entry.duration)
          
          // Only warn for tasks > 100ms to reduce noise
          if (process.env.NODE_ENV === 'development' && entry.duration > 100) {
            console.warn(`🕒 Long task detected: ${entry.duration.toFixed(2)}ms`)
          }
        }
      }
    })
    
    observer.observe({ entryTypes: ['longtask'] })
  } catch {
    // PerformanceObserver not supported or error, skip
  }
}