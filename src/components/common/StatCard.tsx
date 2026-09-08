import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, subValue, icon, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden bg-white border-background-border hover:shadow-soft transition-all", className)}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-ink mt-1 font-mono">{value}</p>
          {subValue && <p className="text-xs text-ink-light mt-0.5">{subValue}</p>}
        </div>
        {icon && (
          <div className="rounded-xl bg-background-elevated border border-background-border p-3 text-ink-muted">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
