import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { NotificationModal } from '@/components/layout/NotificationModal';
import { usePWA } from '@/hooks/usePWA';
import { AppNotification } from '@/lib/types';
import { WifiOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function RootLayout() {
  const { isOnline, isInstallable, installApp } = usePWA();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sample platform notifications for Phase 1
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n1',
      title: 'Friend Challenge Received!',
      description: 'GrandmasterKai challenged you to a 9-Piece Mills 5-min match.',
      time: '12m ago',
      read: false,
      type: 'challenge',
    },
    {
      id: 'n2',
      title: 'Arena Tournament Starting Soon',
      description: 'Saturday Arena Blitz starts in 30 minutes. 64 players registered.',
      time: '45m ago',
      read: false,
      type: 'tournament',
    },
    {
      id: 'n3',
      title: 'Friend Request Accepted',
      description: 'TacticalEagle accepted your friendship request.',
      time: '2h ago',
      read: true,
      type: 'friend_request',
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-semibold py-1 px-4 text-center flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="h-4 w-4" />
          <span>Connection lost. Reconnecting...</span>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <DesktopSidebar
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Mobile Top Header */}
      <MobileHeader
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* PWA Install Banner */}
        {isInstallable && (
          <div className="bg-primary-subtle border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs text-primary font-medium">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Install Mills on your device for instant offline launch and full screen!</span>
            </div>
            <Button size="sm" variant="primary" onClick={installApp} className="py-1 px-3 min-h-[32px] text-xs">
              Install App
            </Button>
          </div>
        )}

        {/* Dynamic Page Router Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-safe-nav md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Notifications Dialog */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
}
