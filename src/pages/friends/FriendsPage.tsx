import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { GameVariant, TimeControl } from '@/lib/types';
import {
  friendsService,
  FriendItem,
  PendingRequestItem,
  PlayerSearchResult,
} from '@/services/social/friendsService';
import { Search, Swords, UserPlus, Check, X, Clock, Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function FriendsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Challenge modal state
  const [challengeFriend, setChallengeFriend] = useState<FriendItem | null>(null);
  const [challengeVariant, setChallengeVariant] = useState<GameVariant>('MILLS_9');
  const [challengeTimeControl, setChallengeTimeControl] = useState<TimeControl>('5_MIN');

  // Load friends and pending requests from Supabase
  const loadData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const [friendsList, requestsList] = await Promise.all([
        friendsService.getFriends(user.id),
        friendsService.getPendingRequests(user.id),
      ]);
      setFriends(friendsList);
      setPendingRequests(requestsList);
    } catch (err) {
      console.warn('[FriendsPage] Failed to load friends:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim() || !user?.id) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      const results = await friendsService.searchPlayers(searchQuery, user.id);
      setSearchResults(results);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery, user?.id]);

  // Actions: Send, Accept, Decline
  const handleSendRequest = async (targetUserId: string) => {
    if (!user?.id) return;
    const res = await friendsService.sendFriendRequest(user.id, targetUserId);
    if (res.success) {
      setSearchResults((prev) =>
        prev.map((p) =>
          p.id === targetUserId
            ? { ...p, relationship: 'REQUEST_SENT', friendshipId: res.friendshipId }
            : p
        )
      );
      loadData();
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    const res = await friendsService.acceptFriendRequest(friendshipId);
    if (res.success) {
      loadData();
      if (searchQuery.trim()) {
        setSearchResults((prev) =>
          prev.map((p) =>
            p.friendshipId === friendshipId ? { ...p, relationship: 'FRIENDS' } : p
          )
        );
      }
    }
  };

  const handleDeclineOrRemove = async (friendshipId: string) => {
    const res = await friendsService.declineOrRemoveFriend(friendshipId);
    if (res.success) {
      loadData();
      if (searchQuery.trim()) {
        setSearchResults((prev) =>
          prev.map((p) =>
            p.friendshipId === friendshipId
              ? { ...p, relationship: 'NONE', friendshipId: undefined }
              : p
          )
        );
      }
    }
  };

  const handleStartChallenge = () => {
    if (!challengeFriend) return;
    navigate(`/play?variant=${challengeVariant}&time=${challengeTimeControl}`);
    setChallengeFriend(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto pb-10">
      {/* 1. Header & Search Bar */}
      <div className="space-y-3 pt-1">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#C4973B]">
            FRIENDS
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            Friends & Rivals
          </h1>
        </div>

        <div className="relative">
          <Input
            placeholder="Search players by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-ink-muted" />}
            className="w-full bg-white shadow-2xs text-sm"
          />
        </div>
      </div>

      {/* 2. Live Search Results (if searching) */}
      {searchQuery.trim().length > 0 && (
        <section className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
            Search Results
          </span>

          {isSearching ? (
            <div className="p-4 text-center text-xs text-ink-muted bg-white rounded-2xl border border-background-border">
              Searching players...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-5 text-center text-xs text-ink-muted bg-white rounded-2xl border border-background-border">
              No players found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((player) => (
                <Card key={player.id} className="border-background-border shadow-2xs">
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={player.username} src={player.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-ink text-sm truncate">@{player.username}</h4>
                        <p className="text-xs text-ink-muted truncate">{player.displayName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold text-[#8A6318] bg-gold/15 px-1.5 py-0.5 rounded">
                            9M: {player.ratings.mills9}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            6M: {player.ratings.mills6}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-ink-muted bg-background-elevated px-1.5 py-0.5 rounded">
                            3M: {player.ratings.mills3}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {player.relationship === 'FRIENDS' ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Friends</span>
                        </div>
                      ) : player.relationship === 'REQUEST_SENT' ? (
                        <Button size="sm" variant="outline" disabled className="h-8 text-xs font-semibold text-ink-muted">
                          Request Sent
                        </Button>
                      ) : player.relationship === 'REQUEST_RECEIVED' && player.friendshipId ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAcceptRequest(player.friendshipId!)}
                          className="h-8 text-xs font-bold gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSendRequest(player.id)}
                          className="h-8 text-xs font-bold gap-1.5"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Add Friend
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. FRIEND REQUESTS (Only shown if pending incoming requests exist) */}
      {pendingRequests.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-alert-red">
              Friend Requests
            </span>
            <span className="text-[10px] font-bold bg-alert-red/10 text-alert-red px-1.5 py-0.2 rounded-full">
              {pendingRequests.length}
            </span>
          </div>

          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <Card key={req.friendshipId} className="border-amber-500/30 bg-amber-50/20">
                <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={req.username} src={req.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-ink text-sm truncate">@{req.username}</h4>
                      <p className="text-xs text-ink-muted truncate">
                        {req.displayName} • {req.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAcceptRequest(req.friendshipId)}
                      className="h-8 gap-1 text-xs font-bold"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeclineOrRemove(req.friendshipId)}
                      className="h-8 text-xs text-ink-muted hover:text-alert-red"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 4. YOUR FRIENDS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Your Friends
          </span>
          <span className="text-xs font-bold font-mono text-ink-muted">{friends.length}</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-ink-muted bg-white rounded-2xl border border-background-border">
            Loading friends...
          </div>
        ) : friends.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-background-border text-center shadow-2xs space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-background-elevated text-ink-muted flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-ink">No friends added yet</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Search for players by username above to connect and send friend invitations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <Card key={friend.friendshipId} className="border-background-border shadow-2xs hover:border-ink/20 transition-all">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={friend.username} src={friend.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-ink text-sm truncate">@{friend.username}</h4>
                      <p className="text-xs text-ink-muted truncate">{friend.displayName}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-mono font-bold text-[#8A6318] bg-gold/15 px-1.5 py-0.5 rounded">
                          9M: {friend.ratings.mills9}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          6M: {friend.ratings.mills6}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-ink-muted bg-background-elevated px-1.5 py-0.5 rounded">
                          3M: {friend.ratings.mills3}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setChallengeFriend(friend)}
                    className="h-8 gap-1 text-xs font-bold shrink-0"
                  >
                    <Swords className="h-3.5 w-3.5" /> Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Challenge Modal */}
      {challengeFriend && (
        <Modal
          isOpen={Boolean(challengeFriend)}
          onClose={() => setChallengeFriend(null)}
          title={`Challenge @${challengeFriend.username}`}
          description="Select variant and time control to start your match."
        >
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 block">
                Variant
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['MILLS_3', 'MILLS_6', 'MILLS_9'] as GameVariant[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setChallengeVariant(v)}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                      challengeVariant === v
                        ? "border-primary bg-primary/[0.06] text-primary shadow-soft ring-1 ring-primary"
                        : "border-background-border bg-white text-ink-muted hover:text-ink"
                    )}
                  >
                    {v === 'MILLS_3' ? '3-Piece' : v === 'MILLS_6' ? '6-Piece' : '9-Piece'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 block">
                Time Control
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['3_MIN', '5_MIN', '10_MIN', 'UNTIMED'] as TimeControl[]).map((tc) => (
                  <button
                    key={tc}
                    type="button"
                    onClick={() => setChallengeTimeControl(tc)}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2",
                      challengeTimeControl === tc
                        ? "border-primary bg-primary/[0.06] text-primary shadow-soft ring-1 ring-primary"
                        : "border-background-border bg-white text-ink-muted hover:text-ink"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {tc.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-background-border flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setChallengeFriend(null)}
                className="flex-1 text-ink-muted hover:text-ink"
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleStartChallenge} className="flex-1 font-bold gap-2">
                <Swords className="h-4 w-4" /> Start Match
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
