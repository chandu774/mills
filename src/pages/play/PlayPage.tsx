import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GameVariant, GameMode, TimeControl } from '@/lib/types';
import { VariantCard } from '@/components/common/VariantCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Play, Swords, UserCheck, Shield, Copy, Check, KeyRound, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gameService } from '@/services/games/gameService';
import { useAuth } from '@/hooks/useAuth';
import { MatchmakingModal } from '@/components/game/MatchmakingModal';

export function PlayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const queryVariant = searchParams.get('variant') as GameVariant;
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>(
    queryVariant && ['MILLS_3', 'MILLS_6', 'MILLS_9'].includes(queryVariant) ? queryVariant : 'MILLS_9'
  );

  const queryMode = searchParams.get('mode') as GameMode;
  const [selectedMode, setSelectedMode] = useState<GameMode>(
    queryMode && ['RANKED', 'CASUAL', 'PRIVATE', 'LOCAL', 'FRIEND'].includes(queryMode) ? queryMode : 'RANKED'
  );

  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('5_MIN');
  const [privateLinkCopied, setPrivateLinkCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleStartGame = async () => {
    if (selectedMode === 'RANKED' || selectedMode === 'CASUAL') {
      setShowMatchmakingModal(true);
      return;
    }

    if (selectedMode === 'PRIVATE') {
      setIsCreatingRoom(true);
      try {
        const room = await gameService.createRoom({
          variant: selectedVariant,
          timeControl: selectedTimeControl,
          mode: 'PRIVATE',
          hostPlayer: {
            id: user?.id || 'host_' + Math.random().toString(36).substring(2, 7),
            displayName: profile?.displayName || profile?.username || 'Player 1',
            avatarUrl: profile?.avatarUrl,
            preferredColor: 'WHITE',
          },
        });
        navigate(`/game?room=${room.id}&variant=${selectedVariant}&time=${selectedTimeControl}`);
      } catch (err) {
        console.error('Failed to create room:', err);
      } finally {
        setIsCreatingRoom(false);
      }
      return;
    }

    if (selectedMode === 'FRIEND') {
      navigate('/friends');
      return;
    }

    // Default: Local Pass & Play
    navigate(`/game?variant=${selectedVariant}&time=${selectedTimeControl}&mode=${selectedMode}`);
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a room code');
      return;
    }

    try {
      const room = await gameService.getRoom(code);
      if (!room) {
        navigate(`/game?room=${code}&variant=${selectedVariant}`);
        setShowJoinModal(false);
        return;
      }
      navigate(`/game?room=${room.id}&variant=${room.variant}&time=${room.timeControl}`);
      setShowJoinModal(false);
    } catch {
      setJoinError('Could not find room with this code.');
    }
  };

  const handleCopyPrivateLink = () => {
    const code = gameService.generateRoomCode();
    const url = `${window.location.origin}/game?room=MILLS-${code}&variant=${selectedVariant}&time=${selectedTimeControl}`;
    navigator.clipboard.writeText(url);
    setPrivateLinkCopied(true);
    setTimeout(() => setPrivateLinkCopied(false), 2000);
  };

  const modes: { id: GameMode; label: string; icon: any; desc: string }[] = [
    { id: 'RANKED', label: 'Ranked', icon: Swords, desc: 'Climb leaderboards & earn ELO' },
    { id: 'CASUAL', label: 'Casual', icon: Shield, desc: 'Friendly match with standard rules' },
    { id: 'PRIVATE', label: 'Private Room', icon: UserCheck, desc: 'Play with code or shareable link' },
    { id: 'LOCAL', label: 'Pass & Play', icon: Monitor, desc: '2 players on this device' },
  ];

  const timeControls: { id: TimeControl; label: string; sub: string }[] = [
    { id: '3_MIN', label: '3 min', sub: 'Blitz' },
    { id: '5_MIN', label: '5 min', sub: 'Rapid' },
    { id: '10_MIN', label: '10 min', sub: 'Classic' },
    { id: 'UNTIMED', label: 'Untimed', sub: 'Practice' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 max-w-2xl mx-auto pb-6">
      {/* Game Lobby Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#C4973B]">
            GAME LOBBY
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            Play Mills
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowJoinModal(true)}
          className="gap-1.5 text-xs font-bold border-background-border text-ink bg-white shadow-soft"
        >
          <KeyRound className="h-3.5 w-3.5 text-primary" />
          <span>Join Code</span>
        </Button>
      </div>

      {/* 1. Quick Match Variant Selection */}
      <section className="space-y-2">
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

      {/* 2. Mode Selection */}
      <section className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Select Game Mode
        </span>
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-2xl border text-left cursor-pointer select-none transition-all active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/[0.06] ring-2 ring-primary/60 shadow-soft"
                    : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
                )}
              >
                <div className={cn("p-2 rounded-xl shrink-0 transition-colors", isSelected ? "bg-primary text-white" : "bg-background-elevated text-ink-muted")}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className={cn("text-xs sm:text-sm font-bold truncate", isSelected ? "text-primary" : "text-ink")}>
                    {m.label}
                  </h3>
                  <p className="text-[10px] text-ink-muted truncate">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Time Control Selection */}
      <section className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Time Control
        </span>
        <div className="grid grid-cols-4 gap-2">
          {timeControls.map((tc) => {
            const isSelected = selectedTimeControl === tc.id;
            return (
              <button
                key={tc.id}
                onClick={() => setSelectedTimeControl(tc.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border text-center cursor-pointer select-none transition-all active:scale-[0.97]",
                  isSelected
                    ? "border-primary bg-primary/[0.06] ring-2 ring-primary/60 shadow-soft"
                    : "border-background-border bg-white hover:border-ink/20 shadow-2xs"
                )}
              >
                <span className={cn("text-xs sm:text-sm font-black font-mono", isSelected ? "text-primary" : "text-ink")}>
                  {tc.label}
                </span>
                <span className="text-[10px] text-ink-muted mt-0.5">{tc.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Private Room Share Box (if private mode selected) */}
      {selectedMode === 'PRIVATE' && (
        <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
          <CardContent className="p-3.5 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Direct Invite Link</span>
            <p className="text-[11px] text-ink-muted">
              Click below to generate a room and invite link you can share with your opponent.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyPrivateLink}
              className="w-full gap-2 text-xs font-bold border border-background-border bg-white text-ink shadow-soft"
            >
              {privateLinkCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {privateLinkCopied ? 'Link Copied to Clipboard!' : 'Copy Shareable Room Link'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 4. Prominent Launch Button */}
      <div className="pt-2">
        <Button
          size="lg"
          variant="primary"
          onClick={handleStartGame}
          disabled={isCreatingRoom}
          className="w-full gap-3 text-base sm:text-lg font-black py-4 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-transform rounded-2xl bg-primary hover:bg-primary-hover border border-white/20"
        >
          <Play className="h-6 w-6 fill-current" />
          {isCreatingRoom ? 'CREATING ROOM...' : selectedMode === 'PRIVATE' ? 'CREATE PRIVATE ROOM' : 'PLAY NOW'}
        </Button>
      </div>

      {/* Join Room Code Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Online Room"
        description="Enter the 6-character room code to join your opponent."
      >
        <form onSubmit={handleJoinWithCode} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink-muted block mb-1">Room Code</label>
            <Input
              placeholder="e.g. MILLS-8K2J"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              autoFocus
            />
            {joinError && <p className="text-xs text-alert-red mt-1">{joinError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="font-bold">
              Join Game
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ranked and Casual Online Matchmaking Modal */}
      <MatchmakingModal
        isOpen={showMatchmakingModal}
        onClose={() => setShowMatchmakingModal(false)}
        variant={selectedVariant}
        mode={selectedMode}
        timeControl={selectedTimeControl}
      />
    </div>
  );
}
