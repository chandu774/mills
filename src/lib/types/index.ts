export type GameVariant = 'MILLS_3' | 'MILLS_6' | 'MILLS_9';

export type GameMode = 'CASUAL' | 'RANKED' | 'BOT' | 'FRIEND' | 'PRIVATE' | 'LOCAL';

export type TimeControl = 'UNTIMED' | '3_MIN' | '5_MIN' | '10_MIN';

export interface UserRating {
  mills3: number;
  mills6: number;
  mills9: number;
  provisional3?: boolean;
  provisional6?: boolean;
  provisional9?: boolean;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isUsernameSet?: boolean;
  createdAt: string;
  ratings: UserRating;
  stats: UserStats;
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'in_game' | 'offline';
  ratings: UserRating;
}

export interface FriendRequest {
  id: string;
  fromUser: Friend;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface FriendChallenge {
  id: string;
  fromUser: Friend;
  variant: GameVariant;
  mode: GameMode;
  timeControl: TimeControl;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'started';
  createdAt: string;
}

export interface TournamentStanding {
  rank: number;
  username: string;
  rating: number;
  score: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  variant: GameVariant;
  timeControl: TimeControl;
  type: 'ARENA' | 'SWISS' | 'SINGLE_ELIM';
  status: 'UPCOMING' | 'REGISTRATION' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  startTime: string;
  endTime: string;
  maxPlayers: number;
  currentPlayers: number;
  userJoined?: boolean;
  standings?: TournamentStanding[];
}

export interface GameRecord {
  id: string;
  opponentUsername: string;
  opponentAvatar?: string;
  variant: GameVariant;
  mode: GameMode;
  timeControl: TimeControl;
  result: 'WIN' | 'LOSS' | 'DRAW';
  ratingChange: number;
  ratingAfter: number;
  date: string;
  durationSeconds: number;
  movesCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  rating: number;
  gamesCount: number;
  winRate: number;
  isCurrentUser?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'challenge' | 'friend_request' | 'tournament' | 'system';
  actionUrl?: string;
}
