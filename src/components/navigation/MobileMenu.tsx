import React, { useEffect } from 'react';
import { X, ArrowRight, User } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (targetId: string) => void;
  onOpenAuth: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAuth,
}) => {
  const { user, profile, primaryRole, signOut } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [
    { id: 'career-twin', label: 'Career Twin' },
    { id: 'buildlab', label: 'BuildLab' },
    { id: 'discover-jobs', label: 'Discover Jobs' },
    { id: 'recruiters', label: 'For Recruiters' },
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'trust', label: 'Principles' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-xs md:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full bg-white border-b border-slate-200 p-5 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <BrandLogo size="sm" />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 pt-2">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                onClose();
              }}
              className="text-left py-2.5 px-3 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
          {user ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-600 px-1 py-1">
                <span className="font-semibold text-slate-900">
                  {profile?.display_name || user.email}
                </span>
                <span className="font-mono text-indigo-600 uppercase">
                  [{primaryRole}]
                </span>
              </div>
              <Button
                variant="primary"
                className="w-full justify-center"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  onClose();
                  onNavigate('workspace');
                }}
              >
                Go to Workspace
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  signOut();
                  onClose();
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                className="w-full justify-center"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  onClose();
                  onNavigate('hero');
                }}
              >
                Start building
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
