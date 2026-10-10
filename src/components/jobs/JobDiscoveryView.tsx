import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Mic,
  ArrowRight,
  Send,
  Layers,
  Building2,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { jobService, JobFilterParams } from '../../services/jobService';
import { careerTwinService } from '../../services/careerTwinService';
import { resumeService } from '../../services/resumeService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Job,
  TwinMatchBreakdown,
  CandidateSkill,
  CandidateProject,
  ResumeRecord,
  RemoteType,
  ExperienceLevel,
} from '../../types/database';
import { VoiceCoachModal } from '../voice/VoiceCoachModal';

export interface JobDiscoveryViewProps {
  onNavigateToApplications?: () => void;
  onNavigateToResumeStudio?: () => void;
}

export const JobDiscoveryView: React.FC<JobDiscoveryViewProps> = ({
  onNavigateToApplications,
  onNavigateToResumeStudio,
}) => {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [candidateSkills, setCandidateSkills] = useState<CandidateSkill[]>([]);
  const [candidateProjects, setCandidateProjects] = useState<CandidateProject[]>([]);
  const [candidateResumes, setCandidateResumes] = useState<ResumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedRemote, setSelectedRemote] = useState<RemoteType | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | 'all'>('all');
  const [minSalary, setMinSalary] = useState<number>(0);
  const [sortByMatch, setSortByMatch] = useState<boolean>(true);

  // Selected job for detail modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  // Job for application modal
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverNote, setCoverNote] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Voice coach state
  const [voiceCoachOpen, setVoiceCoachOpen] = useState(false);
  const [voiceCoachJob, setVoiceCoachJob] = useState<Job | null>(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load jobs and candidate data
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allJobs = await jobService.getJobs();
      setJobs(allJobs);

      if (user) {
        // Load saved jobs safely
        try {
          const saved = await jobService.getSavedJobIds(user.id);
          setSavedJobIds(saved);
        } catch (err) {
          console.warn('[RYVOLT] Saved jobs notice:', err);
        }

        // Load candidate skills & projects for live twin matching safely
        try {
          const [skills, projects, resumes] = await Promise.all([
            careerTwinService.getSkills(user.id),
            careerTwinService.getProjects(user.id),
            resumeService.getResumes(user.id),
          ]);
          setCandidateSkills(skills);
          setCandidateProjects(projects);
          setCandidateResumes(resumes);
          if (resumes.length > 0) {
            setSelectedResumeId(resumes[0].id);
          }
        } catch (err) {
          console.warn('[RYVOLT] Live twin match data notice:', err);
        }
      }
    } catch (e: any) {
      console.error('Error loading jobs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter & sort jobs
  const filteredJobs = jobs
    .filter((job) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q) ||
          job.required_skills.some((s) => s.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (selectedDept !== 'all' && job.department !== selectedDept) return false;
      if (selectedRemote !== 'all' && job.remote_type !== selectedRemote) return false;
      if (selectedLevel !== 'all' && job.experience_level !== selectedLevel) return false;
      if (minSalary > 0 && job.salary_max < minSalary) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortByMatch) {
        const matchA = jobService.calculateTwinMatch(candidateSkills, candidateProjects, a).score;
        const matchB = jobService.calculateTwinMatch(candidateSkills, candidateProjects, b).score;
        return matchB - matchA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleToggleSave = async (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      setFeedback({ type: 'error', message: 'Sign in to bookmark opportunities.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const isNowSaved = await jobService.toggleSaveJob(user.id, jobId);
    if (isNowSaved) {
      setSavedJobIds((prev) => [...prev, jobId]);
      setFeedback({ type: 'success', message: 'Requisition saved to bookmarks.' });
    } else {
      setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
      setFeedback({ type: 'success', message: 'Requisition removed from bookmarks.' });
    }
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleOpenApplyModal = (job: Job, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      setFeedback({ type: 'error', message: 'Please sign in to submit applications.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setApplyingJob(job);
    setCoverNote('');
  };

  const handleSubmitApplication = async () => {
    if (!user || !applyingJob) return;

    setIsSubmittingApp(true);
    try {
      const matchBreakdown = jobService.calculateTwinMatch(
        candidateSkills,
        candidateProjects,
        applyingJob
      );

      await jobService.submitApplication({
        userId: user.id,
        jobId: applyingJob.id,
        resumeId: selectedResumeId || null,
        coverLetter: coverNote || null,
        matchScore: matchBreakdown.score,
        jobTitle: applyingJob.title,
        companyName: applyingJob.company,
      });

      setApplyingJob(null);
      setFeedback({
        type: 'success',
        message: `Application submitted for ${applyingJob.title}! Track status in Applications.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to submit application.' });
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const departments = [
    'all',
    'Infrastructure',
    'Machine Learning',
    'Product Engineering',
    'Platform Ops',
    'Security & Cryptography',
    'Design Engineering',
    'Data Engineering',
    'Robotics',
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Career Twin Skill Indexing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Discover Opportunities Matched to Real Code Evidence
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Every position is scored deterministically against your Career Twin competencies and verified code artifacts. Zero keyword guessing.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{jobs.length} Verified Requisitions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Transparent Evidence Criteria</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Live Twin Match Scoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.message.includes('Applications') && onNavigateToApplications && (
            <button
              onClick={onNavigateToApplications}
              className="font-bold underline text-emerald-700 hover:text-emerald-800 cursor-pointer ml-3"
            >
              View Tracker →
            </button>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, required technologies (e.g. Raft, Rust, PyTorch, Go), or companies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Filter Chips & Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Department Dropdown */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'all' ? 'All Departments' : d}
                </option>
              ))}
            </select>

            {/* Remote Filter */}
            <select
              value={selectedRemote}
              onChange={(e) => setSelectedRemote(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Workplaces</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-Site</option>
            </select>

            {/* Experience Level */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Seniority</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="principal">Principal</option>
            </select>

            {/* Min Salary Filter */}
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={0}>Any Compensation</option>
              <option value={150000}>$150k+ Max</option>
              <option value={180000}>$180k+ Max</option>
              <option value={200000}>$200k+ Max</option>
            </select>
          </div>

          {/* Sort Toggle: Career Twin Match */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortByMatch(!sortByMatch)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sortByMatch
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rank by Career Twin Match</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count & Voice Coach Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-900">{filteredJobs.length}</span> positions
          {sortByMatch && ' · Ordered by your Career Twin alignment'}
        </div>

        {/* Global Voice Coach Button */}
        <button
          onClick={() => {
            setVoiceCoachJob(null);
            setVoiceCoachOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-cyan-300 border border-slate-700 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Practice Interview with Voice AI</span>
        </button>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Indexing technical requisitions and matching Career Twin...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No positions matched your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try loosening salary, department, or keyword search criteria to explore more verified requisitions.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedDept('all');
              setSelectedRemote('all');
              setSelectedLevel('all');
              setMinSalary(0);
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => {
            const isSaved = savedJobIds.includes(job.id);
            const match = jobService.calculateTwinMatch(candidateSkills, candidateProjects, job);

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:border-indigo-400/80 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Left: Job Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between md:justify-start gap-4">
                    {/* Company Logo or Fallback */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {job.company_logo ? (
                        <img
                          src={job.company_logo}
                          alt={job.company}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider">
                          {job.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                        <span className="font-semibold text-slate-800">{job.company}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location} ({job.remote_type})
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium text-slate-900">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Required Skills & Alignment Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {job.required_skills.slice(0, 5).map((skill) => {
                      const isCovered = match.matchedRequired.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 ${
                            isCovered
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                          }`}
                        >
                          {isCovered && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {skill}
                        </span>
                      );
                    })}
                    {job.required_skills.length > 5 && (
                      <span className="text-[11px] text-slate-400 px-1">
                        +{job.required_skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Career Twin Match & Actions */}
                <div className="md:w-64 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Match Score Badge */}
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Twin Match:</span>
                      <span
                        className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg border ${
                          match.score >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : match.score >= 60
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {match.score}% {match.matchLevel}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 hidden md:block">
                      {match.matchedRequired.length}/{job.required_skills.length} required verified
                      {match.evidenceBonus > 0 && ` · +${match.evidenceBonus}% evidence`}
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleSave(job.id, e)}
                      title={isSaved ? 'Remove bookmark' : 'Bookmark position'}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleOpenApplyModal(job, e)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      className="shadow-sm shadow-indigo-900/10"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* JOB DETAILS DRAWER / MODAL */}
      {/* ==================================================================== */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                  {selectedJob.company_logo ? (
                    <img
                      src={selectedJob.company_logo}
                      alt={selectedJob.company}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedJob.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-900">{selectedJob.company}</span>
                    <span>·</span>
                    <span>{selectedJob.location} ({selectedJob.remote_type})</span>
                    <span>·</span>
                    <span className="font-bold text-emerald-700">
                      ${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max.toLocaleString()}
                    </span>
                    {selectedJob.equity && (
                      <>
                        <span>·</span>
                        <span className="text-indigo-600 font-medium">Equity: {selectedJob.equity}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Career Twin Match Analysis Card */}
              {(() => {
                const match = jobService.calculateTwinMatch(
                  candidateSkills,
                  candidateProjects,
                  selectedJob
                );
                return (
                  <div className="bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {match.score}%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Career Twin Fit: {match.matchLevel}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Objective analysis based on your saved profile competencies
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setVoiceCoachJob(selectedJob);
                          setVoiceCoachOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-cyan-300 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Voice Coach Prep</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100">
                      {match.feedback}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
                          Verified Matches ({match.matchedRequired.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.matchedRequired.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[11px] font-medium"
                            >
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                          Missing Requirements ({match.missingRequired.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.missingRequired.length > 0 ? (
                            match.missingRequired.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              All required skills verified!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Role Overview
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              {/* Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Core Responsibilities
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                    {selectedJob.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Candidate Profile & Requirements
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                    {selectedJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Verifiable Evidence Criteria */}
              {selectedJob.evidence_criteria && selectedJob.evidence_criteria.length > 0 && (
                <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Artifact Evidence Expectations
                    </h4>
                  </div>
                  <div className="space-y-2 pt-1">
                    {selectedJob.evidence_criteria.map((ec, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200/80"
                      >
                        <span className="text-slate-800 font-medium">{ec.label}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 uppercase">
                          {ec.weight} Weight
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={(e) => handleToggleSave(selectedJob.id, e)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                {savedJobIds.includes(selectedJob.id) ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-amber-600" />
                    <span>Saved in Bookmarks</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    <span>Bookmark Role</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const job = selectedJob;
                    setSelectedJob(null);
                    handleOpenApplyModal(job);
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Apply to Requisition
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ONE-CLICK APPLICATION MODAL */}
      {/* ==================================================================== */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submit Application
                </h3>
                <p className="text-xs text-slate-500">
                  {applyingJob.title} · {applyingJob.company}
                </p>
              </div>
              <button
                onClick={() => setApplyingJob(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 text-xs">
              {/* Live Match Summary */}
              {(() => {
                const match = jobService.calculateTwinMatch(
                  candidateSkills,
                  candidateProjects,
                  applyingJob
                );
                return (
                  <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-indigo-950">
                        {match.score}% Career Twin Fit
                      </div>
                      <div className="text-[11px] text-indigo-700">
                        {match.matchedRequired.length} verified competencies will be shared with the hiring team.
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase">
                      {match.matchLevel}
                    </span>
                  </div>
                );
              })()}

              {/* Resume Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Select Resume Version from Resume Studio
                </label>
                {candidateResumes.length > 0 ? (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {candidateResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.target_role}) {r.is_primary ? '· Primary' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1.5">
                    <p>No customized resume synthesized yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Your Career Twin profile snapshot will be attached automatically.
                    </p>
                    {onNavigateToResumeStudio && (
                      <button
                        type="button"
                        onClick={() => {
                          setApplyingJob(null);
                          onNavigateToResumeStudio();
                        }}
                        className="text-indigo-600 font-bold underline cursor-pointer text-xs"
                      >
                        Launch Resume Studio to create tailored resume →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Note */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Message or Artifact Highlights for Hiring Manager (Optional)
                </label>
                <textarea
                  rows={4}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Highlight specific verified repository links, system architecture choices, or benchmarks relevant to this role..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transparent Candidate Protection</span>
                </div>
                <p>
                  Your verified commits, test fixtures, and project proof will be delivered directly to the engineering team queue with timestamped verification records.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApplyingJob(null)}
                disabled={isSubmittingApp}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitApplication}
                isLoading={isSubmittingApp}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Application
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Coach Modal */}
      <VoiceCoachModal
        isOpen={voiceCoachOpen}
        onClose={() => setVoiceCoachOpen(false)}
        initialJob={voiceCoachJob}
        context={{
          targetRole: voiceCoachJob?.title || 'Senior Distributed Systems Engineer',
          candidateSkills: candidateSkills.map((s) => s.name),
          jobTitle: voiceCoachJob?.title,
          companyName: voiceCoachJob?.company,
          jobRequirements: voiceCoachJob?.requirements,
        }}
      />
    </div>
  );
};
