import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseConfigBanner } from './SupabaseConfigBanner';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { AppRole } from '../../types/database';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess?: (resolvedRole?: AppRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
}) => {
  const {
    isConfigured,
    signIn,
    signInWithDemoAdmin,
    signUp,
    sendPasswordReset,
    updatePassword,
    isPasswordResetFlow,
    clearPasswordResetFlow,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(
    isPasswordResetFlow ? 'reset' : initialMode
  );

  // Demo Admin state (server-governed)
  const [isDemoAdminEnabled, setIsDemoAdminEnabled] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkDemoStatus = async () => {
      try {
        const res = await fetch('/api/auth/demo-admin/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsDemoAdminEnabled(Boolean(data.enabled));
          }
        }
      } catch {
        if (isMounted) setIsDemoAdminEnabled(false);
      }
    };

    if (isOpen) {
      checkDemoStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isPasswordResetFlow) {
      setMode('reset');
    } else {
      setMode(initialMode);
    }
  }, [initialMode, isPasswordResetFlow, isOpen]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState(false);

  // Clear errors upon switching mode
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessNotice(null);
    setNeedsVerificationEmail(false);
  };

  const handleClose = () => {
    if (isPasswordResetFlow) {
      clearPasswordResetFlow();
    }
    setErrorMessage(null);
    setSuccessNotice(null);
    setNeedsVerificationEmail(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!isConfigured) {
      setErrorMessage(
        'Supabase credentials are not configured in this environment. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to execute real authentication.'
      );
      return;
    }

    // Validation
    if (!email && mode !== 'reset') {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setErrorMessage('Please provide your name or display name.');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters in length.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your confirmation password.');
        return;
      }
    }

    if (mode === 'reset') {
      if (password.length < 8) {
        setErrorMessage('New password must be at least 8 characters in length.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (result.error) {
          console.error('[RYVOLT AUTH DIAGNOSTIC] AuthModal signIn returned error:', result.error);
          setErrorMessage(result.error);
        } else {
          console.log('[RYVOLT AUTH DIAGNOSTIC] AuthModal signIn completed successfully. result.primaryRole:', result.primaryRole, 'result.roles:', result.roles);
          handleClose();
          if (onSuccess) onSuccess(result.primaryRole);
        }
      } else if (mode === 'signup') {
        const result = await signUp(email, password, displayName);
        if (result.error) {
          setErrorMessage(result.error);
        } else if (result.needsEmailConfirmation) {
          setNeedsVerificationEmail(true);
        } else {
          handleClose();
          if (onSuccess) onSuccess();
        }
      } else if (mode === 'forgot') {
        const result = await sendPasswordReset(email);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessNotice(
            `Password reset link has been dispatched to ${email}. Please check your inbox.`
          );
        }
      } else if (mode === 'reset') {
        const result = await updatePassword(password);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessNotice('Your password has been successfully updated. You may now sign in.');
          setTimeout(() => {
            switchMode('signin');
          }, 1500);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsDemoLoading(true);

    try {
      const result = await signInWithDemoAdmin();
      if (result.error) {
        console.error('[RYVOLT AUTH DIAGNOSTIC] Demo admin login error:', result.error);
        setErrorMessage(result.error);
      } else {
        console.log('[RYVOLT AUTH DIAGNOSTIC] Demo admin login succeeded with primaryRole:', result.primaryRole);
        handleClose();
        if (onSuccess) {
          onSuccess(result.primaryRole || 'admin');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate demo administrator.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const titles = {
    signin: 'Sign in to RYVOLT',
    signup: 'Create your Builder Account',
    forgot: 'Reset your Password',
    reset: 'Set New Password',
  };

  const descriptions = {
    signin: 'Access your Career Twin, BuildLab test runs, and candidate opportunities.',
    signup: 'Connect code execution to career advancement with real skill evidence.',
    forgot: 'Enter your account email to receive a secure password recovery link.',
    reset: 'Choose a strong password with at least 8 characters.',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={titles[mode]}
      description={descriptions[mode]}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Unconfigured Notice */}
        {!isConfigured && <SupabaseConfigBanner />}

        {/* Error Notification */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1 space-y-1.5">
              <div>{errorMessage}</div>
              {mode === 'signin' && (
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="font-medium text-rose-700 underline hover:text-rose-900 cursor-pointer"
                  >
                    Reset password
                  </button>
                  <span className="text-rose-300">•</span>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-medium text-rose-700 underline hover:text-rose-900 cursor-pointer"
                  >
                    Create new account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successNotice && (
          <div
            role="status"
            className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successNotice}</div>
          </div>
        )}

        {/* Email Verification Pending Screen */}
        {needsVerificationEmail ? (
          <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Confirm your email address
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              We sent a verification link to <strong className="text-slate-900">{email}</strong>. Once confirmed, you can sign in to your RYVOLT workspace.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchMode('signin')}
              >
                Return to Sign In
              </Button>
            </div>
            <div className="pt-2 border-t border-slate-200 text-left">
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                <strong>Notice for Platform Admin:</strong> If Supabase email rate limits are exceeded (default free tier is 3-4 emails/hr), do not request additional emails. In the Supabase Dashboard, navigate to <strong>Authentication &gt; Users &gt; {email || 'user'} &gt; Auto-confirm user</strong>.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <Input
                label="Full Name or Display Name"
                placeholder="Alex Chen"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />
            )}

            {mode !== 'reset' && (
              <Input
                label="Email Address"
                type="email"
                placeholder="alex.chen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />
            )}

            {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
              <Input
                label={mode === 'reset' ? 'New Password' : 'Password'}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                helperText={mode === 'signup' ? 'Minimum 8 characters' : undefined}
                required
              />
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />
            )}

            {mode === 'signin' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">
                  New builders receive verified Candidate role
                </span>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={isLoading}
              >
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Candidate Account'}
                {mode === 'forgot' && 'Send Recovery Email'}
                {mode === 'reset' && 'Save New Password'}
              </Button>
            </div>
          </form>
        )}

        {/* Conditional Demo Admin Access (Phase 8.1.6 & 10) */}
        {mode === 'signin' && !needsVerificationEmail && isDemoAdminEnabled && (
          <div className="pt-2">
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-2.5 text-slate-400">
                  Development & Demo Access
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Platform Administrator Demo
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                  DEMO_ADMIN_ENABLED
                </span>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Uses server-side configured credentials (<code className="font-mono text-violet-700 dark:text-violet-300 font-semibold">admin@gmail.com</code>). Fully server-validated against trusted role policies in <code className="font-mono text-slate-500">public.user_roles</code>.
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDemoAdminLogin}
                  isLoading={isDemoLoading}
                  disabled={isLoading}
                  className="flex-1 justify-center bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-sm shadow-violet-500/20 font-medium text-xs cursor-pointer"
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-violet-200" />}
                >
                  Quick Sign In as Admin
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@gmail.com');
                    setPassword('282100');
                  }}
                  className="px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Pre-fill email and password into sign-in form"
                >
                  Auto-fill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Switcher Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          {mode === 'signin' && (
            <>
              <span>Don’t have an account yet?</span>
              <button
                onClick={() => switchMode('signup')}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </>
          )}

          {mode === 'signup' && (
            <>
              <span>Already registered?</span>
              <button
                onClick={() => switchMode('signin')}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              onClick={() => switchMode('signin')}
              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
