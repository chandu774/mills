import { NavLink } from 'react-router-dom';
import { Home, Play, Trophy, BarChart2, Users, BookOpen, User, Bell, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export interface DesktopSidebarProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  unreadNotificationsCount?: number;
}

export function DesktopSidebar({ onOpenNotifications, onOpenAuth, unreadNotificationsCount = 0 }: DesktopSidebarProps) {
  const { user, profile, ratings, signOut } = useAuth();
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/play', label: 'Play', icon: Play },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/leaderboard', label: 'Leaderboards', icon: BarChart2 },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/rules', label: 'Learn Rules', icon: BookOpen },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-background-border h-screen sticky top-0 shrink-0 select-none z-30 shadow-2xs">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-5 border-b border-background-border">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#3D2817] flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform border border-[#26150A]">
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#FDFBF7] fill-none stroke-[7]">
              <rect x="15" y="15" width="70" height="70" rx="4" />
              <rect x="35" y="35" width="30" height="30" rx="2" />
              <line x1="50" y1="15" x2="50" y2="35" />
              <line x1="50" y1="65" x2="50" y2="85" />
              <line x1="15" y1="50" x2="35" y2="50" />
              <line x1="65" y1="50" x2="85" y2="50" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-wider text-ink">MILLS</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold uppercase tracking-widest border border-primary/20">CLASSIC</span>
            </div>
            <p className="text-[11px] text-ink-subtle font-medium">Board Game Arena</p>
          </div>
        </NavLink>

        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-ink-subtle hover:text-ink hover:bg-background-elevated transition-colors cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-alert-danger ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* Primary Call To Action */}
      <div className="p-4">
        <NavLink to="/play">
          <Button variant="primary" size="lg" className="w-full gap-2.5 text-base font-extrabold shadow-soft">
            <Play className="h-5 w-5 fill-current" />
            PLAY NOW
          </Button>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-background-subtle"
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Rating Snapshot (Clean List Rows, No Heavy Cards) */}
      <div className="p-4 border-t border-background-border bg-background-subtle/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Your Ratings</span>
          <NavLink to="/profile" className="text-[11px] text-primary hover:underline font-semibold">Details</NavLink>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-background-border/80">
            <span className="text-ink-muted">3 Mills</span>
            <span className="font-mono font-bold text-ink">{ratings?.mills3 || 1200}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-background-border/80">
            <span className="text-ink-muted">6 Mills</span>
            <span className="font-mono font-bold text-ink">{ratings?.mills6 || 1200}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-background-border/80">
            <span className="text-ink-muted">9 Mills</span>
            <span className="font-mono font-bold text-ink">{ratings?.mills9 || 1200}</span>
          </div>
        </div>

        {/* User Account Button */}
        <div className="pt-3 mt-3 border-t border-background-border">
          {user ? (
            <div className="flex items-center justify-between">
              <NavLink to="/profile" className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                  {profile?.displayName?.[0] || 'U'}
                </div>
                <span className="text-xs font-bold text-ink truncate">
                  @{profile?.username || 'player'}
                </span>
              </NavLink>
              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-1.5 rounded-lg text-ink-subtle hover:text-alert-danger hover:bg-background-elevated transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAuth}
              className="w-full gap-2 text-xs font-bold text-ink border-background-border"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In / Join
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
