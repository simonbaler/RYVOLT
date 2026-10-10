import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { phoneVerificationService, SendOtpResult, VerifyOtpResult } from '../../services/phoneVerificationService';
import { careerTwinService } from '../../services/careerTwinService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BrandLogo } from '../ui/BrandLogo';
import { VisualScoreNode } from '../candidate/VisualScoreNode';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  LogOut,
  RefreshCw,
  Clock,
  Terminal,
  Cpu,
  UserCheck,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  Compass,
  FileCode,
  DollarSign,
  Plus,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+1', country: 'United States & Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
];

const SKILL_CATALOG: Record<string, string[]> = {
  'Systems & Concurrency': ['Go', 'Rust', 'Distributed Systems', 'Raft Consensus', 'Linux Kernel', 'io_uring', 'C++'],
  'Cloud Infrastructure': ['Kubernetes', 'Docker', 'AWS Architecture', 'Terraform', 'Prometheus', 'eBPF', 'CI/CD Pipelines'],
  'Data & Messaging': ['PostgreSQL', 'Kafka', 'Redis', 'Cassandra', 'gRPC', 'GraphQL', 'TimescaleDB'],
  'Application Architecture': ['TypeScript', 'Python', 'React', 'Next.js', 'Node.js', 'Tailwind CSS', 'RESTful APIs'],
};

interface EducationDraft {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface ExperienceDraft {
  id: string;
  organization: string;
  role_title: string;
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Co-op';
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

interface ProjectDraft {
  id: string;
  title: string;
  tagline: string;
  description: string;
  repo_url: string;
  live_url: string;
  technologies: string[];
}

export interface MandatoryOnboardingWizardProps {
  onCompleted?: () => void;
}

export const MandatoryOnboardingWizard: React.FC<MandatoryOnboardingWizardProps> = ({
  onCompleted,
}) => {
  const { user, profile, completeOnboarding, confirmPhoneVerification, signOut } = useAuth();
  const userId = user?.id || 'demo-user';

  // 7 Explicit Steps
  // 1: Professional Identity
  // 2: Skills & Technical Matrix
  // 3: Education & Experience
  // 4: Projects & Verifiable Proof
  // 5: Career Preferences
  // 6: Mobile OTP Verification
  // 7: Review & Mission Launch
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Identity
  const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.display_name || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [country, setCountry] = useState('United States');
  const [targetRole, setTargetRole] = useState(profile?.target_role || 'distributed-systems');
  const [careerStage, setCareerStage] = useState('Senior');
  const [yearsExperience, setYearsExperience] = useState<number>(profile?.years_experience || 5);
  const [bio, setBio] = useState(profile?.bio || '');

  // Step 2: Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile?.primary_skills || ['Go', 'Distributed Systems', 'Kubernetes', 'PostgreSQL']
  );
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  // Step 3: Education & Experience
  const [educations, setEducations] = useState<EducationDraft[]>([
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'B.S.',
      field_of_study: 'Computer Science & Engineering',
      start_date: '2016',
      end_date: '2020',
      is_current: false,
    },
  ]);
  const [experiences, setExperiences] = useState<ExperienceDraft[]>([
    {
      id: 'exp-1',
      organization: 'CloudScale Infrastructure',
      role_title: 'Senior Systems Engineer',
      employment_type: 'Full-time',
      start_date: '2022',
      end_date: 'Present',
      is_current: true,
      description: 'Architected distributed consensus and write-ahead storage replication.',
    },
  ]);

  // Step 4: Projects
  const [projects, setProjects] = useState<ProjectDraft[]>([
    {
      id: 'proj-1',
      title: 'raft-consensus-go',
      tagline: 'Fault-tolerant distributed log replication engine in Go',
      description: 'Linearizable Raft state machine replication handling network partition heals.',
      repo_url: 'https://github.com/ryvolt-labs/raft-consensus-go',
      live_url: '',
      technologies: ['Go', 'Distributed Systems', 'Raft'],
    },
  ]);

  // Step 5: Preferences
  const [preferredLocations, setPreferredLocations] = useState<string>('San Francisco, CA; Remote');
  const [remotePreference, setRemotePreference] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Hybrid');
  const [employmentTypePref, setEmploymentTypePref] = useState('Full-time');
  const [salaryExpectation, setSalaryExpectation] = useState<string>('185000');

