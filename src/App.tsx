import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { WorkspaceRole } from './types';
import { LandingPageView } from './views/LandingPageView';
import { WorkspaceShell } from './components/workspace/WorkspaceShell';
import { Button } from './components/ui/Button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MandatoryOnboardingWizard } from './components/auth/MandatoryOnboardingWizard';

// Error Boundary implementation for resilient rendering
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RYVOLT Application Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              A temporary issue occurred in the UI layer. Please reset the application view to continue.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '';
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainAppCoordinator() {
  const [activeRole, setActiveRole] = useState<WorkspaceRole>('guest');
  const {
    user,
    roles,
    primaryRole,
    needsOnboarding,
    isRolesLoaded,
    isLoading,
    isUserDataLoading,
  } = useAuth();
  const sessionRoutedUserIdRef = React.useRef<string | null>(null);

  // If user signs out while in workspace, return to landing view
  useEffect(() => {
    if (!user) {
      if (activeRole !== 'guest') {
        console.log('[RYVOLT AUTH DIAGNOSTIC] User signed out or null user detected. Resetting activeRole to guest');
        setActiveRole('guest');
      }
      sessionRoutedUserIdRef.current = null;
    }
  }, [user, activeRole]);

  // When user authenticates and roles finish loading, route to their authorized primaryRole
  useEffect(() => {
    if (user && isRolesLoaded && !isLoading && !isUserDataLoading) {
      console.log(
        '[RYVOLT AUTH DIAGNOSTIC] MainAppCoordinator evaluation:',
        'User ID:', user.id,
        'Roles:', roles,
        'primaryRole:', primaryRole,
        'activeRole:', activeRole,
        'lastRoutedUserId:', sessionRoutedUserIdRef.current
      );

      // If user hasn't been routed for this session yet, or is currently on guest
      if (sessionRoutedUserIdRef.current !== user.id || activeRole === 'guest') {
        sessionRoutedUserIdRef.current = user.id;
        console.log(
          '[RYVOLT AUTH DIAGNOSTIC] Routing authenticated user ID:', user.id,
          'to primaryRole:', primaryRole,
          '(activeRole transitioning from:', activeRole, 'to:', primaryRole, ')'
        );
        setActiveRole(primaryRole);
      }
    }
  }, [user, roles, primaryRole, activeRole, isRolesLoaded, isLoading, isUserDataLoading]);

  // If candidate is logged in but onboarding/phone OTP is pending, enforce mandatory wizard
  if (user && isRolesLoaded && !isLoading && !isUserDataLoading && needsOnboarding) {
    console.log('[RYVOLT AUTH DIAGNOSTIC] Candidate onboarding pending. Showing MandatoryOnboardingWizard for user ID:', user.id);
    return (
      <MandatoryOnboardingWizard
        onCompleted={() => {
          console.log('[RYVOLT AUTH DIAGNOSTIC] MandatoryOnboardingWizard completed. Routing to candidate workspace');
          setActiveRole('candidate');
        }}
      />
    );
  }

  return activeRole === 'guest' ? (
    <LandingPageView
      onEnterWorkspace={(role) => {
        console.log('[RYVOLT AUTH DIAGNOSTIC] LandingPageView requested onEnterWorkspace with role:', role);
        setActiveRole(role);
      }}
    />
  ) : (
    <WorkspaceShell
      initialRole={activeRole}
      onExit={() => {
        console.log('[RYVOLT AUTH DIAGNOSTIC] WorkspaceShell requested onExit. Resetting activeRole to guest');
        sessionRoutedUserIdRef.current = null;
        setActiveRole('guest');
      }}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainAppCoordinator />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
