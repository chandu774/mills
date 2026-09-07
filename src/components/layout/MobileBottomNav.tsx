import { NavLink } from 'react-router-dom';
import { Home, Play, Trophy, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/tournaments', label: 'Arena', icon: Trophy },
    { to: '/play', label: 'Play', icon: Play, isPrimary: true },
    { to: '/leaderboard', label: 'Ranks', icon: BarChart2 },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background-card/95 backdrop-blur-md border-t border-background-border pb-safe select-none">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95",
                    isActive ? "scale-105" : ""
                  )
                }
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-background p-3">
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                </div>
                <span className="text-[10px] font-bold text-primary mt-1">Play</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors min-w-[56px]",
                  isActive ? "text-primary font-bold" : "text-slate-400 hover:text-slate-200"
                )
              }
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
