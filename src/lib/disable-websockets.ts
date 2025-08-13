// Disable WebSocket connections globally for security
// This prevents any WebSocket connections from being established

if (typeof window !== 'undefined') {
  // Override WebSocket constructor to prevent connections
  ;(window as unknown as { WebSocket: unknown }).WebSocket = class DisabledWebSocket {
    constructor(url: string) {
      console.warn('WebSocket connection blocked for security:', url)
      
      // Create a fake WebSocket that never connects
      return {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
        readyState: 3, // CLOSED
        bufferedAmount: 0,
        protocol: '',
        url: url,
        extensions: '',
        binaryType: 'blob' as BinaryType,
        
        // Event handlers
        onopen: null,
        onclose: null,
        onmessage: null,
        onerror: null,
        
        // Methods
        close: () => {
          console.log('WebSocket close() called (no-op)')
        },
        send: () => {
          console.warn('WebSocket send() called but connection is disabled')
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }
    }
    
    static get CONNECTING() { return 0 }
    static get OPEN() { return 1 }
    static get CLOSING() { return 2 }
    static get CLOSED() { return 3 }
  }

  // Also override the global WebSocket for any direct access
  Object.defineProperty(window, 'WebSocket', {
    value: (window as unknown as { WebSocket: unknown }).WebSocket,
    writable: false,
    configurable: false,
  })

  console.log('WebSocket connections have been disabled for security')
}

export {}