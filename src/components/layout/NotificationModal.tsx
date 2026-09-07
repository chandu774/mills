import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AppNotification } from '@/lib/types';
import { Swords, Trophy, UserPlus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export function NotificationModal({ isOpen, onClose, notifications, onMarkAllRead }: NotificationModalProps) {
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'challenge':
        return <Swords className="h-4 w-4 text-emerald-400" />;
      case 'tournament':
        return <Trophy className="h-4 w-4 text-amber-400" />;
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-sky-400" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      description="Stay updated with games, friend challenges, and tournaments."
    >
      <div className="space-y-3 mt-2">
        <div className="flex justify-end">
          <button
            onClick={onMarkAllRead}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "p-3.5 rounded-xl border transition-all flex items-start gap-3",
                n.read
                  ? "bg-background-elevated/40 border-background-border text-slate-400"
                  : "bg-background-elevated border-slate-600 text-slate-200"
              )}
            >
              <div className="p-2 rounded-lg bg-background-card border border-background-border shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{n.title}</h4>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.description}</p>
                {n.type === 'challenge' && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="primary" className="h-8 text-xs">
                      Accept & Play
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs">
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
