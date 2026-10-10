import React, { useState } from 'react';
import { WorkspaceRole } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LogOut, Mic, Volume2, VolumeX, Sun, Moon, Monitor } from 'lucide-react';
import { audioService } from '../../lib/audioService';

export interface WorkspaceNavbarProps {
  role: WorkspaceRole;
  currentViewLabel: string;
  onSwitchRole: (role: WorkspaceRole) => void;
  onExit: () => void;
  onOpenVoiceCoach?: () => void;
}

export const WorkspaceNavbar: React.FC<WorkspaceNavbarProps> = ({
  role,
  currentViewLabel,
  onSwitchRole,
  onExit,
  onOpenVoiceCoach,
}) => {
  const { user, profile, roles, signOut, isConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMuted, setIsMuted] = useState(() => audioService.getMuted());

  const handleToggleSound = () => {
    const nextMuted = audioService.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) audioService.playClick();
  };

  const handleToggleTheme = () => {
    audioService.playClick();
    toggleTheme();
  };

  const currentDisplayName = profile?.display_name || user?.email?.split('@')[0] || 'Builder';
  const displayEmail = user?.email || (isConfigured ? 'Unauthenticated' : 'Preview Mode');

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
      {/* Breadcrumb Area */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium min-w-0">
        <span className="text-slate-900 dark:text-white font-semibold shrink-0">RYVOLT</span>
        <span>/</span>
        <span className="capitalize text-slate-700 dark:text-slate-300 shrink-0">{role} Workspace</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold truncate">{currentViewLabel}</span>
      </div>

      {/* Role Switcher Toolbar & Profile preview */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Theme Toggle (Dark / Light / System) */}
        <button
          onClick={handleToggleTheme}
          title={`Theme: ${theme.toUpperCase()} (Click to change)`}
          aria-label={`Current theme is ${theme}. Click to switch theme.`}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : theme === 'light' ? (
            <Moon className="w-4 h-4 text-indigo-600" />
          ) : (
            <Monitor className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? 'Unmute interaction audio' : 'Mute interaction audio'}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-slate-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {onOpenVoiceCoach && (
          <button
            onClick={onOpenVoiceCoach}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Voice AI Coach</span>
          </button>
        )}

        {/* Role Switcher Toolbar (Only exposed to users possessing elevated roles) */}
        {(roles.includes('recruiter') || roles.includes('admin')) && (
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/70 dark:border-slate-700 text-xs">
            <button
              onClick={() => {
                console.log('[RYVOLT AUTH DIAGNOSTIC] WorkspaceNavbar switching to candidate view');
                onSwitchRole('candidate');
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                role === 'candidate'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Candidate View
            </button>
            {roles.includes('recruiter') && (
              <button
                onClick={() => {
                  console.log('[RYVOLT AUTH DIAGNOSTIC] WorkspaceNavbar switching to recruiter view');
                  onSwitchRole('recruiter');
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  role === 'recruiter'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Recruiter View
              </button>
            )}
            {roles.includes('admin') && (
              <button
                onClick={() => {
                  console.log('[RYVOLT AUTH DIAGNOSTIC] WorkspaceNavbar switching to admin view');
                  onSwitchRole('admin');
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Admin View
              </button>
            )}
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Authenticated user pill */}
        <div className="flex items-center gap-2">
          <Avatar
            name={currentDisplayName}
            size="sm"
            roleTag={role || (roles.includes('admin') ? 'admin' : roles[0])}
          />
          <div className="hidden md:flex flex-col text-left text-xs leading-tight">
            <span className="font-semibold text-slate-800 truncate max-w-[140px]">
              {currentDisplayName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
              {user ? `[${roles.join(', ') || 'candidate'}]` : 'Guest Preview'}
            </span>
          </div>
        </div>

        {user ? (
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs"
          >
            Sign Out
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onExit} className="text-xs">
            Exit to Landing
          </Button>
        )}
      </div>
    </header>
  );
};
