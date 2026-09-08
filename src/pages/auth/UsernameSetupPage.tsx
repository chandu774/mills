import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, AlertCircle, Check, Sparkles } from 'lucide-react';

export function UsernameSetupPage() {
  const { user, profile, isUsernameSet, setUsername, checkUsernameAvailability } = useAuth();
  const navigate = useNavigate();

  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // If user is not authenticated, bounce to /login
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    } else if (isUsernameSet && profile?.username && !profile.username.startsWith('player_')) {
      navigate('/', { replace: true });
    }
  }, [user, isUsernameSet, profile?.username, navigate]);

  // Client-side validation function
  const validateClientSide = (val: string): string | null => {
    if (!val) return 'Please enter a username.';
    if (val.length < 3) return 'Username must be at least 3 characters.';
    if (val.length > 20) return 'Username cannot exceed 20 characters.';
    if (/\s/.test(val)) return 'Spaces are not allowed.';
    if (!/^[a-zA-Z0-9]+$/.test(val)) {
      return 'Only letters (A-Z, a-z) and numbers (0-9) are allowed.';
    }
    return null;
  };

  // Real-time debounced availability check
  useEffect(() => {
    const trimmed = usernameInput.trim();
    setSuggestions([]);
    setIsAvailable(null);

    if (!trimmed) {
      setError(null);
      return;
    }

    const clientErr = validateClientSide(trimmed);
    if (clientErr) {
      setError(clientErr);
      return;
    }

    setError(null);
    setIsValidating(true);

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(trimmed);
        if (!res.available) {
          setError(res.error || 'Username already taken');
          setSuggestions(res.suggestions || []);
          setIsAvailable(false);
        } else {
          setError(null);
          setIsAvailable(true);
        }
      } catch {
        // network hiccup, allow user to click continue to re-check
      } finally {
        setIsValidating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameInput, checkUsernameAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim();

    const clientErr = validateClientSide(clean);
    if (clientErr) {
      setError(clientErr);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await setUsername(clean);
      if (!res.success) {
        setError(res.error || 'Failed to set username. It may be taken.');
        // If taken, fetch alternative suggestions
        const avail = await checkUsernameAvailability(clean);
        if (avail.suggestions) setSuggestions(avail.suggestions);
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (sug: string) => {
    setUsernameInput(sug);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#3D2817] flex items-center justify-center p-2 shadow-board border border-[#26150A] mb-3">
            <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#FDFBF7] fill-none stroke-[7]">
              <rect x="15" y="15" width="70" height="70" rx="4" />
              <rect x="35" y="35" width="30" height="30" rx="2" />
              <line x1="50" y1="15" x2="50" y2="35" />
              <line x1="50" y1="65" x2="50" y2="85" />
              <line x1="15" y1="50" x2="35" y2="50" />
              <line x1="65" y1="50" x2="85" y2="50" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
            Choose your username
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-ink-muted">
            This is how other players will see you.
          </p>
        </div>

        {/* Card */}
        <div className="mt-7 bg-white py-8 px-5 sm:px-8 shadow-card rounded-3xl border border-background-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Username
                </label>
                <span className="text-[10px] font-mono text-ink-light font-semibold">
                  {usernameInput.length}/20
                </span>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  required
                  placeholder="e.g. Alex123"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.replace(/\s/g, ''))}
                  icon={<User className="h-4 w-4 text-ink-muted" />}
                  autoFocus
                  maxLength={20}
                  className="rounded-2xl pr-10"
                />
                {isAvailable === true && !isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Validation Rules Guidance */}
            <div className="text-[11px] text-ink-muted space-y-1 bg-background-subtle p-3 rounded-2xl border border-background-border">
              <span className="font-bold text-ink block mb-0.5">Username requirements:</span>
              <p>• 3 to 20 characters</p>
              <p>• Letters (A-Z, a-z) and numbers (0-9) only</p>
              <p>• No spaces, emojis, or symbols</p>
              <p>• Case-insensitive uniqueness</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-2xl bg-alert-danger/10 border border-alert-danger/25 flex items-start gap-2 text-alert-danger">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {/* Suggestions if username taken */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-ink-muted flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Suggested alternatives:
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleApplySuggestion(sug)}
                      className="text-xs font-mono font-bold bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl border border-primary/25 cursor-pointer transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || isValidating || usernameInput.length < 3 || Boolean(error)}
              className="w-full mt-3 font-black text-sm tracking-wider uppercase py-3.5 rounded-2xl shadow-soft"
            >
              {isLoading ? 'SAVING USERNAME...' : 'CONTINUE'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
