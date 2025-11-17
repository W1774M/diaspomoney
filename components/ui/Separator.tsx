import { cn } from '@/lib/utils';
import React from 'react';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        className={cn(
          'shrink-0 bg-border',
          orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Separator.displayName = 'Separator';

export { Separator };
