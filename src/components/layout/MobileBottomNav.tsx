import { NavLink } from 'react-router-dom';
import { Home, Trophy, BarChart2, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/leaderboard', label: 'Ranks', icon: BarChart2 },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-background-border pb-safe select-none shadow-board">
      <div className="flex items-center justify-around px-1 py-1.5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] active:scale-95",
                  isActive ? "text-primary font-bold" : "text-ink-subtle hover:text-ink"
                )
              }
            >
              <Icon className="h-4.5 w-4.5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
