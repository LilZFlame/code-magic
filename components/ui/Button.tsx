import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' && [
            'bg-primary-600 text-white',
            'hover:bg-primary-700',
            'focus:ring-primary-500',
          ],
          variant === 'secondary' && [
            'bg-gray-200 text-gray-900',
            'hover:bg-gray-300',
            'focus:ring-gray-500',
            'dark:bg-gray-700 dark:text-gray-100',
            'dark:hover:bg-gray-600',
          ],
          variant === 'ghost' && [
            'bg-transparent text-gray-700',
            'hover:bg-gray-100',
            'focus:ring-gray-500',
            'dark:text-gray-300 dark:hover:bg-gray-800',
          ],
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-base',
          size === 'lg' && 'px-6 py-3 text-lg',
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