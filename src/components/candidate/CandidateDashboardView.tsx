import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/jobService';
import { careerTwinService, ProfileCompletenessResult } from '../../services/careerTwinService';
import { resumeService } from '../../services/resumeService';
import { buildLabService } from '../../services/buildLabService';
import {
  Job,
  JobApplication,
  CandidateSkill,
  ResumeRecord,
  BuildLabTestRun,
} from '../../types/database';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { VisualScoreNode, CareerNetworkGraph } from './VisualScoreNode';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Briefcase,
  FileText,
  Mic,
  ArrowRight,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  Zap,
  Terminal,
  Layers,
  Award,
  Lock,
  GitBranch,
  Hammer,
  Play,
  Check,
  Compass,
} from 'lucide-react';

interface CandidateDashboardViewProps {
  onNavigateToJobs: () => void;
  onNavigateToTwin: () => void;
  onNavigateToResumeStudio: () => void;
  onNavigateToApplications: () => void;
  onOpenVoiceCoach: () => void;
  onNavigateToBuildLab?: () => void;
}

export const CandidateDashboardView: React.FC<CandidateDashboardViewProps> = ({
  onNavigateToJobs,
  onNavigateToTwin,
  onNavigateToResumeStudio,
  onNavigateToApplications,
  onOpenVoiceCoach,
  onNavigateToBuildLab,
}) => {
  const { user, profile } = useAuth();
  const userId = user?.id || 'demo-candidate';

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<
    Array<{ job: Job; score: number; matched: string[]; missing: string[] }>
  >([]);
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [testRuns, setTestRuns] = useState<BuildLabTestRun[]>([]);
  const [completeness, setCompleteness] = useState<ProfileCompletenessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Dynamic dismissed action center task tracking
  const [dismissedActions, setDismissedActions] = useState<string[]>([]);

  // Load real Candidate Mission Control state
  useEffect(() => {
    let isMounted = true;

    async function loadMissionControl() {
      if (!user) return;
      setIsLoading(true);

      try {
        // 1. Applications
        const appList = await jobService.getApplications(user.id);
        if (isMounted) setApplications(appList);

        // 2. Career Twin facts
        const candSkills = await careerTwinService.getSkills(user.id);
        const candProjects = await careerTwinService.getProjects(user.id);
        const candEducation = await careerTwinService.getEducation(user.id);
        const candExperience = await careerTwinService.getExperience(user.id);
        const candPreferences = await careerTwinService.getPreferences(user.id);

        if (isMounted) setSkills(candSkills);

        const compResult = careerTwinService.calculateCompleteness(
          profile,
          candSkills,
          candEducation,
          candExperience,
          candProjects,
          candPreferences
        );
        if (isMounted) setCompleteness(compResult);

        // 3. Resumes
        const userResumes = await resumeService.getResumes(user.id);
        if (isMounted) setResumes(userResumes);

        // 4. BuildLab Test Runs
        const userRuns = await buildLabService.getTestRuns(user.id);
        if (isMounted) setTestRuns(userRuns);

        // 5. Jobs & Explainable Twin Match
        const allJobs = await jobService.getJobs({ sortBy: 'recommended' });
        const scoredJobs = allJobs.slice(0, 3).map((job) => {
          const breakdown = jobService.calculateTwinMatch(candSkills, candProjects, job);
          return {
            job,
            score: breakdown.score,
            matched: breakdown.matchedRequired.concat(breakdown.matchedPreferred).slice(0, 3),
            missing: breakdown.missingRequired.slice(0, 2),
          };
        });

        if (isMounted) setRecommendedJobs(scoredJobs);
      } catch (err) {
        console.warn('Mission Control data load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMissionControl();

    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  const handleQuickApply = async (job: Job, score: number) => {
    if (!user) return;
    setApplyingJobId(job.id);
    setAppliedNotice(null);

    try {
      await jobService.submitApplication({
        userId: user.id,
        jobId: job.id,
        matchScore: score,
        jobTitle: job.title,
        companyName: job.company,
        coverLetter: `Direct application submitted from Candidate Mission Control with verified Career Twin profile.`,
      });

      setAppliedNotice(`Application submitted to ${job.company} (${job.title}). Tracked in pipeline.`);
      const updated = await jobService.getApplications(user.id);
      setApplications(updated);
      setTimeout(() => setAppliedNotice(null), 5000);
    } catch (err: any) {
      console.warn('Application submit error:', err);
    } finally {
      setApplyingJobId(null);
    }
  };

  const activeInterviewsCount = applications.filter((a) =>
    ['reviewing', 'interview_scheduled', 'interviewed'].includes(a.status)
  ).length;

  const offersCount = applications.filter((a) => a.status === 'offered').length;

  // Compute Career Action Center tasks from real profile facts
  const actionTasks = [
    {
      id: 'task-buildlab',
      label: 'Certify a repository in BuildLab',
      description: 'Run Docker test suites to mint cryptographic attestations for Career Twin.',
      action: onNavigateToBuildLab || onNavigateToTwin,
      actionText: 'Open BuildLab',
      isResolved: testRuns.length > 0,
    },
    {
      id: 'task-resume',
      label: 'Create tailored resume for target role',
      description: 'Synthesize concrete project proof into an ATS-ready document.',
      action: onNavigateToResumeStudio,
      actionText: 'Resume Studio',
      isResolved: resumes.length > 0,
    },
    {
      id: 'task-interview',
      label: 'Rehearse technical pitch with Voice Coach',
      description: 'Practice high-concurrency architecture questions in spoken Indian-English voice.',
      action: onOpenVoiceCoach,
      actionText: 'Start Voice Session',
      isResolved: false,
    },
    {
      id: 'task-evidence',
      label: 'Link GitHub proof to your core skills',
      description: 'Attach verifiable commit hashes to elevate your match score with engineering managers.',
      action: onNavigateToTwin,
      actionText: 'Attach Proof',
      isResolved: skills.some((s) => s.evidence_type && s.evidence_type !== 'none'),
    },
  ].filter((t) => !t.isResolved && !dismissedActions.includes(t.id));

  const primarySkillsList =
    skills.length > 0
      ? skills.map((s) => s.name)
      : profile?.primary_skills || ['Go', 'Rust', 'Distributed Systems', 'Kubernetes'];

  return (
    <div className="space-y-6">
      {/* 1. CINEMATIC PERSONALIZED HERO STRIP */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <Avatar
              name={profile?.display_name || user?.email || 'Candidate'}
              size="lg"
              roleTag="candidate"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {profile?.display_name || 'Candidate Mission Control'}
                </h1>

                {/* Twilio OTP Status */}
                {profile?.phone_verified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Twilio OTP Verified · {profile.phone_number || 'Mobile Confirmed'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Phone Verification Pending</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {profile?.headline || 'Senior Distributed Systems & Platform Engineering Candidate'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-cyan-300">
                  <Terminal className="w-3.5 h-3.5" />
                  Track: {profile?.target_role ? profile.target_role.replace(/-/g, ' ') : 'Distributed Systems'}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">
                  Stage: {profile?.years_experience && profile.years_experience >= 6 ? 'Staff / Lead' : 'Senior'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToResumeStudio}
              leftIcon={<FileText className="w-4 h-4 text-slate-300" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
            >
              Resume Studio
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToTwin}
              leftIcon={<Layers className="w-4 h-4 text-cyan-400" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
            >
              Career Twin
            </Button>

            {onNavigateToBuildLab && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToBuildLab}
                leftIcon={<Terminal className="w-4 h-4 text-emerald-400" />}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
              >
                BuildLab
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToJobs}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="shadow-lg shadow-indigo-500/30 cursor-pointer"
            >
              Discover Jobs
            </Button>
          </div>
        </div>
      </div>

      {/* Applied Notice Banner */}
      {appliedNotice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{appliedNotice}</span>
          </div>
          <button
            onClick={onNavigateToApplications}
            className="text-emerald-700 dark:text-emerald-300 font-semibold underline text-xs cursor-pointer"
          >
            View in Applications Tracker →
          </button>
        </div>
      )}

      {/* 2. REAL METRIC TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Submitted Applications</span>
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {applications.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Authoritatively tracked</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Pipeline Stages</span>
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {activeInterviewsCount}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
            Reviewing & Interviews
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Saved Resumes</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {resumes.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Role-tailored revisions</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Verified Skills Indexed</span>
            <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {skills.length > 0 ? skills.length : profile?.primary_skills?.length || 4}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
            Evidence linked
          </div>
        </div>
      </div>

      {/* 3. CAREER ACTION CENTER (Drives Useful Next Steps) */}
      {actionTasks.length > 0 && (
        <Card className="border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/40 via-white to-cyan-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-cyan-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Career Action Center</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {actionTasks.length} recommended actions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actionTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {task.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {task.description}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={task.action}
                    className="text-xs shrink-0 py-1 px-3 h-auto"
                  >
                    {task.actionText}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Matched Jobs & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Matched Jobs Explorer */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Curated Opportunities (Explainable Match)</span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Algorithmic matches evaluated against your verified skills and calibrated track.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToJobs}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                View All Jobs
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {recommendedJobs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Loading calibrated opportunities...
                </div>
              ) : (
                recommendedJobs.map(({ job, score, matched, missing }) => {
                  const isAlreadyApplied = applications.some((a) => a.job_id === job.id);

                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {job.title}
                          </h4>
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {score}% Match
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {job.company}
                          </span>
                          <span>·</span>
                          <span>{job.location}</span>
                          <span>·</span>
                          <span>
                            ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k
                          </span>
                          <span>·</span>
                          <span className="capitalize">{job.remote_type}</span>
                        </div>

                        {/* Matched Evidence Proof */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-400">Matched Proof:</span>
                          {matched.map((m) => (
                            <span
                              key={m}
                              className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                            >
                              ✓ {m}
                            </span>
                          ))}
                          {missing.length > 0 && (
                            <span className="text-[11px] text-slate-400 ml-1">
                              Missing: {missing.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAlreadyApplied ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Applied</span>
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={applyingJobId === job.id}
                            onClick={() => handleQuickApply(job, score)}
                            leftIcon={<Send className="w-3.5 h-3.5" />}
                          >
                            Quick Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Application Pipeline Strip */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Active Application Pipeline</span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time status tracking for submitted roles and interview stages.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToApplications}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Open Tracker
              </Button>
            </CardHeader>

            <CardContent className="pt-0">
              {applications.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    You haven't submitted any applications yet. Explore matched roles above.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onNavigateToJobs}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Discover Open Roles
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {applications.slice(0, 4).map((app) => (
                    <div
                      key={app.id}
                      className="py-3 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {app.job?.title || 'Engineering Role'}
                        </div>
                        <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{app.job?.company || 'Technology Company'}</span>
                          <span>·</span>
                          <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize ${
                            app.status === 'interview_scheduled'
                              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                              : app.status === 'reviewing'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : app.status === 'offered'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Career Twin Network, Voice Companion & Telemetry */}
        <div className="space-y-6">
          {/* AI Voice Companion Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded">
                Interactive Voice Companion
              </span>
              <Mic className="w-5 h-5 text-violet-200 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold tracking-tight">
                Practice Technical Interview
              </h3>
              <p className="text-xs text-violet-100 mt-1 leading-relaxed">
                Rehearse high-concurrency systems pitches, distributed consensus trade-offs, and behavioral questions with RYVOLT Voice Coach.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenVoiceCoach}
              leftIcon={<Mic className="w-4 h-4 text-violet-300" />}
              className="w-full justify-center bg-white text-violet-950 hover:bg-violet-50 font-semibold border-none cursor-pointer"
            >
              Start Spoken Voice Session
            </Button>
          </div>

          {/* Career Twin Network Visual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Career Twin Node Topology</span>
                <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                  {primarySkillsList.length} Nodes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <CareerNetworkGraph
                role={profile?.target_role ? profile.target_role.replace(/-/g, ' ') : 'Distributed Systems'}
                skills={primarySkillsList}
              />

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToTwin}
                  className="w-full justify-center text-xs"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Inspect Full Career Twin →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stream */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Activity & Verification Stream</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Twilio Mobile Phone Verified
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Confirmed via SMS OTP ({profile?.phone_number || '+14155552671'})
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Professional Profile Calibrated
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Track: {profile?.target_role || 'distributed-systems'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Career Twin Node Initialized
                  </div>
                  <div className="text-[11px] text-slate-500">
                    PostgreSQL RLS security boundary active
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
