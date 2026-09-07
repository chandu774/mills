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
    <Card className={cn("overflow-hidden hover:border-slate-600 transition-all", className)}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
        </div>
        {icon && (
          <div className="rounded-xl bg-background-elevated border border-background-border p-3 text-slate-300">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
