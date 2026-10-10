import React, { useState, useEffect } from 'react';
import { WorkspaceRole, NavItem } from '../../types';
import {
  CANDIDATE_NAV_ITEMS,
  RECRUITER_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
} from '../../lib/constants';
import { WorkspaceSidebar } from '../navigation/WorkspaceSidebar';
import { WorkspaceNavbar } from '../navigation/WorkspaceNavbar';
import { WorkspacePlaceholderView } from './WorkspacePlaceholderView';
import { UnauthorizedView } from './UnauthorizedView';
import { CandidateProfileSettings } from './CandidateProfileSettings';
import { CandidateDashboardView } from '../candidate/CandidateDashboardView';
import { BuildLabView } from '../candidate/BuildLabView';
import { MandatoryOnboardingWizard } from '../auth/MandatoryOnboardingWizard';
import { CareerTwinView } from '../career-twin/CareerTwinView';
import { ResumeStudioView } from '../resume-studio/ResumeStudioView';
import { JobDiscoveryView } from '../jobs/JobDiscoveryView';
import { ApplicationTrackerView } from '../applications/ApplicationTrackerView';
import { VoiceCoachModal } from '../voice/VoiceCoachModal';
import { OnboardingModal } from '../auth/OnboardingModal';
import { useAuth } from '../../contexts/AuthContext';
import { AppRole } from '../../types/database';

// Phase 5 Recruiter Views
import { RecruiterOverview } from '../recruiter/RecruiterOverview';
import { PostJobView } from '../recruiter/PostJobView';
import { DiscoverCandidatesView } from '../recruiter/DiscoverCandidatesView';
import { ShortlistsView } from '../recruiter/ShortlistsView';
import { RecruiterApplicationsPipeline } from '../recruiter/RecruiterApplicationsPipeline';
import { InterviewSchedulingView } from '../recruiter/InterviewSchedulingView';
import { OrganizationSettingsView } from '../recruiter/OrganizationSettingsView';

// Phase 5 & 8 Admin Views
import { AdminPlatformOverview } from '../admin/AdminPlatformOverview';
import { UsersManagementView } from '../admin/UsersManagementView';
import { StudentVerificationReviewView } from '../admin/StudentVerificationReviewView';
import { OrganizationsManagementView } from '../admin/OrganizationsManagementView';
import { JobsModerationView } from '../admin/JobsModerationView';
import { ContentModerationQueueView } from '../admin/ContentModerationQueueView';
import { AuditLogsView } from '../admin/AuditLogsView';
import { SystemHealthIntegrationsView } from '../admin/SystemHealthIntegrationsView';
import { RecruiterAccessRequestsView } from '../admin/RecruiterAccessRequestsView';

