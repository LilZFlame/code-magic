import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg border',
            'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-muted)]',
            'transition-all duration-200 ease-out',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
            error
              ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500 animate-slide-up">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'