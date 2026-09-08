import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'amber';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-background-elevated text-ink-muted border-background-border",
    success: "bg-primary/10 text-primary border-primary/25",
    warning: "bg-gold/15 text-gold border-gold/30",
    danger: "bg-alert-danger/10 text-alert-danger border-alert-danger/25",
    outline: "border-background-border text-ink-muted",
    amber: "bg-gold/15 text-gold border-gold/30 font-bold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
