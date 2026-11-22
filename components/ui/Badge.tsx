import { cn } from '@/lib/utils';
import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          {
            'border-transparent bg-primary text-primary-foreground':
              variant === 'default',
            'border-transparent bg-secondary text-secondary-foreground':
              variant === 'secondary',
            'border-transparent bg-destructive text-destructive-foreground':
              variant === 'destructive',
            'text-foreground': variant === 'outline',
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';

export { Badge };
