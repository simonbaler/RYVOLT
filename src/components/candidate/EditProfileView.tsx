import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import {
  User,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface EditProfileViewProps {
  onBackToProfile: () => void;
}

export const EditProfileView: React.FC<EditProfileViewProps> = ({ onBackToProfile }) => {
  const { profile, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [targetRole, setTargetRole] = useState('distributed-systems');
  const [githubHandle, setGithubHandle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(2);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHeadline(profile.headline || '');
      setLocation(profile.location || '');
      setBio(profile.bio || '');
      if (profile.target_role) setTargetRole(profile.target_role);
      setGithubHandle(profile.github_handle || '');
      setPortfolioUrl(profile.portfolio_url || '');
      setYearsExperience(profile.years_experience || 2);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setFeedback({ message: 'Display name cannot be empty.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        display_name: displayName.trim(),
        headline: headline.trim(),
        location: location.trim() || null,
        bio: bio.trim() || null,
        target_role: targetRole,
        github_handle: githubHandle.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
        years_experience: Number(yearsExperience) || 0,
      });

      if (res.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        setFeedback({ message: 'Profile details saved and synchronized.', type: 'success' });
        setTimeout(() => {
          onBackToProfile();
        }, 1000);
      }
    } catch {
      setFeedback({ message: 'Failed to save profile changes.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToProfile}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </button>

        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Edit Profile Information
        </h2>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-xs transition-colors"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name / Display Name *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Location / City
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Professional Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Distributed Systems Engineer · Raft & Storage Engines"
            className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            About / Engineering Summary
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your technical architecture experience, verifiable code proofs, and engineering focus..."
            className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Engineering Track
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="distributed-systems">Distributed Systems Engineering</option>
              <option value="cloud-platform">Cloud Native & Infrastructure</option>
              <option value="ai-ml-infra">AI / LLM Serving Infrastructure</option>
              <option value="security-systems">Security & Systems Programming (Rust/C++)</option>
              <option value="frontend-systems">Frontend & Design Engineering</option>
              <option value="data-engineering">Data Platform & Streaming (Kafka/Flink)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="40"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value))}
              className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Public Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Handle</span>
            </label>
            <input
              type="text"
              value={githubHandle}
              onChange={(e) => setGithubHandle(e.target.value)}
              placeholder="e.g. alexvance-eng"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Portfolio / Personal Site</span>
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://alexvance.dev"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onBackToProfile}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
