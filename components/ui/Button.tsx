import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cta'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          // Variants
          variant === 'primary' && [
            'bg-primary-600 text-white',
            'hover:bg-primary-700 hover:shadow-md',
            'focus:ring-primary-500',
          ],
          variant === 'secondary' && [
            'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-border)] hover:shadow-sm',
            'focus:ring-[var(--color-border)]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-tertiary)]',
            'focus:ring-[var(--color-border)]',
          ],
          variant === 'cta' && [
            'bg-gradient-to-r from-cta to-cta-hover text-white',
            'hover:shadow-lg hover:shadow-cta/25',
            'focus:ring-cta',
          ],
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm gap-1.5',
          size === 'md' && 'px-4 py-2 text-base gap-2',
          size === 'lg' && 'px-6 py-3 text-lg gap-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'