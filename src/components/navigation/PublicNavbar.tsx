import React, { useState } from 'react';
import { Menu, ArrowRight, User, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { MobileMenu } from './MobileMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { audioService } from '../../lib/audioService';

export interface PublicNavbarProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenAuth: () => void;
  onSwitchWorkspace: (role: 'candidate' | 'recruiter' | 'admin') => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  onNavigateSection,
  onOpenAuth,
  onSwitchWorkspace,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => audioService.getMuted());
  const { user, profile, primaryRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleToggleSound = () => {
    const nextMuted = audioService.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) audioService.playClick();
  };

  const handleToggleTheme = () => {
    audioService.playClick();
    toggleTheme();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-850/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single brand wordmark element */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('hero');
            }}
            className="flex items-center gap-2 text-slate-900 dark:text-white focus-visible:ring-2 focus-visible:ring-violet-500 rounded-md shrink-0"
          >
            <BrandLogo size="md" />
          </a>

          {/* Zone 2: 4-5 clean single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <button
              onClick={() => onNavigateSection('career-twin')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Career Twin
            </button>
            <button
              onClick={() => onNavigateSection('buildlab')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              BuildLab
            </button>
            <button
              onClick={() => onNavigateSection('discover-jobs')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Discover Jobs
            </button>
            <button
              onClick={() => onNavigateSection('recruiters')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              For Recruiters
            </button>
            <button
              onClick={() => onNavigateSection('trust')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Trust & Principles
            </button>
          </nav>

          {/* Zone 3: 1 primary action cluster */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={handleToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-violet-600" />
              )}
            </button>

            {/* Audio Feedback Toggle */}
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute interaction audio' : 'Mute interaction audio'}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-violet-600 dark:text-cyan-400" />
              )}
            </button>

            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchWorkspace(primaryRole)}
                leftIcon={<User className="w-3.5 h-3.5 text-violet-500" />}
                className="whitespace-nowrap shrink-0"
              >
                <span>{profile?.display_name || user.email?.split('@')[0]}</span>
              </Button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                Sign in
              </button>
            )}

            <Button
              variant="quantum"
              size="sm"
              onClick={() => onSwitchWorkspace(user ? primaryRole : 'candidate')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="whitespace-nowrap shrink-0 shadow-md"
            >
              {user ? 'Open Workspace' : 'Start building'}
            </Button>

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={onNavigateSection}
        onOpenAuth={onOpenAuth}
      />
    </>
  );
};
