import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200 ease-out',
          variant === 'default' && [
            'border border-[var(--color-border)]',
            'bg-[var(--color-bg-primary)]',
            'shadow-sm hover:shadow-md',
          ],
          variant === 'glass' && [
            'glass',
          ],
          variant === 'elevated' && [
            'bg-[var(--color-bg-secondary)]',
            'shadow-lg hover:shadow-xl hover:-translate-y-0.5',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'