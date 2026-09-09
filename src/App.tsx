import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/home/HomePage';
import { RankedConfigPage } from '@/pages/play/RankedConfigPage';
import { BotsConfigPage } from '@/pages/play/BotsConfigPage';
import { FriendsConfigPage } from '@/pages/play/FriendsConfigPage';
import { TournamentsPage } from '@/pages/tournaments/TournamentsPage';
import { LeaderboardPage } from '@/pages/leaderboard/LeaderboardPage';
import { FriendsPage } from '@/pages/friends/FriendsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { RulesPage } from '@/pages/rules/RulesPage';
import { GamePage } from '@/pages/game/GamePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { UsernameSetupPage } from '@/pages/auth/UsernameSetupPage';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function AppRoutes() {
  const { user, isLoading, isUsernameSet } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#3D2817] flex items-center justify-center p-2 shadow-board border border-[#26150A] animate-pulse">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#FDFBF7] fill-none stroke-[7]">
            <rect x="15" y="15" width="70" height="70" rx="4" />
            <rect x="35" y="35" width="30" height="30" rx="2" />
            <line x1="50" y1="15" x2="50" y2="35" />
            <line x1="50" y1="65" x2="50" y2="85" />
            <line x1="15" y1="50" x2="35" y2="50" />
            <line x1="65" y1="50" x2="85" y2="50" />
          </svg>
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest text-[#C4973B] uppercase font-bold">
          Loading Mills...
        </p>
      </div>
    );
  }

  // If unauthenticated: user can only visit /login and /signup
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If authenticated but username not configured yet: route to /username-setup
  if (!isUsernameSet) {
    return (
      <Routes>
        <Route path="/username-setup" element={<UsernameSetupPage />} />
        <Route path="*" element={<Navigate to="/username-setup" replace />} />
      </Routes>
    );
  }

  // Authenticated + username set: full application access
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/username-setup" element={<Navigate to="/" replace />} />
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="play" element={<Navigate to="/" replace />} />
        <Route path="play/ranked" element={<RankedConfigPage />} />
        <Route path="play/bots" element={<BotsConfigPage />} />
        <Route path="play/friends" element={<FriendsConfigPage />} />
        <Route path="game" element={<GamePage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
