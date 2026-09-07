import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GameVariant, TimeControl, GameMode } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVariantName(variant: GameVariant): string {
  switch (variant) {
    case 'MILLS_3':
      return '3-Piece Mills';
    case 'MILLS_6':
      return '6-Piece Mills';
    case 'MILLS_9':
      return "9-Piece Men's Morris";
  }
}

export function formatVariantShort(variant: GameVariant): string {
  switch (variant) {
    case 'MILLS_3':
      return '3 Mills';
    case 'MILLS_6':
      return '6 Mills';
    case 'MILLS_9':
      return '9 Mills';
  }
}

export function formatTimeControl(tc: TimeControl): string {
  switch (tc) {
    case 'UNTIMED':
      return 'Untimed';
    case '3_MIN':
      return '3 min';
    case '5_MIN':
      return '5 min';
    case '10_MIN':
      return '10 min';
  }
}

export function formatMode(mode: GameMode): string {
  switch (mode) {
    case 'RANKED':
      return 'Ranked';
    case 'CASUAL':
      return 'Casual';
    case 'FRIEND':
      return 'Play Friend';
    case 'PRIVATE':
      return 'Private Room';
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export interface RankTier {
  name: string;
  color: string;
  badgeBg: string;
}

export function getRankTier(rating: number): RankTier {
  if (rating >= 2000) return { name: 'Grandmaster', color: 'text-rose-400', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  if (rating >= 1800) return { name: 'Master', color: 'text-purple-400', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  if (rating >= 1600) return { name: 'Expert', color: 'text-sky-400', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  if (rating >= 1400) return { name: 'Adept', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (rating >= 1200) return { name: 'Challenger', color: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  return { name: 'Novice', color: 'text-slate-400', badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
}
