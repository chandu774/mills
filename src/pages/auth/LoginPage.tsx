import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Capture any OAuth error returned in URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const oauthErr = params.get('error_description') || params.get('error') || hashParams.get('error_description') || hashParams.get('error');
        if (oauthErr) {
          setError(decodeURIComponent(oauthErr.replace(/\+/g, ' ')));
          const cleanPath = window.location.pathname;
          window.history.replaceState({}, document.title, cleanPath);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn(cleanEmail, password);
      if (!res.success) {
        setError(res.error || 'Failed to sign in. Please check your credentials.');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setError(res.error);
        setIsGoogleLoading(false);
      }
      // If successful, Supabase redirects to Google
    } catch (err: any) {
      setError(err.message || 'Failed to start Google authentication.');
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMsg(null);

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await resetPassword(forgotEmail.trim());
      if (!res.success) {
        setForgotError(res.error || 'Failed to send password reset email.');
      } else {
        setForgotMsg('Password reset link sent! Check your inbox.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Error requesting password reset.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Tagline */}
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
          <h1 className="text-3xl font-black tracking-tight text-ink">
            MILLS
          </h1>
          <p className="mt-1 text-sm font-medium text-ink-muted">
            Play. Compete. Master the board.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-7 bg-white py-8 px-5 sm:px-8 shadow-card rounded-3xl border border-background-border">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-alert-danger/10 border border-alert-danger/25 flex items-start gap-2.5 text-alert-danger">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-background-border rounded-2xl bg-white hover:bg-background-elevated active:scale-[0.99] text-ink font-bold text-sm shadow-soft transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-background-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-ink-light font-semibold font-mono tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                Email
              </label>
              <Input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4 text-ink-muted" />}
                autoComplete="email"
                className="rounded-2xl"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotMsg(null);
                    setForgotError(null);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-primary hover:text-primary-hover font-bold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4 text-ink-muted" />}
                autoComplete="current-password"
                className="rounded-2xl"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 font-black text-sm tracking-wider uppercase py-3.5 rounded-2xl shadow-soft"
            >
              {isLoading ? 'LOGGING IN...' : 'LOG IN'}
            </Button>
          </form>

          {/* Sign Up Footer */}
          <div className="mt-6 pt-5 border-t border-background-border text-center">
            <p className="text-xs text-ink-muted">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-primary hover:text-primary-hover transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password"
        description="Enter your email and we will send you a secure link to reset your password."
      >
        <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
          {forgotError && (
            <div className="p-3 rounded-xl bg-alert-danger/10 border border-alert-danger/25 text-alert-danger text-xs font-medium">
              {forgotError}
            </div>
          )}
          {forgotMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{forgotMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-ink-muted block mb-1">Registered Email</label>
            <Input
              type="email"
              required
              placeholder="name@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isForgotLoading}
              className="font-bold"
            >
              {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
