import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/home/HomePage';
import { PlayPage } from '@/pages/play/PlayPage';
import { TournamentsPage } from '@/pages/tournaments/TournamentsPage';
import { LeaderboardPage } from '@/pages/leaderboard/LeaderboardPage';
import { FriendsPage } from '@/pages/friends/FriendsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { RulesPage } from '@/pages/rules/RulesPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="play" element={<PlayPage />} />
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

export default App;
