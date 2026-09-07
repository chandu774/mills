import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const { signIn, signUp, isConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setDisplayName('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    if (activeTab === 'signin') {
      const res = await signIn(email, password);
      setIsLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        handleClose();
      }
    } else {
      // Sign Up Validation
      if (!username || !displayName) {
        setIsLoading(false);
        setError('Username and Display Name are required.');
        return;
      }
      if (username.length < 3 || username.length > 20) {
        setIsLoading(false);
        setError('Username must be between 3 and 20 characters.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setIsLoading(false);
        setError('Username can only contain letters, numbers, and underscores.');
        return;
      }
      if (password !== confirmPassword) {
        setIsLoading(false);
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setIsLoading(false);
        setError('Password must be at least 6 characters.');
        return;
      }

      const res = await signUp(email, password, username, displayName);
      setIsLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg('Account created successfully!');
        setTimeout(() => handleClose(), 1000);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={activeTab === 'signin' ? 'Sign In to Mills' : 'Create Mills Account'}
      description="Compete in ranked matches, join tournaments, and challenge your friends."
    >
      <div className="space-y-4 mt-2">
        <Tabs
          tabs={[
            { id: 'signin', label: 'Sign In' },
            { id: 'signup', label: 'Create Account' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab as 'signin' | 'signup');
            setError(null);
          }}
        />

        {!isConfigured && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <strong>Local Mode Active:</strong> Supabase credentials are not configured yet in .env. Signing in will use an instant offline player profile.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {activeTab === 'signup' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Username</label>
                <Input
                  type="text"
                  placeholder="e.g. mill_master"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Display Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </div>

          {activeTab === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold mt-2 shadow-emerald-500/20"
            isLoading={isLoading}
          >
            {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
