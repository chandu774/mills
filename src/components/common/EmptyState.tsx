import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-background-border bg-white/80 my-4", className)}>
      <div className="rounded-2xl bg-background-elevated p-4 text-ink-muted border border-background-border mb-3 shadow-soft">
        {icon}
      </div>
      <h4 className="text-base font-bold text-ink mb-1">{title}</h4>
      <p className="text-xs md:text-sm text-ink-muted max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
