import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { Compass, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const { profile, updateProfile, isConfigured } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [targetRole, setTargetRole] = useState('distributed-systems');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHeadline(profile.headline || '');
      setLocation(profile.location || '');
      if (profile.target_role) {
        setTargetRole(profile.target_role);
      }
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage('Please enter your full name or display name.');
      return;
    }

    if (!headline.trim()) {
      setErrorMessage('Please specify a professional headline (e.g. Systems Engineer).');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        display_name: displayName.trim(),
        headline: headline.trim(),
        location: location.trim() || null,
        target_role: targetRole,
        onboarding_completed: true,
      });

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
          if (onCompleted) onCompleted();
        }, 1200);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initialize your Career Twin"
      description="Calibrate your baseline profile parameters. All data is persisted authoritatively to Supabase PostgreSQL."
      maxWidth="md"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Career Twin Profile Initialized!
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your profile has been saved to PostgreSQL. You can revisit and update these credentials anytime in Settings.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name or Public Handle"
              placeholder="Alex Chen"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              helperText="Displayed to prospective technical recruiters upon application."
              required
            />

            <Input
              label="Professional Headline"
              placeholder="Senior Infrastructure & Distributed Systems Engineer"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              helperText="Summarizes your engineering craft or core specialization."
              required
            />

            <Input
              label="Location / Working Preference"
              placeholder="San Francisco, CA or Remote (US/EU)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              helperText="Helps match geographically compliant requisitions."
            />

            <Select
              label="Target Role Track"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              options={[
                { value: 'distributed-systems', label: 'Distributed Systems & Platform Lead' },
                { value: 'backend-infrastructure', label: 'Backend & High-Throughput Services' },
                { value: 'frontend-architect', label: 'Frontend & UX System Architect' },
                { value: 'fullstack-engineer', label: 'Full-Stack Product Software Engineer' },
                { value: 'data-ml-systems', label: 'Data Infrastructure & ML Platform' },
              ]}
              helperText="Determines default ontology benchmarks in Phase 3."
            />

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Complete Later
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Save Profile
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
