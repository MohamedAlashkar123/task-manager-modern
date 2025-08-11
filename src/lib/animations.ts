/**
 * Animation utilities for smooth transitions and effects
 */

export const animations = {
  // Stagger children animations
  staggerChildren: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // View mode transition
  viewModeTransition: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  
  // Drag overlay animation
  dragOverlay: {
    initial: { scale: 1.02, rotate: 2 },
    animate: { scale: 1.05, rotate: 5 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  
  // Card hover animation
  cardHover: {
    hover: { y: -4, transition: { duration: 0.2, ease: 'easeOut' } },
    tap: { scale: 0.98, transition: { duration: 0.1 } }
  }
}

export const springConfig = {
  type: 'spring',
  stiffness: 260,
  damping: 20
}

export const easeInOutCubic = [0.4, 0, 0.2, 1]

/**
 * CSS class utilities for animations
 */
export const animationClasses = {
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-bottom-2 duration-300',
  slideInStaggered: 'animate-in slide-in-from-bottom-1 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  
  // Smooth transitions between view modes
  viewTransition: 'transition-all duration-300 ease-in-out',
  
  // Drag states
  isDragging: 'opacity-50 rotate-2 scale-105 shadow-2xl z-50',
  dragPlaceholder: 'opacity-30 scale-95',
  dropZone: 'ring-2 ring-primary ring-opacity-50 bg-primary/5',
  
  // Hover effects
  cardHover: 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
  
  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce'
}

/**
 * Utility function to create staggered animations
 */
export const createStaggeredAnimation = (index: number, delay = 50) => ({
  animationDelay: `${index * delay}ms`,
  animationFillMode: 'both'
})

/**
 * Utility function for touch-friendly tap targets
 */
export const touchTarget = {
  minSize: 'min-h-[44px] min-w-[44px]',
  padding: 'p-2',
  margin: 'm-1'
}

/**
 * Performance optimized animation settings
 */
export const performanceSettings = {
  // Use GPU acceleration
  willChange: 'transform, opacity',
  // Reduce motion for users with motion preferences
  reduceMotion: 'motion-reduce:animate-none motion-reduce:transition-none'
}