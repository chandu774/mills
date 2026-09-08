import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'pills' | 'underline';
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'pills' }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div role="tablist" className={cn("flex border-b border-background-border gap-6 overflow-x-auto no-scrollbar", className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center gap-2 pb-3 pt-1 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive ? "bg-primary/10 text-primary" : "bg-background-elevated text-ink-muted"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" className={cn("flex rounded-xl bg-background-elevated p-1 gap-1 overflow-x-auto no-scrollbar border border-background-border/50", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold transition-all whitespace-nowrap min-h-[38px] cursor-pointer",
              isActive
                ? "bg-white text-ink shadow-soft font-bold"
                : "text-ink-muted hover:text-ink"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                isActive ? "bg-primary/15 text-primary" : "bg-background-darker text-ink-muted"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