export interface WorkspaceShellProps {
  initialRole: WorkspaceRole;
  onExit: () => void;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  initialRole,
  onExit,
}) => {
  const { user, roles, hasRole, needsOnboarding } = useAuth();

  const [currentRole, setCurrentRole] = useState<WorkspaceRole>(
    initialRole === 'guest' ? 'candidate' : initialRole
  );

  // Sync role when initialRole updates from coordinator (e.g. after authentication)
  useEffect(() => {
    console.log(
      '[RYVOLT AUTH DIAGNOSTIC] WorkspaceShell prop check - initialRole:', initialRole,
      'currentRole:', currentRole,
      'user ID:', user?.id,
      'roles in context:', roles
    );
    if (initialRole !== 'guest' && initialRole !== currentRole) {
      console.log(
        '[RYVOLT AUTH DIAGNOSTIC] WorkspaceShell updating currentRole from initialRole prop:',
        'transitioning from:', currentRole, 'to:', initialRole
      );
      setCurrentRole(initialRole);
      const newItems = getNavItemsForRole(initialRole);
      setActiveItemId(newItems[0]?.id || 'home');
    }
  }, [initialRole]);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isVoiceCoachOpen, setIsVoiceCoachOpen] = useState(false);

  const getNavItemsForRole = (role: WorkspaceRole): NavItem[] => {
    switch (role) {
      case 'candidate':
        return CANDIDATE_NAV_ITEMS;
      case 'recruiter':
        return RECRUITER_NAV_ITEMS;
      case 'admin':
        return ADMIN_NAV_ITEMS;
      default:
        return CANDIDATE_NAV_ITEMS;
    }
  };

  const navItems = getNavItemsForRole(currentRole);
  const [activeItemId, setActiveItemId] = useState<string>(navItems[0].id);

  // When switching role, reset active item to first item of that role
  const handleRoleChange = (newRole: WorkspaceRole) => {
    console.log('[RYVOLT AUTH DIAGNOSTIC] WorkspaceShell user manually changed role to:', newRole);
    setCurrentRole(newRole);
    const newItems = getNavItemsForRole(newRole);
    setActiveItemId(newItems[0].id);
  };

  const activeItem =
    navItems.find((item) => item.id === activeItemId) || navItems[0];

  // Role Access Evaluation:
  // Unauthenticated users or users lacking explicit role clearance are strictly unauthorized.
  const isUnauthorized =
    (currentRole === 'recruiter' && (!user || !hasRole('recruiter'))) ||
    (currentRole === 'admin' && (!user || !hasRole('admin')));

  useEffect(() => {
    if (isUnauthorized) {
      console.warn(
        '[RYVOLT AUTH DIAGNOSTIC] WorkspaceShell isUnauthorized triggered! currentRole:', currentRole,
        'user ID:', user?.id,
        'user roles:', roles
      );
    }
  }, [isUnauthorized, currentRole, user?.id, roles]);

  return (
    <div className="min-h-screen bg-[#F7F8FF] dark:bg-[#080B18] text-[#17152F] dark:text-[#F8FAFC] flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:block print:hidden">
        <WorkspaceSidebar
          role={currentRole}
          items={navItems}
          activeId={activeItemId}
          onSelect={setActiveItemId}
          onExitWorkspace={onExit}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden">
          <WorkspaceNavbar
            role={currentRole}
            currentViewLabel={activeItem.label}
            onSwitchRole={handleRoleChange}
            onExit={onExit}
            onOpenVoiceCoach={() => setIsVoiceCoachOpen(true)}
          />
        </div>

        {/* Mobile Navigation Strip (horizontal scroll) */}
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2 overflow-x-auto flex items-center gap-2 print:hidden">
          {navItems.map((item) => {
            const isActive = activeItemId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItemId(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

          {/* Viewport container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
          {isUnauthorized ? (
            <UnauthorizedView
              requiredRole={currentRole as AppRole}
              userRoles={roles}
              onReturnToAllowedRole={() => handleRoleChange('candidate')}
            />
          ) : currentRole === 'candidate' && needsOnboarding ? (
            <MandatoryOnboardingWizard />
          ) : currentRole === 'candidate' && (activeItemId === 'home' || !activeItemId) ? (
            <CandidateDashboardView
              onNavigateToJobs={() => setActiveItemId('discover-jobs')}
              onNavigateToTwin={() => setActiveItemId('career-twin')}
              onNavigateToResumeStudio={() => setActiveItemId('resume-studio')}
              onNavigateToApplications={() => setActiveItemId('applications')}
              onOpenVoiceCoach={() => setIsVoiceCoachOpen(true)}
              onNavigateToBuildLab={() => setActiveItemId('buildlab')}
            />
          ) : currentRole === 'candidate' && activeItemId === 'career-twin' ? (
            <CareerTwinView
              onNavigateToResumeStudio={() => setActiveItemId('resume-studio')}
              onEditBaselineProfile={() => setIsOnboardingOpen(true)}
            />
          ) : currentRole === 'candidate' && activeItemId === 'buildlab' ? (
            <BuildLabView
              onNavigateToTwin={() => setActiveItemId('career-twin')}
              onNavigateToResumeStudio={() => setActiveItemId('resume-studio')}
            />
          ) : currentRole === 'candidate' && activeItemId === 'resume-studio' ? (
            <ResumeStudioView />
          ) : currentRole === 'candidate' && activeItemId === 'discover-jobs' ? (
            <JobDiscoveryView
              onNavigateToApplications={() => setActiveItemId('applications')}
              onNavigateToResumeStudio={() => setActiveItemId('resume-studio')}
            />
          ) : currentRole === 'candidate' && activeItemId === 'applications' ? (
            <ApplicationTrackerView
              onNavigateToJobs={() => setActiveItemId('discover-jobs')}
              onNavigateToResumeStudio={() => setActiveItemId('resume-studio')}
            />
          ) : currentRole === 'candidate' && activeItemId === 'settings' ? (
            <CandidateProfileSettings />
          ) : currentRole === 'recruiter' && activeItemId === 'overview' ? (
            <RecruiterOverview
              onNavigateTab={(tab) => setActiveItemId(tab)}
              onSelectCandidate={() => setActiveItemId('discover-candidates')}
            />
          ) : currentRole === 'recruiter' && activeItemId === 'post-job' ? (
            <PostJobView
              onNavigateToPipeline={() => setActiveItemId('recruiter-applications')}
            />
          ) : currentRole === 'recruiter' && activeItemId === 'discover-candidates' ? (
            <DiscoverCandidatesView
              onScheduleInterview={() => setActiveItemId('interviews')}
            />
          ) : currentRole === 'recruiter' && activeItemId === 'shortlists' ? (
            <ShortlistsView
              onScheduleInterview={() => setActiveItemId('interviews')}
            />
          ) : currentRole === 'recruiter' && activeItemId === 'recruiter-applications' ? (
            <RecruiterApplicationsPipeline
              onScheduleInterviewForApp={() => setActiveItemId('interviews')}
            />
          ) : currentRole === 'recruiter' && activeItemId === 'interviews' ? (
            <InterviewSchedulingView />
          ) : currentRole === 'recruiter' && activeItemId === 'organization-settings' ? (
            <OrganizationSettingsView />
          ) : currentRole === 'admin' && activeItemId === 'platform-overview' ? (
            <AdminPlatformOverview onNavigateTab={(tab) => setActiveItemId(tab)} />
          ) : currentRole === 'admin' && activeItemId === 'users' ? (
            <UsersManagementView />
          ) : currentRole === 'admin' && activeItemId === 'access-requests' ? (
            <RecruiterAccessRequestsView />
          ) : currentRole === 'admin' && activeItemId === 'student-verification' ? (
            <StudentVerificationReviewView />
          ) : currentRole === 'admin' && activeItemId === 'organizations' ? (
            <OrganizationsManagementView />
          ) : currentRole === 'admin' && activeItemId === 'jobs-moderation' ? (
            <JobsModerationView />
          ) : currentRole === 'admin' && activeItemId === 'moderation' ? (
            <ContentModerationQueueView />
          ) : currentRole === 'admin' && activeItemId === 'audit-logs' ? (
            <AuditLogsView />
          ) : currentRole === 'admin' && (activeItemId === 'admin-integrations' || activeItemId === 'system-health') ? (
            <SystemHealthIntegrationsView />
          ) : (
            <WorkspacePlaceholderView
              role={currentRole}
              item={activeItem}
              onLaunchOnboarding={() => setIsOnboardingOpen(true)}
            />
          )}
        </main>
      </div>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <VoiceCoachModal
        isOpen={isVoiceCoachOpen}
        onClose={() => setIsVoiceCoachOpen(false)}
      />
    </div>
  );
};
