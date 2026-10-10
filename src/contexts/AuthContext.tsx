import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppRole, ProfileRow, ProfileUpdatePayload } from '../types/database';
import { mapAuthError } from '../lib/auth-errors';

export type AuthState =
  | 'SESSION_LOADING'
  | 'SIGNED_OUT'
  | 'SIGNING_UP'
  | 'EMAIL_VERIFICATION_PENDING'
  | 'PROFILE_INCOMPLETE'
  | 'PHONE_VERIFICATION_PENDING'
  | 'ONBOARDING_COMPLETE'
  | 'AUTH_ERROR';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  roles: AppRole[];
  primaryRole: AppRole;
  authState: AuthState;
  needsOnboarding: boolean;
  isLoading: boolean;
  isRolesLoaded: boolean;
  isUserDataLoading: boolean;
  rolesUserId: string | null;
  isConfigured: boolean;
  authError: string | null;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{
    error?: string;
    primaryRole?: AppRole;
    roles?: AppRole[];
  }>;
  signInWithDemoAdmin: () => Promise<{
    error?: string;
    primaryRole?: AppRole;
    roles?: AppRole[];
  }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{
    error?: string;
    needsEmailConfirmation?: boolean;
  }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  resendConfirmationEmail: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<{ error?: string }>;
  confirmPhoneVerification: (phoneNumber: string, verifiedAt?: string) => Promise<{ error?: string }>;
  completeOnboarding: (finalPayload: ProfileUpdatePayload) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  isPasswordResetFlow: boolean;
  clearPasswordResetFlow: () => void;
  setSigningUpState: (signingUp: boolean) => void;
  setEmailVerificationPendingState: (pending: boolean) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesUserId, setRolesUserId] = useState<string | null>(null);
  const [isRolesLoaded, setIsRolesLoaded] = useState<boolean>(false);
  const [isUserDataLoading, setIsUserDataLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [isEmailVerificationPending, setIsEmailVerificationPending] = useState<boolean>(false);
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState<boolean>(false);

  const configured = isSupabaseConfigured();

  // Load user profile & assigned roles from Supabase
  const loadUserData = useCallback(async (userId: string): Promise<{
    profile: ProfileRow | null;
    roles: AppRole[];
    roleError?: string;
  }> => {
    if (!configured) return { profile: null, roles: [] };

    setIsUserDataLoading(true);
    setIsRolesLoaded(false);
    console.log('[RYVOLT AUTH DIAGNOSTIC] loadUserData initiating for user ID:', userId);

    try {
      setAuthError(null);

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('[RYVOLT AUTH DIAGNOSTIC] Profile fetch warning (expected if newly created or RLS active):', profileError.message);
      }

      // 2. Fetch User Roles from trusted public.user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      let resolvedRoles: AppRole[] = [];
      let roleLookupError: string | undefined;

      if (rolesError) {
        console.error('[RYVOLT AUTH DIAGNOSTIC] Roles fetch error from database:', rolesError.message);
        roleLookupError = `Failed to verify user permissions from database: ${rolesError.message}`;
        setAuthError(roleLookupError);
        // On role lookup error, deny privileged access
        setRoles([]);
        setRolesUserId(userId);
      } else if (rolesData && rolesData.length > 0) {
        resolvedRoles = rolesData.map((r: { role: string }) => r.role as AppRole);
        console.log('[RYVOLT AUTH DIAGNOSTIC] Role query succeeded for user ID:', userId, 'Roles returned:', resolvedRoles);
        setRoles(resolvedRoles);
        setRolesUserId(userId);
      } else {
        console.warn('[RYVOLT AUTH DIAGNOSTIC] No roles found in public.user_roles for user ID:', userId, '- defaulting to candidate');
        // Default assignment for standard candidates
        resolvedRoles = ['candidate'];
        setRoles(resolvedRoles);
        setRolesUserId(userId);
      }

      const activeProfile = profileData ? (profileData as ProfileRow) : null;
      setProfile(activeProfile);
      setIsRolesLoaded(true);

      const resolvedPrimary: AppRole = resolvedRoles.includes('admin')
        ? 'admin'
        : resolvedRoles.includes('recruiter')
        ? 'recruiter'
        : 'candidate';

      console.log('[RYVOLT AUTH DIAGNOSTIC] loadUserData completed for user ID:', userId, 'primaryRole:', resolvedPrimary, 'roles:', resolvedRoles);

      return {
        profile: activeProfile,
        roles: resolvedRoles,
        roleError: roleLookupError,
      };
    } catch (err: any) {
      console.error('[RYVOLT AUTH DIAGNOSTIC] Error fetching authenticated profile/roles:', err);
      const msg = err?.message || 'Failed to retrieve profile credentials.';
      setAuthError(msg);
      setRoles([]);
      setRolesUserId(userId);
      setIsRolesLoaded(true);
      return { profile: null, roles: [], roleError: msg };
    } finally {
      setIsUserDataLoading(false);
    }
  }, [configured]);

  // Initial session restoration and subscription listener
  useEffect(() => {
    if (!configured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Check if current URL contains recovery token or recovery error
    const hash = window.location.hash || '';
    if (hash.startsWith('#')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');
      const errorCode = params.get('error_code');

      if (errorParam || errorCode) {
        const errorMsg = errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'Password reset link is invalid or has expired. Please request a new link.';
        setAuthError(mapAuthError(errorMsg));
        setIsPasswordResetFlow(false);
        window.location.hash = '';
      } else if (
        hash.includes('type=recovery') ||
        (params.get('type') === 'recovery' && params.has('access_token'))
      ) {
        setIsPasswordResetFlow(true);
      }
    }

    // 1. Get initial session with guaranteed profile/role hydration
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('[RYVOLT AUTH DIAGNOSTIC] Initial session fetch error:', error.message);
          setAuthError(error.message);
        }
        if (initialSession) {
          console.log('[RYVOLT AUTH DIAGNOSTIC] getSession restored session for user ID:', initialSession.user.id);
          setIsRolesLoaded(false);
          setIsUserDataLoading(true);
          setSession(initialSession);
          setUser(initialSession.user);
          await loadUserData(initialSession.user.id);
        } else {
          console.log('[RYVOLT AUTH DIAGNOSTIC] getSession: No active session (guest mode)');
          setRolesUserId(null);
          setIsRolesLoaded(true);
        }
      })
      .catch((err) => {
        if (isMounted) setAuthError(err?.message || 'Session restore failed.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // 2. Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      console.log('[RYVOLT AUTH DIAGNOSTIC] onAuthStateChange event:', event, 'Has user:', Boolean(newSession?.user), 'User ID:', newSession?.user?.id);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordResetFlow(true);
      }

      if (newSession?.user) {
        setIsRolesLoaded(false);
        setIsUserDataLoading(true);
        setSession(newSession);
        setUser(newSession.user);
        setIsSigningUp(false);
        setIsEmailVerificationPending(false);
        await loadUserData(newSession.user.id);
      } else {
        console.log('[RYVOLT AUTH DIAGNOSTIC] onAuthStateChange cleared session. Resetting roles and auth state to guest.');
        setSession(null);
        setUser(null);
        setProfile(null);
        setRoles([]);
        setRolesUserId(null);
        setIsRolesLoaded(true);
        setIsUserDataLoading(false);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, loadUserData]);

  // Determine primary role hierarchy: admin > recruiter > candidate
  const primaryRole: AppRole = roles.includes('admin')
    ? 'admin'
    : roles.includes('recruiter')
    ? 'recruiter'
    : 'candidate';

  const hasRole = useCallback(
    (roleToCheck: AppRole) => {
      return roles.includes(roleToCheck);
    },
    [roles]
  );

  // Derive explicit authentication state machine
  const authState: AuthState = useMemo(() => {
    if (isLoading || isUserDataLoading) return 'SESSION_LOADING';
    if (authError) return 'AUTH_ERROR';
    if (isSigningUp) return 'SIGNING_UP';
    if (isEmailVerificationPending) return 'EMAIL_VERIFICATION_PENDING';
    if (!user) return 'SIGNED_OUT';

    // Recruiter / Admin accounts bypass candidate onboarding
    if (primaryRole !== 'candidate') {
      return 'ONBOARDING_COMPLETE';
    }

    // Candidate evaluation:
    // 1. Check if profile metadata is filled
    const isProfileFilled = Boolean(
      profile &&
      profile.display_name &&
      profile.display_name.trim().length > 0 &&
      profile.headline &&
      profile.headline.trim().length > 0 &&
      profile.target_role &&
      profile.target_role.trim().length > 0
    );

    if (!isProfileFilled) {
      return 'PROFILE_INCOMPLETE';
    }

    // 2. Check if mobile phone is verified via Twilio Verify
    const isPhoneVerified = Boolean(profile && profile.phone_verified);
    if (!isPhoneVerified) {
      return 'PHONE_VERIFICATION_PENDING';
    }

    // 3. Check overall onboarding flag
    if (!profile?.onboarding_completed) {
      return 'PROFILE_INCOMPLETE';
    }

    return 'ONBOARDING_COMPLETE';
  }, [isLoading, isUserDataLoading, authError, isSigningUp, isEmailVerificationPending, user, primaryRole, profile]);

  const needsOnboarding = Boolean(
    !isLoading &&
    !isUserDataLoading &&
    isRolesLoaded &&
    user &&
    primaryRole === 'candidate' &&
    (!profile?.onboarding_completed || !profile?.phone_verified)
  );

  // Sign In action with explicit role resolution
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string; primaryRole?: AppRole; roles?: AppRole[] }> => {
    if (!configured) {
      return { error: 'Supabase configuration missing. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const mapped = mapAuthError(error);
        setAuthError(mapped);
        return { error: mapped };
      }

      if (data.user) {
        console.log('[RYVOLT AUTH DIAGNOSTIC] Supabase signInWithPassword succeeded for user ID:', data.user.id);
        // Resolve roles immediately from database
        const { roles: resolvedRoles, roleError } = await loadUserData(data.user.id);
        if (roleError) {
          console.error('[RYVOLT AUTH DIAGNOSTIC] Role resolution error during signIn:', roleError);
          return { error: roleError };
        }

        const resolvedPrimary: AppRole = resolvedRoles.includes('admin')
          ? 'admin'
          : resolvedRoles.includes('recruiter')
          ? 'recruiter'
          : 'candidate';

        console.log('[RYVOLT AUTH DIAGNOSTIC] signIn returning resolvedPrimary:', resolvedPrimary, 'roles:', resolvedRoles);
        return { primaryRole: resolvedPrimary, roles: resolvedRoles };
      }

      return {};
    } catch (err) {
      console.error('[RYVOLT AUTH DIAGNOSTIC] Exception in signIn:', err);
      const mapped = mapAuthError(err);
      setAuthError(mapped);
      return { error: mapped };
    }
  };

  // Secure Server-Side Demo Admin Login
  const signInWithDemoAdmin = async (): Promise<{
    error?: string;
    primaryRole?: AppRole;
    roles?: AppRole[];
  }> => {
    try {
      setAuthError(null);
      console.log('[RYVOLT AUTH DIAGNOSTIC] Requesting server-side demo admin authentication...');
      const res = await fetch('/api/auth/demo-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Failed to authenticate demo admin.';
        setAuthError(errMsg);
        return { error: errMsg };
      }

      if (data.session) {
        console.log('[RYVOLT AUTH DIAGNOSTIC] Setting browser Supabase session with demo admin tokens');
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionErr) {
          console.warn('[RYVOLT AUTH DIAGNOSTIC] setSession warning:', sessionErr.message);
        }

        const activeUserId = sessionData?.user?.id || data.user.id;
        const { roles: resolvedRoles } = await loadUserData(activeUserId);
        const finalRoles: AppRole[] = resolvedRoles.includes('admin')
          ? resolvedRoles
          : (['admin', ...resolvedRoles] as AppRole[]);

        setRoles(finalRoles);
        setIsRolesLoaded(true);

        console.log('[RYVOLT AUTH DIAGNOSTIC] Demo admin login verified! Primary: admin, roles:', finalRoles);
        return { primaryRole: 'admin', roles: finalRoles };
      }

      return { error: 'Authentication session token missing from server.' };
    } catch (err: any) {
      const msg = err?.message || 'Network error during demo admin login.';
      setAuthError(msg);
      return { error: msg };
    }
  };

  // Sign Up action
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ error?: string; needsEmailConfirmation?: boolean }> => {
    if (!configured) {
      return { error: 'Supabase configuration missing. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      setAuthError(null);
      setIsSigningUp(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (error) {
        setIsSigningUp(false);
        const mapped = mapAuthError(error);
        setAuthError(mapped);
        return { error: mapped };
      }

      // Check if email confirmation is required by Supabase project settings
      const needsEmailConfirmation = Boolean(data.user && !data.session);

      if (needsEmailConfirmation) {
        setIsEmailVerificationPending(true);
      } else if (data.user && data.session) {
        await loadUserData(data.user.id);
      }

      setIsSigningUp(false);
      return { needsEmailConfirmation };
    } catch (err) {
      setIsSigningUp(false);
      const mapped = mapAuthError(err);
      setAuthError(mapped);
      return { error: mapped };
    }
  };

  // Sign Out action
  const signOut = async (): Promise<void> => {
    if (!configured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error signing out:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      setAuthError(null);
    }
  };

  // Password Recovery action
  const sendPasswordReset = async (email: string): Promise<{ error?: string }> => {
    if (!configured) {
      return { error: 'Supabase configuration missing.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#reset-password`,
      });

      if (error) {
        return { error: mapAuthError(error) };
      }
      return {};
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  };

  // Resend Email Confirmation action
  const resendConfirmationEmail = async (email: string): Promise<{ error?: string }> => {
    if (!configured) {
      return { error: 'Supabase configuration missing.' };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        return { error: mapAuthError(error) };
      }
      return {};
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  };

  // Password Update (from recovery flow)
  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    if (!configured) {
      return { error: 'Supabase configuration missing.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: mapAuthError(error) };
      }
      setIsPasswordResetFlow(false);
      return {};
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  };

  // Profile Update action
  const updateProfile = async (payload: ProfileUpdatePayload): Promise<{ error?: string }> => {
    if (!configured || !user) {
      return { error: 'Authenticated session required to update profile.' };
    }

    try {
      const updatePayload: Partial<ProfileRow> = {
        ...payload,
        updated_at: new Date().toISOString(),
      };

      // Check if profile exists first; if not, upsert
      const { data, error } = await (supabase
        .from('profiles') as any)
        .upsert({
          id: user.id,
          display_name: payload.display_name || user.user_metadata?.display_name || 'Candidate',
          ...updatePayload,
        })
        .select()
        .single();

      if (error) {
        return { error: mapAuthError(error) };
      }

      if (data) {
        setProfile(data as ProfileRow);
      }

      return {};
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  };

  // Confirm Phone Verification via Twilio Verify
  const confirmPhoneVerification = async (
    phoneNumber: string,
    verifiedAt?: string
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'User must be authenticated.' };

    try {
      const updatePayload: Partial<ProfileRow> = {
        phone_number: phoneNumber,
        phone_verified: true,
        phone_verified_at: verifiedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase
        .from('profiles') as any)
        .upsert({
          id: user.id,
          display_name: profile?.display_name || user.user_metadata?.display_name || 'Candidate',
          ...updatePayload,
        })
        .select()
        .single();

      if (error) {
        return { error: mapAuthError(error) };
      }

      if (data) {
        setProfile(data as ProfileRow);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to record phone verification state.' };
    }
  };

  // Complete Onboarding: updates profile, ensures phone verification is recorded, and marks onboarding complete
  const completeOnboarding = async (
    finalPayload: ProfileUpdatePayload
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'User must be authenticated.' };

    try {
      const updatePayload: Partial<ProfileRow> = {
        ...finalPayload,
        phone_verified: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase
        .from('profiles') as any)
        .upsert({
          id: user.id,
          display_name: finalPayload.display_name || profile?.display_name || 'Candidate',
          ...updatePayload,
        })
        .select()
        .single();

      if (error) {
        return { error: mapAuthError(error) };
      }

      if (data) {
        setProfile(data as ProfileRow);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to finalize candidate onboarding.' };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const clearPasswordResetFlow = () => {
    setIsPasswordResetFlow(false);
    window.location.hash = '';
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        primaryRole,
        authState,
        needsOnboarding,
        isLoading,
        isRolesLoaded,
        isUserDataLoading,
        rolesUserId,
        isConfigured: configured,
        authError,
        hasRole,
        signIn,
        signInWithDemoAdmin,
        signUp,
        signOut,
        sendPasswordReset,
        resendConfirmationEmail,
        updatePassword,
        updateProfile,
        confirmPhoneVerification,
        completeOnboarding,
        refreshProfile,
        isPasswordResetFlow,
        clearPasswordResetFlow,
        setSigningUpState: setIsSigningUp,
        setEmailVerificationPendingState: setIsEmailVerificationPending,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
