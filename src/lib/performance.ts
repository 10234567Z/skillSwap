/**
 * Performance monitoring utilities
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getAverageTime(label: string): number {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return 0
    
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {}
    
    this.metrics.forEach((values, label) => {
      result[label] = {
        average: this.getAverageTime(label),
        count: values.length
      }
    })
    
    return result
  }
}

// Decorator for measuring function performance
export function measurePerformance(label: string) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!
    
    descriptor.value = async function (...args: Parameters<T>) {
      const monitor = PerformanceMonitor.getInstance()
      const stopTimer = monitor.startTimer(label)
      
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } finally {
        stopTimer()
      }
    } as T
    
    return descriptor
  }
}
