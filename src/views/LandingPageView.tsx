import React, { useState, useEffect } from 'react';
import { WorkspaceRole } from '../types';
import { PublicNavbar } from '../components/navigation/PublicNavbar';
import { HeroSection } from '../components/marketing/HeroSection';
import { HowItWorksSection } from '../components/marketing/HowItWorksSection';
import { CapabilitiesSection } from '../components/marketing/CapabilitiesSection';
import { CandidateValueSection } from '../components/marketing/CandidateValueSection';
import { RecruiterValueSection } from '../components/marketing/RecruiterValueSection';
import { TrustPrinciplesSection } from '../components/marketing/TrustPrinciplesSection';
import { DesignSystemShowcase } from '../components/marketing/DesignSystemShowcase';
import { Footer } from '../components/marketing/Footer';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';
import { LegalModal } from '../components/shared/LegalModal';
import { SupabaseConfigBanner } from '../components/auth/SupabaseConfigBanner';
import { VoiceCoachModal } from '../components/voice/VoiceCoachModal';
import { useAuth } from '../contexts/AuthContext';

export interface LandingPageViewProps {
  onEnterWorkspace: (role: WorkspaceRole) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterWorkspace,
}) => {
  const { user, primaryRole, isConfigured, isPasswordResetFlow } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [voiceCoachOpen, setVoiceCoachOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  // Automatically trigger reset password modal if recovery token present in URL
  useEffect(() => {
    if (isPasswordResetFlow) {
      setAuthMode('reset');
      setAuthModalOpen(true);
    }
  }, [isPasswordResetFlow]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartBuilding = () => {
    if (user) {
      console.log('[RYVOLT AUTH DIAGNOSTIC] LandingPageView handleStartBuilding navigating with primaryRole:', primaryRole);
      onEnterWorkspace(primaryRole);
    } else {
      setAuthMode('signup');
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FF] dark:bg-[#080B18] text-[#17152F] dark:text-[#F8FAFC] flex flex-col transition-colors duration-200">
      {/* Configuration Status Topstrip when Supabase not configured */}
      {!isConfigured && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3">
          <SupabaseConfigBanner />
        </div>
      )}

      {/* Top Navigation */}
      <PublicNavbar
        onNavigateSection={scrollToSection}
        onOpenAuth={() => {
          setAuthMode('signin');
          setAuthModalOpen(true);
        }}
        onSwitchWorkspace={(role) => onEnterWorkspace(role)}
      />

      <main className="flex-1">
        {/* Section B: Hero */}
        <HeroSection
          onStartBuilding={handleStartBuilding}
          onExplore={() => scrollToSection('capabilities')}
          onOpenVoiceCoach={() => setVoiceCoachOpen(true)}
          onOpenRecruiter={() => onEnterWorkspace('recruiter')}
        />

        {/* Section C: How It Works */}
        <HowItWorksSection />

        {/* Section D: Product Capabilities Bento Grid */}
        <CapabilitiesSection
          onSelectFeaturePreview={() => onEnterWorkspace(user ? primaryRole : 'candidate')}
        />

        {/* Section E: Candidate Value Proposition */}
        <CandidateValueSection />

        {/* Section F: Recruiter Value Proposition */}
        <RecruiterValueSection />

        {/* Section G: Trust & Integrations */}
        <TrustPrinciplesSection />

        {/* Design System & Interactive UI Primitives */}
        <DesignSystemShowcase />
      </main>

      {/* Section H: Footer & Legal Notice */}
      <Footer
        onNavigateSection={scrollToSection}
        onOpenLegalModal={(doc) => setLegalDoc(doc)}
        onStartBuilding={handleStartBuilding}
      />

      {/* Real Supabase Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={(resolvedRole) => {
          const target = resolvedRole || primaryRole;
          console.log('[RYVOLT AUTH DIAGNOSTIC] AuthModal onSuccess triggered with target:', target, 'resolvedRole:', resolvedRole, 'primaryRole in LandingPage:', primaryRole);
          onEnterWorkspace(target);
        }}
      />

      {/* Legal Disclaimers Modal */}
      <LegalModal
        isOpen={Boolean(legalDoc)}
        onClose={() => setLegalDoc(null)}
        docType={legalDoc}
      />

      {/* Interactive Voice Career Coach Modal */}
      <VoiceCoachModal
        isOpen={voiceCoachOpen}
        onClose={() => setVoiceCoachOpen(false)}
        initialMode="mock_interview"
      />
    </div>
  );
};
