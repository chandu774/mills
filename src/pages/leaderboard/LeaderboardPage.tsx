import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { RatingBadge } from '@/components/common/RatingBadge';
import { GameVariant, LeaderboardEntry } from '@/lib/types';
import { Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeaderboardPage() {
  const [activeVariant, setActiveVariant] = useState<GameVariant>('MILLS_9');

  // Realistic leaderboard datasets for Phase 1
  const leaderboardData: Record<GameVariant, LeaderboardEntry[]> = {
    MILLS_9: [
      { rank: 1, username: 'GrandmasterKai', displayName: 'Kai Tanaka', rating: 2145, gamesCount: 412, winRate: 74 },
      { rank: 2, username: 'MillEmperor', displayName: 'Elena Rostova', rating: 2082, gamesCount: 388, winRate: 71 },
      { rank: 3, username: 'TacticalEagle', displayName: 'Marcus Vance', rating: 1994, gamesCount: 295, winRate: 68 },
      { rank: 4, username: 'VortexStrategist', displayName: 'Liam O’Connor', rating: 1912, gamesCount: 240, winRate: 65 },
      { rank: 5, username: 'ShadowRook', displayName: 'Sophia Chen', rating: 1874, gamesCount: 198, winRate: 64 },
      { rank: 6, username: 'SilentNomad', displayName: 'Tariq Al-Mansoor', rating: 1810, gamesCount: 220, winRate: 61 },
      { rank: 7, username: 'NineMorrisKing', displayName: 'David Miller', rating: 1788, gamesCount: 164, winRate: 59 },
      { rank: 8, username: 'ZenStrategist', displayName: 'Hana Sato', rating: 1740, gamesCount: 142, winRate: 58 },
      { rank: 9, username: 'IronBastion', displayName: 'Viktor Meyer', rating: 1705, gamesCount: 110, winRate: 57 },
      { rank: 29, username: 'PlayerOne', displayName: 'You', rating: 1516, gamesCount: 84, winRate: 54, isCurrentUser: true },
    ],
    MILLS_6: [
      { rank: 1, username: 'TacticalEagle', displayName: 'Marcus Vance', rating: 2040, gamesCount: 310, winRate: 76 },
      { rank: 2, username: 'ShadowRook', displayName: 'Sophia Chen', rating: 1975, gamesCount: 280, winRate: 72 },
      { rank: 3, username: 'GrandmasterKai', displayName: 'Kai Tanaka', rating: 1920, gamesCount: 245, winRate: 69 },
      { rank: 4, username: 'VortexStrategist', displayName: 'Liam O’Connor', rating: 1860, gamesCount: 190, winRate: 66 },
      { rank: 88, username: 'PlayerOne', displayName: 'You', rating: 1382, gamesCount: 52, winRate: 51, isCurrentUser: true },
    ],
    MILLS_3: [
      { rank: 1, username: 'SpeedTactician', displayName: 'Alex Rivera', rating: 2190, gamesCount: 620, winRate: 81 },
      { rank: 2, username: 'BlitzMaster', displayName: 'Chloe Kim', rating: 2110, gamesCount: 540, winRate: 78 },
      { rank: 3, username: 'MillEmperor', displayName: 'Elena Rostova', rating: 2015, gamesCount: 410, winRate: 73 },
      { rank: 142, username: 'PlayerOne', displayName: 'You', rating: 1247, gamesCount: 36, winRate: 48, isCurrentUser: true },
    ]
  };

  const currentList = leaderboardData[activeVariant];
  const currentUserEntry = currentList.find(e => e.isCurrentUser);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/30">
          <Crown className="h-4 w-4 fill-current" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black shadow-md">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    return <span className="font-mono font-bold text-sm text-slate-400">#{rank}</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Global Leaderboards"
        subtitle="The highest-rated competitive Mills players in the world. Updated dynamically after every ranked match."
      />

      <Tabs
        tabs={[
          { id: 'MILLS_9', label: "9-Piece Morris" },
          { id: 'MILLS_6', label: '6-Piece Mills' },
          { id: 'MILLS_3', label: '3-Piece Mills' },
        ]}
        activeTab={activeVariant}
        onChange={(id) => setActiveVariant(id as GameVariant)}
      />

      {/* Top 3 Podium Highlights for Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {currentList.slice(0, 3).map((player) => (
          <Card
            key={player.username}
            className={cn(
              "relative overflow-hidden border transition-all text-center",
              player.rank === 1
                ? "border-amber-400/50 bg-gradient-to-b from-amber-400/10 to-background-card shadow-lg shadow-amber-400/10 md:-translate-y-2"
                : "border-background-border bg-background-card"
            )}
          >
            <div className="p-6 flex flex-col items-center">
              <div className="mb-3 relative">
                <Avatar name={player.username} size="lg" />
                <div className="absolute -bottom-2 -right-2">
                  {getRankBadge(player.rank)}
                </div>
              </div>
              <h3 className="font-bold text-base text-white">{player.username}</h3>
              <p className="text-xs text-slate-400">{player.displayName}</p>
              <div className="mt-3">
                <RatingBadge rating={player.rating} showTier size="md" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400 border-t border-background-border/60 pt-3 w-full">
                <span>{player.gamesCount} games</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{player.winRate}% win rate</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-elevated/80 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-background-border">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                  <th className="py-3.5 px-4 text-center">Games</th>
                  <th className="py-3.5 px-4 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-border">
                {currentList.map((entry) => (
                  <tr
                    key={entry.username}
                    className={cn(
                      "transition-colors",
                      entry.isCurrentUser
                        ? "bg-primary/10 hover:bg-primary/15 font-bold border-l-4 border-l-primary"
                        : "hover:bg-background-elevated/40"
                    )}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">{getRankBadge(entry.rank)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={entry.username} size="sm" />
                        <div>
                          <span className={cn("font-bold", entry.isCurrentUser ? "text-primary" : "text-white")}>
                            {entry.username} {entry.isCurrentUser && '(You)'}
                          </span>
                          <p className="text-xs text-slate-400 font-normal">{entry.displayName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-white text-base">{entry.rating}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {entry.gamesCount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-emerald-400">{entry.winRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sticky User Standing Spotlight (if ranked outside top 5) */}
      {currentUserEntry && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-background-card via-background-elevated to-background-card border border-primary/40 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary font-mono font-black text-sm">
              #{currentUserEntry.rank}
            </div>
            <div>
              <p className="text-xs text-slate-400">Your Current Standing in {activeVariant.replace('_', ' ')}</p>
              <h4 className="text-sm font-bold text-white">Keep playing ranked games to enter the Top 20!</h4>
            </div>
          </div>
          <RatingBadge rating={currentUserEntry.rating} size="lg" />
        </div>
      )}
    </div>
  );
}
