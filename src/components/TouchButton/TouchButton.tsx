import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg' | 'xl'

interface TouchButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

/*
 * Sizes start at the brief's 64×64 px floor and grow from there; primary
 * actions on a 1920×1080 screen get `xl`. Feedback is a press-scale
 * rather than a hover state, because nothing hovers on a touchscreen.
 */
const sizeClass: Record<Size, string> = {
  md: 'min-h-touch min-w-touch px-8 text-2xl',
  lg: 'min-h-20 min-w-40 px-12 text-3xl',
  xl: 'min-h-24 min-w-56 px-16 text-4xl',
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-accent text-text-inverse shadow-[0_12px_40px_-12px_rgba(216,178,94,0.7)] border border-accent/40',
  secondary:
    'bg-surface-raised text-text-primary border border-white/15 backdrop-blur-sm',
  ghost: 'bg-transparent text-text-secondary border border-white/10',
}

export function TouchButton({
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
  disabled,
  ...rest
}: TouchButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled}
      className={[
        'text-display inline-flex select-none items-center justify-center rounded-2xl',
        'transition-opacity duration-200 disabled:opacity-40',
        sizeClass[size],
        variantClass[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
