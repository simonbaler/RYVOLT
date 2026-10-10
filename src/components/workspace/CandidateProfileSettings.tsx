import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { CheckCircle2, AlertCircle, Save, LogOut, KeyRound, Shield, Clock, User, Zap, Building2, Send } from 'lucide-react';
import { IntegrationsSettingsView } from '../integrations/IntegrationsSettingsView';
import { adminService } from '../../services/adminService';
import { audioService } from '../../lib/audioService';

export const CandidateProfileSettings: React.FC = () => {
  const { user, profile, roles, updateProfile, signOut, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'recruiter-access'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [targetRole, setTargetRole] = useState('distributed-systems');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recruiter access request form state
  const [reqFullName, setReqFullName] = useState('');
  const [reqWorkEmail, setReqWorkEmail] = useState('');
  const [reqCompanyName, setReqCompanyName] = useState('');
  const [reqWebsite, setReqWebsite] = useState('');
  const [reqJobTitle, setReqJobTitle] = useState('');
  const [reqTeamSize, setReqTeamSize] = useState('10-50');
  const [reqUseCase, setReqUseCase] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSubmittedSuccess, setReqSubmittedSuccess] = useState(false);


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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        display_name: displayName.trim(),
        headline: headline.trim(),
        location: location.trim() || null,
        target_role: targetRole,
        onboarding_completed: true,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Profile saved and synced with PostgreSQL.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRecruiterAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName.trim() || !reqWorkEmail.trim() || !reqCompanyName.trim()) return;

    setReqSubmitting(true);
    try {
      const res = await adminService.submitRecruiterAccessRequest({
        fullName: reqFullName.trim(),
        workEmail: reqWorkEmail.trim(),
        companyName: reqCompanyName.trim(),
        companyWebsite: reqWebsite.trim() || undefined,
        jobTitle: reqJobTitle.trim() || undefined,
        teamSize: reqTeamSize,
        useCase: reqUseCase.trim() || undefined,
      });

      if (res.success) {
        audioService.playSubmitSuccess();
        setReqSubmittedSuccess(true);
      }
    } finally {
      setReqSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            name={profile?.display_name || user?.email || 'Candidate'}
            size="lg"
            roleTag="candidate"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {profile?.display_name || 'Candidate Profile'}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{user?.email || 'Demo Session'}</span>
              <span>·</span>
              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Roles: [{roles.join(', ')}]
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Target Track</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'integrations'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          <span>Telegram & n8n Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('recruiter-access')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'recruiter-access'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-cyan-500" />
          <span>Employer / Recruiter Access</span>
        </button>
      </div>

      {activeTab === 'integrations' ? (
        <IntegrationsSettingsView />
      ) : activeTab === 'recruiter-access' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <CardTitle>Request Recruiter & Employer Workspace Access</CardTitle>
            </div>
            <CardDescription>
              Are you hiring technical talent or managing engineering teams? Apply for an authorized Recruiter Workspace with candidate discovery and requisition publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reqSubmittedSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Access Application Submitted
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                  Your organization details have been received and routed to the platform governance queue. Once reviewed, your account will be granted the <span className="font-semibold">Recruiter</span> role.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReqSubmittedSuccess(false);
                    setActiveTab('profile');
                  }}
                  className="mt-2 text-xs"
                >
                  Return to Profile Settings
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRecruiterAccess} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqFullName}
                      onChange={(e) => setReqFullName(e.target.value)}
                      placeholder="e.g. Sarah Lin"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={reqWorkEmail}
                      onChange={(e) => setReqWorkEmail(e.target.value)}
                      placeholder="e.g. slin@apexlabs.tech"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqCompanyName}
                      onChange={(e) => setReqCompanyName(e.target.value)}
                      placeholder="e.g. Apex Distributed Labs"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Website
                    </label>
                    <input
                      type="url"
                      value={reqWebsite}
                      onChange={(e) => setReqWebsite(e.target.value)}
                      placeholder="e.g. https://apexlabs.tech"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Hiring Title
                    </label>
                    <input
                      type="text"
                      value={reqJobTitle}
                      onChange={(e) => setReqJobTitle(e.target.value)}
                      placeholder="e.g. Head of Talent Acquisition or Engineering Manager"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Engineering Team Size
                    </label>
                    <select
                      value={reqTeamSize}
                      onChange={(e) => setReqTeamSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="1-10">1-10 engineers (Seed/Early)</option>
                      <option value="10-50">10-50 engineers (Growth)</option>
                      <option value="50-250">50-250 engineers (Scaleup)</option>
                      <option value="250+">250+ engineers (Enterprise)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hiring Scope & Technical Artifact Criteria
                  </label>
                  <textarea
                    rows={3}
                    value={reqUseCase}
                    onChange={(e) => setReqUseCase(e.target.value)}
                    placeholder="Describe the roles you are hiring for and required proof criteria (e.g. Rust distributed systems, Raft consensus benchmarks)..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={reqSubmitting}
                    leftIcon={<Send className="w-4 h-4" />}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Submit Recruiter Application
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Settings Form */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Details & Career Twin Parameters</CardTitle>
              <CardDescription>
                Authoritative candidate metadata stored in Supabase PostgreSQL and governed by Row Level Security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{successMessage}</div>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Chen"
                    required
                  />

                  <Input
                    label="Location / Timezone"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA or Remote"
                  />
                </div>

                <Input
                  label="Professional Headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Senior Infrastructure & Distributed Systems Engineer"
                  helperText="Brief summary of your craft shown to recruiters on matched applications."
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      { value: 'devops-cloud-native', label: 'DevOps & Site Reliability Engineering' },
                    ]}
                    helperText="Determines alignment rubrics in Job Discovery."
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Verified Mobile Identity (Twilio Verify)
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {profile?.phone_number || 'No phone recorded'}
                      </span>
                      {profile?.phone_verified ? (
                        <span className="ml-auto text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          Twilio Verified
                        </span>
                      ) : (
                        <span className="ml-auto text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {profile?.phone_verified_at
                        ? `Confirmed via SMS OTP on ${new Date(profile.phone_verified_at).toLocaleDateString()}`
                        : 'Calibrated during mandatory onboarding flow'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {profile?.updated_at
                        ? `Last updated: ${new Date(profile.updated_at).toLocaleDateString()}`
                        : 'Initial revision'}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security & Access Audit Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Row Level Security Enforcement</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Your profile records can only be read or modified by your authenticated session (<code className="font-mono text-indigo-600">{user?.id?.slice(0, 8)}...</code>). Other candidates are barred from accessing your private account data.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Role Privilege Boundary</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Public users cannot self-assign recruiter or administrator roles. Elevation is restricted to service-role database migrations or authorized administrative grants.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
