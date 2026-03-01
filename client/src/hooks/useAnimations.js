import { motion } from 'framer-motion';

// ============================================
// ANIMATION VARIANTS
// ============================================

// Page transitions - fade + slide up
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

// Card hover animations - scale + glow
export const cardHover = {
  rest: { scale: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  hover: { 
    scale: 1.02, 
    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

// List stagger container - for animating lists with staggered children
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

// Scroll reveal - fades in as element scrolls into view
export const scrollReveal = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

// Modal animations
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

// Overlay for modals
export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// Card entry variants for stagger animations
export const cardEntryVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

// Glow effect variants
export const glowVariants = {
  initial: { boxShadow: '0 0 0 rgba(0,0,0,0)' },
  animate: (color) => ({ 
    boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
    transition: { duration: 0.3 }
  })
};

// Slide in from direction
export const slideInVariants = {
  left: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
  },
  right: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 }
  },
  up: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 }
  },
  down: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  }
};

// Bounce in animation
export const bounceIn = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  }
};

// Pulse animation for badges/highlights
export const pulseVariants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 }
  }
};

// ============================================
// REUSABLE ANIMATED COMPONENTS
// ============================================

// Animated wrapper for page transitions
export function AnimatedPage({ children, className }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  );
}

// Animated card with hover effects
export function AnimatedCard({ children, className, onClick, style, glowColor }) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      style={style}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={cardHover}
      animate={glowColor ? (variant) => variant === 'animate' ? { boxShadow: `0 0 20px ${glowColor}40` } : {} : undefined}
    >
      {children}
    </motion.div>
  );
}

// Staggered list container
export function StaggerList({ children, className, delay = 0.08 }) {
  return (
    <motion.div
      className={className}
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: delay,
            delayChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
export function StaggerItem({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={cardEntryVariants}
    >
      {children}
    </motion.div>
  );
}

// Scroll reveal wrapper
export function ScrollReveal({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      variants={scrollReveal}
    >
      {children}
    </motion.div>
  );
}

// Animated modal
export function AnimatedModal({ isOpen, onClose, children, className, style }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={onClose}
          />
          <motion.div
            className={className}
            style={style}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Need AnimatePresence for some components
export { AnimatePresence } from 'framer-motion';
export { motion };

// ============================================
// HOOK: useAnimationConfig
// ============================================

/**
 * Centralized animation configuration hook
 * Use this to maintain consistent animations across the app
 */
export function useAnimationConfig() {
  return {
    // Timing
    fast: { duration: 0.15 },
    normal: { duration: 0.3 },
    slow: { duration: 0.5 },
    
    // Easing
    easeOut: { ease: 'easeOut' },
    easeInOut: { ease: 'easeInOut' },
    spring: { type: 'spring', stiffness: 300, damping: 24 },
    springBouncy: { type: 'spring', stiffness: 400, damping: 17 },
    
    // Stagger delays
    staggerFast: 0.05,
    staggerNormal: 0.08,
    staggerSlow: 0.12,
    
    // Thresholds
    viewportOnce: true,
    viewportMargin: '-50px'
  };
}

// ============================================
// HOOK: useStaggerAnimation
// ============================================

/**
 * Hook for creating staggered list animations
 * @param {number} itemCount - Number of items in the list
 * @param {number} staggerDelay - Delay between each item
 */
export function useStaggerAnimation(itemCount, staggerDelay = 0.08) {
  return {
    container: {
      animate: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1
        }
      }
    },
    item: {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
      }
    }
  };
}
