import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Swords, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VariantCard } from '@/components/common/VariantCard';
import { Avatar } from '@/components/ui/Avatar';
import { GameVariant, TimeControl } from '@/lib/types';
import { friendsService, FriendItem } from '@/services/social/friendsService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function FriendsConfigPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('MILLS_9');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('5_MIN');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const timeControls: { id: TimeControl; label: string; sub: string }[] = [
    { id: '3_MIN', label: '3 min', sub: 'Blitz' },
    { id: '5_MIN', label: '5 min', sub: 'Rapid' },
    { id: '10_MIN', label: '10 min', sub: 'Classic' },
    { id: 'UNTIMED', label: 'Untimed', sub: 'Standard' },
  ];

  useEffect(() => {
    if (user?.id) {
      setIsLoadingFriends(true);
      friendsService
        .getFriends(user.id)
        .then((list) => {
          setFriends(list);
          if (list.length > 0 && !selectedFriendId) {
            setSelectedFriendId(list[0].id);
          }
        })
        .finally(() => setIsLoadingFriends(false));
    }
  }, [user?.id, selectedFriendId]);

  const handleChallenge = () => {
    if (!selectedFriendId) return;
    navigate(
      `/game?mode=FRIEND&variant=${selectedVariant}&time=${selectedTimeControl}&friend=${selectedFriendId}`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto pb-10">
      {/* Top Bar with Return to Home */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl border border-background-border bg-white text-ink-muted hover:text-ink hover:border-ink/20 transition-all cursor-pointer shadow-2xs"
          aria-label="Back to Home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#C4973B]">
            FRIENDLY DUEL
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            CHALLENGE FRIENDS
          </h1>
        </div>
      </div>

      {/* 1. SELECT FRIEND */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Select Friend
          </span>
          <button
            type="button"
            onClick={() => navigate('/friends')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Manage Friends
          </button>
        </div>

        {isLoadingFriends ? (
          <div className="p-4 rounded-2xl bg-white border border-background-border text-center text-xs text-ink-muted animate-pulse">
            Loading friends...
          </div>
        ) : friends.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-background-border text-center space-y-3">
            <p className="text-xs text-ink-muted">
              You do not have any friends added yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/friends')}
              className="gap-1.5 text-xs font-bold"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Find & Add Friends
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {friends.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFriendId(f.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer select-none",
                  selectedFriendId === f.id
                    ? "border-primary bg-primary/[0.08] ring-2 ring-primary/70 shadow-soft"
                    : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
                )}
              >
                <Avatar
                  name={f.displayName || f.username}
                  src={f.avatarUrl}
                  size="md"
                  status={f.status}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-ink truncate">
                    {f.displayName}
                  </div>
                  <div className="text-[11px] text-ink-muted truncate">
                    @{f.username}
                  </div>
                </div>
                <div className="text-[10px] font-mono font-bold text-ink-subtle bg-background px-2 py-1 rounded-md border border-background-border shrink-0">
                  {f.ratings?.[selectedVariant === 'MILLS_3' ? 'mills3' : selectedVariant === 'MILLS_6' ? 'mills6' : 'mills9'] || 1200}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 2. SELECT VARIANT */}
      <section className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Select Variant
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <VariantCard
            variant="MILLS_3"
            isSelected={selectedVariant === 'MILLS_3'}
            onSelect={setSelectedVariant}
          />
          <VariantCard
            variant="MILLS_6"
            isSelected={selectedVariant === 'MILLS_6'}
            onSelect={setSelectedVariant}
          />
          <VariantCard
            variant="MILLS_9"
            isSelected={selectedVariant === 'MILLS_9'}
            onSelect={setSelectedVariant}
          />
        </div>
      </section>

      {/* 3. TIME CONTROL */}
      <section className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Time Control
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {timeControls.map((tc) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => setSelectedTimeControl(tc.id)}
              className={cn(
                "p-3 rounded-2xl border text-center transition-all cursor-pointer select-none",
                selectedTimeControl === tc.id
                  ? "border-primary bg-primary/[0.08] ring-2 ring-primary/70 shadow-soft"
                  : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
              )}
            >
              <div
                className={cn(
                  "text-sm font-bold",
                  selectedTimeControl === tc.id ? "text-primary" : "text-ink"
                )}
              >
                {tc.label}
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">{tc.sub}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. CHALLENGE CTA */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          disabled={!selectedFriendId || friends.length === 0}
          onClick={handleChallenge}
          className="w-full py-4 text-base font-bold shadow-soft flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Swords className="h-5 w-5 fill-current" />
          CHALLENGE
        </Button>
      </div>
    </div>
  );
}
