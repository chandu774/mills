import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { NotificationModal } from '@/components/layout/NotificationModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { SplashScreen } from '@/components/common/SplashScreen';
import { usePWA } from '@/hooks/usePWA';
import { AppNotification } from '@/lib/types';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RootLayout() {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/game');
  const { isOnline } = usePWA();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Notifications list (empty until real user events arrive)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col md:flex-row antialiased select-none">
      {/* App Launch Splash Screen */}
      <SplashScreen />

      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-alert-danger text-white text-xs font-semibold py-1 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="h-4 w-4" />
          <span>Connection lost. Reconnecting...</span>
        </div>
      )}

      {/* Desktop Left Sidebar (App Rail on Large Displays) */}
      <DesktopSidebar
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Mobile Top Header: Hidden on active game screen to maximize board view & avoid duplicate headers */}
      {!isGameRoute && (
        <MobileHeader
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          unreadNotificationsCount={unreadCount}
        />
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Dynamic Page Router Outlet */}
        <main
          className={cn(
            "flex-1 w-full mx-auto",
            isGameRoute
              ? "px-2 py-1.5 sm:px-3 sm:py-3 md:p-6 max-w-7xl pb-4 md:pb-8"
              : "px-3 py-3 sm:px-4 sm:py-4 md:p-8 max-w-6xl pb-24 md:pb-8"
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation: Persistent 5-tab game navigation; hidden on active game for immersion */}
      {!isGameRoute && <MobileBottomNav />}

      {/* Notifications Dialog */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
