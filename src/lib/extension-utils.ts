// Extension communication utilities with error handling
export class ExtensionCommunicator {
  private static instance: ExtensionCommunicator
  private isExtensionAvailable = false

  static getInstance(): ExtensionCommunicator {
    if (!this.instance) {
      this.instance = new ExtensionCommunicator()
    }
    return this.instance
  }

  constructor() {
    this.checkExtensionAvailability()
  }

  private checkExtensionAvailability(): void {
    try {
      // Check if running in browser and chrome APIs are available
      this.isExtensionAvailable = 
        typeof window !== 'undefined' && 
        'chrome' in window && 
        'runtime' in (window as { chrome?: { runtime?: unknown } }).chrome!
    } catch {
      this.isExtensionAvailable = false
    }
  }

  async sendMessage(message: Record<string, unknown>, timeout = 5000): Promise<unknown> {
    if (!this.isExtensionAvailable) {
      throw new Error('Extension not available')
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Extension communication timeout'))
      }, timeout)

      try {
        (window as unknown as { chrome: { runtime: { sendMessage: (message: unknown, callback: (response: unknown) => void) => void, lastError?: { message?: string } } } }).chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeoutId)
          
          // Check for chrome.runtime.lastError
          const chrome = (window as unknown as { chrome: { runtime: { lastError?: { message?: string } } } }).chrome
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError
            if (error.message?.includes('message channel closed')) {
              console.warn('Extension communication failed, falling back to manual mode')
              reject(new Error('Extension communication failed'))
            } else {
              reject(new Error(error.message || 'Unknown extension error'))
            }
            return
          }

          resolve(response)
        })
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  async sendMessageWithFallback<T>(
    message: Record<string, unknown>, 
    fallbackFn: () => Promise<T>,
    timeout = 5000
  ): Promise<T> {
    try {
      return await this.sendMessage(message, timeout) as T
    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes('Extension communication failed') ||
           error.message.includes('Extension not available') ||
           error.message.includes('message channel closed'))) {
        console.warn('Extension unavailable, using fallback:', error.message)
        return await fallbackFn()
      }
      throw error
    }
  }

  isAvailable(): boolean {
    return this.isExtensionAvailable
  }
}

// Global instance
export const extensionComm = ExtensionCommunicator.getInstance()

// Error handler for unhandled extension errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('message channel closed')) {
      console.warn('Caught unhandled extension communication error:', event.reason.message)
      event.preventDefault() // Prevent the error from being logged as uncaught
    }
  })
}