// Secure logging utility to prevent sensitive information exposure

const SENSITIVE_PATTERNS = [
  // API Keys and tokens
  /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, // JWT tokens
  /(?:api[_-]?key|apikey|token)[=:]\s*['"]*([a-zA-Z0-9_-]+)['"]*\s*/gi, // API keys
  /(?:secret|password)[=:]\s*['"]*([^'"&\s]+)['"]*\s*/gi, // Secrets/passwords
  // URLs with credentials
  /https?:\/\/[^\/\s]*:[^@\s]*@[^\s]+/g, // URLs with credentials
  // Supabase specific
  /pvrcuacpmcfkhqolyfhc\.supabase\.co/g, // Project URL
]

const REDACTED_TEXT = '[REDACTED]'
const PARTIAL_REDACTED_TEXT = '[REDACTED-PARTIAL]'

export const sanitizeForLogging = (message: string): string => {
  let sanitized = message

  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => {
      // For URLs and tokens, show partial information for debugging
      if (match.includes('supabase.co') || match.includes('eyJ')) {
        const start = match.substring(0, Math.min(8, match.length))
        return `${start}...${PARTIAL_REDACTED_TEXT}`
      }
      return REDACTED_TEXT
    })
  })

  return sanitized
}

export const secureConsole = {
  log: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = sanitizeForLogging(message)
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'string' ? sanitizeForLogging(arg) : arg
    )
    console.log(sanitizedMessage, ...sanitizedArgs)
  },
  
  error: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = sanitizeForLogging(message)
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'string' ? sanitizeForLogging(arg) : arg
    )
    console.error(sanitizedMessage, ...sanitizedArgs)
  },
  
  warn: (message: string, ...args: unknown[]) => {
    const sanitizedMessage = sanitizeForLogging(message)
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'string' ? sanitizeForLogging(arg) : arg
    )
    console.warn(sanitizedMessage, ...sanitizedArgs)
  },
  
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedMessage = sanitizeForLogging(message)
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'string' ? sanitizeForLogging(arg) : arg
      )
      console.debug(sanitizedMessage, ...sanitizedArgs)
    }
  }
}

export const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) {
    return sanitizeForLogging(error.message)
  }
  if (typeof error === 'string') {
    return sanitizeForLogging(error)
  }
  return REDACTED_TEXT
}