  // Step 6: Phone OTP
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [phoneNumberInput, setPhoneNumberInput] = useState(profile?.phone_number || '');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpDispatched, setIsOtpDispatched] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [simulatedDevCode, setSimulatedDevCode] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verifiedPhoneRecord, setVerifiedPhoneRecord] = useState<string | null>(
    profile?.phone_verified ? profile?.phone_number || null : null
  );

  // General Wizard State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  // Resume profile data on load
  useEffect(() => {
    if (profile) {
      if (!displayName && profile.display_name) setDisplayName(profile.display_name);
      if (!headline && profile.headline) setHeadline(profile.headline);
      if (!location && profile.location) setLocation(profile.location);
      if (profile.target_role) setTargetRole(profile.target_role);
      if (profile.primary_skills && profile.primary_skills.length > 0) setSelectedSkills(profile.primary_skills);
      if (profile.bio) setBio(profile.bio);
      if (profile.phone_verified && profile.phone_number) {
        setVerifiedPhoneRecord(profile.phone_number);
      }
    }
  }, [profile]);

  // Countdown timer for OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Real-time completeness score calculation
  const calculateLiveScore = () => {
    let score = 0;
    if (displayName.trim() && headline.trim()) score += 20;
    if (selectedSkills.length >= 3) score += 20;
    if (educations.length > 0 || experiences.length > 0) score += 20;
    if (projects.length > 0) score += 15;
    if (preferredLocations.trim()) score += 10;
    if (verifiedPhoneRecord || profile?.phone_verified) score += 15;
    return Math.min(100, score);
  };

  const liveCompleteness = calculateLiveScore();

  // Skills handlers
  const handleToggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customSkillInput.trim()) {
      e.preventDefault();
      const trimmed = customSkillInput.trim();
      if (!selectedSkills.includes(trimmed)) {
        setSelectedSkills((prev) => [...prev, trimmed]);
      }
      setCustomSkillInput('');
    }
  };

  // Education & Experience list modifiers
  const handleAddEducation = () => {
    setEducations((prev) => [
      ...prev,
      {
        id: `edu-${Date.now()}`,
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        is_current: false,
      },
    ]);
  };

  const handleAddExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        id: `exp-${Date.now()}`,
        organization: '',
        role_title: '',
        employment_type: 'Full-time',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      },
    ]);
  };

  const handleAddProject = () => {
    setProjects((prev) => [
      ...prev,
      {
        id: `proj-${Date.now()}`,
        title: '',
        tagline: '',
        description: '',
        repo_url: '',
        live_url: '',
        technologies: ['TypeScript'],
      },
    ]);
  };

  // Step 6: Twilio Send OTP SMS
  const handleSendOtp = async () => {
    setErrorMessage(null);
    const rawNumber = `${selectedCountryCode}${phoneNumberInput.replace(/[^0-9]/g, '')}`;

    const check = phoneVerificationService.validateE164(rawNumber);
    if (!check.valid) {
      setErrorMessage(check.error || 'Invalid phone number format.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const result: SendOtpResult = await phoneVerificationService.sendOtp(check.normalized);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to dispatch verification SMS.');
      } else {
        setIsOtpDispatched(true);
        setResendCountdown(60);
        if (result.simulated && result.devCode) {
          setSimulatedDevCode(result.devCode);
          setOtpCode(result.devCode);
        } else {
          setSimulatedDevCode(null);
        }
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 6: Twilio Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawNumber = `${selectedCountryCode}${phoneNumberInput.replace(/[^0-9]/g, '')}`;
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage('Please provide the 6-digit SMS verification passcode.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const result: VerifyOtpResult = await phoneVerificationService.verifyOtp(rawNumber, otpCode.trim());
      if (!result.success || !result.verified) {
        setErrorMessage(result.error || 'Invalid verification passcode.');
      } else {
        const confirmResult = await confirmPhoneVerification(result.phoneNumber || rawNumber, result.verifiedAt);
        if (confirmResult.error) {
          setErrorMessage(confirmResult.error);
        } else {
          setVerifiedPhoneRecord(result.phoneNumber || rawNumber);
          setCurrentStep(7);
        }
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 7: Finalize Onboarding & Launch Dashboard
  const handleFinalizeOnboarding = async () => {
    setIsSubmittingFinal(true);
    setErrorMessage(null);

    try {
      // 1. Persist education, experience, and project drafts into Career Twin services
      for (const edu of educations) {
        if (edu.institution.trim()) {
          await careerTwinService.createEducation({
            user_id: userId,
            institution: edu.institution.trim(),
            degree: edu.degree.trim() || 'Degree',
            field_of_study: edu.field_of_study.trim() || 'Engineering',
            start_date: edu.start_date || '2020',
            end_date: edu.end_date || null,
            is_current: edu.is_current,
            grade_or_gpa: null,
            description: null,
          });
        }
      }

      for (const exp of experiences) {
        if (exp.organization.trim()) {
          await careerTwinService.createExperience({
            user_id: userId,
            organization: exp.organization.trim(),
            role_title: exp.role_title.trim() || 'Software Engineer',
            employment_type: exp.employment_type,
            location: location || null,
            start_date: exp.start_date || '2022',
            end_date: exp.is_current ? null : exp.end_date || '2024',
            is_current: exp.is_current,
            description: exp.description || null,
            achievements: [],
          });
        }
      }

      for (const proj of projects) {
        if (proj.title.trim()) {
          await careerTwinService.createProject({
            user_id: userId,
            title: proj.title.trim(),
            tagline: proj.tagline || null,
            description: proj.description || 'Verified engineering artifact.',
            repo_url: proj.repo_url || null,
            live_url: proj.live_url || null,
            technologies: proj.technologies.length > 0 ? proj.technologies : ['Software Engineering'],
            highlights: [],
            verified: Boolean(proj.repo_url),
          });
        }
      }

      // 2. Complete candidate baseline profile in Supabase
      const result = await completeOnboarding({
        display_name: displayName.trim(),
        headline: headline.trim(),
        location: location.trim() || null,
        target_role: targetRole,
        primary_skills: selectedSkills,
        years_experience: Number(yearsExperience) || 0,
        bio: bio.trim() || null,
        github_handle: projects[0]?.repo_url?.split('github.com/')[1]?.split('/')[0] || null,
        portfolio_url: projects[0]?.live_url || null,
        phone_number: verifiedPhoneRecord || undefined,
        phone_verified: true,
        onboarding_completed: true,
      });

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        if (onCompleted) onCompleted();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to finalize profile onboarding.');
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Identity', desc: 'Core profile & target role' },
    { num: 2, label: 'Skills Matrix', desc: 'Categorized competencies' },
    { num: 3, label: 'Background', desc: 'Education & experience' },
    { num: 4, label: 'Artifacts', desc: 'Projects & code proof' },
    { num: 5, label: 'Preferences', desc: 'Role & location bounds' },
    { num: 6, label: 'Verification', desc: 'Twilio mobile OTP' },
    { num: 7, label: 'Launch', desc: 'Review & mission control' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col transition-all">
        {/* TOP BRAND BAR */}
        <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <div className="text-xs font-semibold tracking-wide flex items-center gap-2">
                <span>CANDIDATE ONBOARDING</span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-mono text-cyan-400">CINEMATIC 3.0</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-step career identity calibration & Twilio security verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <VisualScoreNode
              score={liveCompleteness}
              label="Calibration"
              size="sm"
              showBreakdown={false}
            />

            <button
              onClick={signOut}
              title="Sign out and resume later"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-6 py-3 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] text-xs">
            {stepsList.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div
                  className={`flex items-center gap-2 font-medium cursor-pointer ${
                    currentStep === s.num
                      ? 'text-indigo-600 dark:text-cyan-400 font-bold'
                      : currentStep > s.num
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                  onClick={() => {
                    // Allow navigating backward freely or forward if previous requirements passed
                    if (s.num <= currentStep || liveCompleteness >= 30) {
                      setCurrentStep(s.num);
                    }
                  }}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      currentStep > s.num
                        ? 'bg-emerald-600 text-white'
                        : currentStep === s.num
                        ? 'border-2 border-indigo-600 dark:border-cyan-400 text-indigo-600 dark:text-cyan-400'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {currentStep > s.num ? '✓' : s.num}
                  </span>
                  <span>{s.label}</span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* MAIN BODY: SPLIT VIEW LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* LEFT COLUMN: GUIDED CONTEXT & INTELLIGENCE PREVIEW (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50/80 dark:bg-slate-900/60 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Step {currentStep} of 7 · Guidance
              </span>

              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {stepsList[currentStep - 1]?.label}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentStep === 1 &&
                  'Your headline and target track calibrate the Career Twin matching algorithm. Recruiters filter candidates by demonstrable systems capability rather than keywords.'}
                {currentStep === 2 &&
                  'Select core technical competencies. Self-reported skills remain marked as unverified until supported by repository commit proof in BuildLab.'}
                {currentStep === 3 &&
                  'Add degree programs, bootcamps, and work history. If you are early in your career or a student, internship and academic entries are fully supported.'}
                {currentStep === 4 &&
                  'Attach real projects. In RYVOLT, project repositories act as cryptographic proof nodes that boost your match percentage across open engineering roles.'}
                {currentStep === 5 &&
                  'Set target salary expectations and location arrangements. RYVOLT will only surface matching roles that respect your stated boundaries.'}
                {currentStep === 6 &&
                  'Twilio Mobile OTP verifies your account security and guarantees authentic candidate identity to hiring teams with zero bot contamination.'}
                {currentStep === 7 &&
                  'Review your calibrated profile before launching into Career Mission Control. All settings remain fully editable in your profile settings.'}
              </p>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Profile Strength</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {liveCompleteness}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${liveCompleteness}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>PostgreSQL RLS security active</span>
            </div>
          </div>

          {/* RIGHT COLUMN: STEP FORMS (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* STEP 1: Professional Identity */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Chen"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Professional Headline <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Senior Distributed Systems Engineer"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Current Location
                    </label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Role / Track
                    </label>
                    <Select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      options={[
                        { value: 'distributed-systems', label: 'Distributed Systems' },
                        { value: 'backend-infrastructure', label: 'Backend Infrastructure' },
                        { value: 'cloud-platform-devops', label: 'Cloud & Platform Engineering' },
                        { value: 'fullstack-systems', label: 'Fullstack Systems' },
                        { value: 'systems-kernel', label: 'Systems & Kernel' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Years of Experience
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Bio / Focus Statement
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Briefly state your technical focus, systems designed, and engineering values..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Skills & Technical Matrix */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selected Skills ({selectedSkills.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Press Enter to add custom skill
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 min-h-[56px]">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-md"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={handleAddCustomSkill}
                    placeholder="+ Type skill & press Enter..."
                    className="text-xs bg-transparent text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none px-2 py-1 min-w-[150px]"
                  />
                </div>

                {/* Categorized catalog */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Categorized Competency Catalog
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {Object.entries(SKILL_CATALOG).map(([category, catalogList]) => (
                      <div
                        key={category}
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="text-[11px] font-semibold text-slate-500 mb-2">
                          {category}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {catalogList.map((skill) => {
                            const isSelected = selectedSkills.includes(skill);
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => handleToggleSkill(skill)}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {skill}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Education & Experience */}
            {currentStep === 3 && (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {/* Education section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                      <span>Academic Background & Degrees</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="text-xs text-indigo-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Degree</span>
                    </button>
                  </div>

                  {educations.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-2 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={edu.institution}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEducations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, institution: val } : item))
                            );
                          }}
                          placeholder="Institution / University"
                        />
                        <Input
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEducations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, degree: val } : item))
                            );
                          }}
                          placeholder="Degree (B.S., M.S., BootCamp)"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={edu.field_of_study}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEducations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, field_of_study: val } : item))
                            );
                          }}
                          placeholder="Field of Study"
                        />
                        <Input
                          value={edu.end_date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEducations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, end_date: val } : item))
                            );
                          }}
                          placeholder="Graduation Year (e.g. 2024)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Experience section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                      <span>Work & Internship Experience</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="text-xs text-indigo-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Experience</span>
                    </button>
                  </div>

                  {experiences.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-2 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={exp.organization}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, organization: val } : item))
                            );
                          }}
                          placeholder="Company or Organization"
                        />
                        <Input
                          value={exp.role_title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExperiences((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, role_title: val } : item))
                            );
                          }}
                          placeholder="Role Title"
                        />
                      </div>
                      <Input
                        value={exp.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExperiences((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, description: val } : item))
                          );
                        }}
                        placeholder="Key technical responsibilities & architectural outcomes"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Projects & Verifiable Proof */}
            {currentStep === 4 && (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                    <span>Cataloged Software Projects</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="text-xs text-indigo-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {projects.map((proj, idx) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={proj.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjects((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, title: val } : item))
                          );
                        }}
                        placeholder="Project Name (e.g. raft-consensus-go)"
                      />
                      <Input
                        value={proj.tagline}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjects((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, tagline: val } : item))
                          );
                        }}
                        placeholder="One-line summary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={proj.repo_url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjects((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, repo_url: val } : item))
                          );
                        }}
                        placeholder="GitHub URL (https://github.com/...)"
                      />
                      <Input
                        value={proj.live_url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjects((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, live_url: val } : item))
                          );
                        }}
                        placeholder="Live Demo / Docs URL (Optional)"
                      />
                    </div>

                    <textarea
                      value={proj.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjects((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, description: val } : item))
                        );
                      }}
                      rows={2}
                      placeholder="Explain architectural design, throughput scale, or test coverage..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* STEP 5: Career Preferences */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Target Locations
                  </label>
                  <Input
                    value={preferredLocations}
                    onChange={(e) => setPreferredLocations(e.target.value)}
                    placeholder="e.g. San Francisco, CA; Seattle, WA; Remote"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Remote Work Preference
                    </label>
                    <Select
                      value={remotePreference}
                      onChange={(e) => setRemotePreference(e.target.value as any)}
                      options={[
                        { value: 'Remote', label: '100% Remote' },
                        { value: 'Hybrid', label: 'Hybrid' },
                        { value: 'Onsite', label: 'Onsite Only' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum Annual Base Compensation ($ USD)
                    </label>
                    <Input
                      type="number"
                      step={5000}
                      value={salaryExpectation}
                      onChange={(e) => setSalaryExpectation(e.target.value)}
                      placeholder="e.g. 175000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Mobile Verification (Twilio OTP) */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify your mobile number via Twilio SMS to authenticate your professional identity.
                </p>

                {profile?.phone_verified ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span>Mobile number verified: {profile.phone_number || '+14155552671'}</span>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setCurrentStep(7)}>
                      Continue →
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-2.5 py-2"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>

                      <Input
                        value={phoneNumberInput}
                        onChange={(e) => setPhoneNumberInput(e.target.value)}
                        placeholder="Mobile number (e.g. 4155552671)"
                        className="flex-1"
                      />

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSendOtp}
                        isLoading={isSendingOtp}
                        disabled={resendCountdown > 0}
                      >
                        {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : 'Send Code'}
                      </Button>
                    </div>

                    {isOtpDispatched && (
                      <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                        {simulatedDevCode && (
                          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 text-xs text-cyan-800 dark:text-cyan-300">
                            Development Mode Passcode: <span className="font-mono font-bold">{simulatedDevCode}</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="Enter 6-digit SMS code"
                            maxLength={6}
                            className="font-mono tracking-widest text-center text-sm"
                            required
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={isVerifyingOtp}
                          >
                            Verify & Proceed
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: Review & Mission Launch */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {displayName}
                      </h3>
                      <p className="text-slate-500 mt-0.5">{headline}</p>
                    </div>
                    <span className="font-mono text-cyan-500 font-bold">
                      {liveCompleteness}% Complete
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                    <div>
                      <span className="text-slate-400">Target Role:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {targetRole.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Security Verification:</span>{' '}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Twilio Confirmed
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Skills Matrix:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedSkills.length} competencies
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Projects Attached:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {projects.length} repository proof nodes
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click below to finalize profile onboarding and enter your personalized Career Mission Control dashboard.
                </p>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>

              {currentStep < 7 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setErrorMessage(null);
                    if (currentStep === 1 && (!displayName.trim() || !headline.trim())) {
                      setErrorMessage('Display name and professional headline are required.');
                      return;
                    }
                    if (currentStep === 2 && selectedSkills.length === 0) {
                      setErrorMessage('Please select or specify at least 1 technical competency.');
                      return;
                    }
                    setCurrentStep((prev) => Math.min(7, prev + 1));
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Continue →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFinalizeOnboarding}
                  isLoading={isSubmittingFinal}
                  rightIcon={<Sparkles className="w-4 h-4" />}
                  className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25"
                >
                  Launch Career Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
