import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  DollarSign,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Eye,
  Pause,
  Play,
  XCircle,
  Edit3,
  Search,
  Filter,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService } from '../../services/recruiterService';
import { Job, Organization, RemoteType, ExperienceLevel, EmploymentType, JobStatus } from '../../types/database';
import { audioService } from '../../lib/audioService';

interface PostJobViewProps {
  onJobPublished?: (job: Job) => void;
  onNavigateToPipeline?: () => void;
}

export const PostJobView: React.FC<PostJobViewProps> = ({
  onJobPublished,
  onNavigateToPipeline,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [recruiterJobs, setRecruiterJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobSearch, setJobSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('Nexus Cloud Fabric');
  const [organizationId, setOrganizationId] = useState<string>('org-1');
  const [department, setDepartment] = useState('Distributed Systems');
  const [location, setLocation] = useState('San Francisco, CA');
  const [remoteType, setRemoteType] = useState<RemoteType>('remote');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('senior');
  const [salaryMin, setSalaryMin] = useState(165000);
  const [salaryMax, setSalaryMax] = useState(220000);
  const [equity, setEquity] = useState('0.15% - 0.35%');
  const [description, setDescription] = useState(
    'Architect resilient, fault-tolerant consensus systems and state-machine replication layers. Responsible for benchmarking p99 latency under Linux kernel io_uring, developing deterministic chaos tests, and leading systems scalability initiatives.'
  );

  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    'Rust',
    'Distributed Systems',
    'Linux',
    'Docker',
    'Raft',
  ]);
  const [skillInput, setSkillInput] = useState('');

  const [preferredSkills, setPreferredSkills] = useState<string[]>([
    'io_uring',
    'eBPF',
    'gRPC',
    'Kubernetes',
  ]);
  const [preferredInput, setPreferredInput] = useState('');

  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Design and verify distributed Raft replication protocols with formal test matrices',
    'Profile and optimize Linux kernel socket memory buffers and lock-free data structures',
    'Participate in architecture reviews for tier-0 storage and high-throughput ingestion pipelines',
  ]);
  const [respInput, setRespInput] = useState('');

  const [evidenceCriteriaLabel, setEvidenceCriteriaLabel] = useState(
    'Production-grade systems repository with unit & fuzz testing benchmarks'
  );

  const [submitting, setSubmitting] = useState(false);
  const [successJob, setSuccessJob] = useState<Job | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      const data = await recruiterService.getRecruiterJobs('recruiter-active');
      setRecruiterJobs(data);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    async function loadOrgs() {
      const orgs = await recruiterService.getOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0 && !company) {
        setCompany(orgs[0].name);
        setOrganizationId(orgs[0].id);
      }
    }
    loadOrgs();
  }, []);

  const handleStatusChange = async (jobId: string, nextStatus: JobStatus) => {
    audioService.playClick();
    const success = await recruiterService.updateJobStatus(jobId, nextStatus);
    if (success) {
      setRecruiterJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: nextStatus } : j))
      );
      setNotice(`Requisition status updated to "${nextStatus}".`);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleStartEdit = (job: Job) => {
    setEditingJobId(job.id);
    setTitle(job.title);
    setCompany(job.company);
    setDepartment(job.department || 'Engineering');
    setLocation(job.location || 'Remote');
    setRemoteType(job.remote_type || 'remote');
    setEmploymentType(job.employment_type || 'Full-time');
    setExperienceLevel(job.experience_level || 'senior');
    setSalaryMin(job.salary_min || 150000);
    setSalaryMax(job.salary_max || 200000);
    setEquity(job.equity || '');
    setDescription(job.description || '');
    setRequiredSkills(job.required_skills || []);
    setPreferredSkills(job.preferred_skills || []);
    setResponsibilities(job.responsibilities || []);
    setActiveTab('create');
    audioService.playClick();
  };

  const resetForm = () => {
    setEditingJobId(null);
    setTitle('');
    setDescription('');
    setRequiredSkills(['Rust', 'Distributed Systems', 'Linux']);
    setPreferredSkills(['Kubernetes', 'gRPC']);
    setResponsibilities(['Build scalable system components with verifiable test matrices']);
  };

  const handleAddSkill = (type: 'required' | 'preferred') => {
    if (type === 'required' && skillInput.trim()) {
      if (!requiredSkills.includes(skillInput.trim())) {
        setRequiredSkills([...requiredSkills, skillInput.trim()]);
      }
      setSkillInput('');
    } else if (type === 'preferred' && preferredInput.trim()) {
      if (!preferredSkills.includes(preferredInput.trim())) {
        setPreferredSkills([...preferredSkills, preferredInput.trim()]);
      }
      setPreferredInput('');
    }
  };

  const handleRemoveSkill = (skill: string, type: 'required' | 'preferred') => {
    if (type === 'required') {
      setRequiredSkills(requiredSkills.filter((s) => s !== skill));
    } else {
      setPreferredSkills(preferredSkills.filter((s) => s !== skill));
    }
  };

  const handleAddResp = () => {
    if (respInput.trim()) {
      setResponsibilities([...responsibilities, respInput.trim()]);
      setRespInput('');
    }
  };

  const handleRemoveResp = (idx: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const created = await recruiterService.postJob('recruiter-active', {
        id: editingJobId || undefined,
        title: title.trim(),
        company,
        organization_id: organizationId,
        department,
        location,
        remote_type: remoteType,
        employment_type: employmentType,
        experience_level: experienceLevel,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        salary_currency: 'USD',
        equity,
        description: description.trim(),
        responsibilities,
        requirements: [
          `Solid background in ${requiredSkills.slice(0, 3).join(', ')}`,
          'Commitment to writing deterministic tests and verifying system constraints',
        ],
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        evidence_criteria: [
          {
            type: 'project',
            label: evidenceCriteriaLabel || 'Verified technical repository with demonstrable test coverage',
            weight: 'high',
          },
        ],
        status: 'published',
      });

      audioService.playSubmitSuccess();
      setSuccessJob(created);
      loadJobs();
      if (onJobPublished) onJobPublished(created);
    } catch (err) {
      console.error('Failed to post job:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (successJob) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {editingJobId ? 'Requisition Updated Successfully' : 'Requisition Published Successfully'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
          Your technical opportunity for <span className="font-semibold text-slate-800 dark:text-slate-200">{successJob.title}</span> at <span className="font-semibold text-slate-800 dark:text-slate-200">{successJob.company}</span> is now published and indexed on the Career Twin discovery graph.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-left mb-6 max-w-md mx-auto space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Requisition ID:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{successJob.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Department:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{successJob.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Compensation:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              ${successJob.salary_min.toLocaleString()} – ${successJob.salary_max.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Required Proof:</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{successJob.required_skills.length} skills indexed</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSuccessJob(null);
              resetForm();
              setActiveTab('manage');
            }}
          >
            Manage Requisitions
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (onNavigateToPipeline) onNavigateToPipeline();
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            View Applications Pipeline
          </Button>
        </div>
      </div>
    );
  }

  const filteredJobs = recruiterJobs.filter((j) => {
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    const q = jobSearch.toLowerCase();
    const matchesSearch = j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-500" />
            <span>Technical Requisitions & Job Governance</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, publish, pause, and close technical job postings with transparent compensation and verifiable code artifact criteria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => {
                audioService.playClick();
                setActiveTab('manage');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'manage'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Manage Postings ({recruiterJobs.length})
            </button>
            <button
              onClick={() => {
                audioService.playClick();
                resetForm();
                setActiveTab('create');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              + Create Requisition
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-bold hover:underline cursor-pointer">✕</button>
        </div>
      )}

      {/* MANAGE REQUISITIONS VIEW */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="sm:col-span-3 flex items-center gap-2 px-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search requisitions by title or department..."
                className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700"
              >
                <option value="all">All Posting States</option>
                <option value="published">Active / Published</option>
                <option value="draft">Paused / Draft</option>
                <option value="closed">Closed / Expired</option>
              </select>
            </div>
          </div>

          {/* Job List Cards */}
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/30 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          job.status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : job.status === 'draft'
                            ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {job.status === 'draft' ? 'Paused (Draft)' : job.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {job.company} • {job.department} • {job.location} ({job.remote_type})
                    </p>
                  </div>

                  {/* Lifecycle Control Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(job)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5 text-indigo-500" />}
                      className="text-xs"
                    >
                      Edit Spec
                    </Button>

                    {job.status === 'published' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'draft')}
                        leftIcon={<Pause className="w-3.5 h-3.5 text-amber-500" />}
                        className="text-xs border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                        title="Pause this requisition to temporarily hide it from candidates"
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'published')}
                        leftIcon={<Play className="w-3.5 h-3.5 text-emerald-500" />}
                        className="text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                      >
                        Publish
                      </Button>
                    )}

                    {job.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'closed')}
                        leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                        className="text-xs border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                        title="Permanently close this requisition"
                      >
                        Close
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (onNavigateToPipeline) onNavigateToPipeline();
                      }}
                      leftIcon={<Users className="w-3.5 h-3.5" />}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Applications
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${job.salary_min?.toLocaleString()} – ${job.salary_max?.toLocaleString()}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {job.required_skills?.slice(0, 4).join(', ')}
                  </span>
                  {job.equity && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium">Equity: {job.equity}</span>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No requisitions found</p>
                <p className="text-xs text-slate-400 mt-1">Click "+ Create Requisition" to publish an engineering role.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT REQUISITION FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>{editingJobId ? 'Edit Technical Requisition Spec' : '1. Requisition Metadata & Organization Context'}</span>
              </h2>
              {editingJobId && (
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                  Editing: {editingJobId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requisition Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff Distributed Systems Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employer Organization *
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => {
                    setOrganizationId(e.target.value);
                    const org = organizations.find((o) => o.id === e.target.value);
                    if (org) setCompany(org.name);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.verified ? '(Verified)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Pod
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Infrastructure Core"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Geographic Bounds
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workplace Flexibility
                </label>
                <select
                  value={remoteType}
                  onChange={(e) => setRemoteType(e.target.value as RemoteType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="remote">Fully Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Experience Tier
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="entry">Entry / University Graduate</option>
                  <option value="mid">Mid-Level Engineer</option>
                  <option value="senior">Senior Engineer</option>
                  <option value="lead">Staff / Principal / Lead Architect</option>
                </select>
              </div>
            </div>

            {/* Compensation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Salary Minimum ($ USD) *
                </label>
                <input
                  type="number"
                  step="5000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Salary Maximum ($ USD) *
                </label>
                <input
                  type="number"
                  step="5000"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Equity Grant
                </label>
                <input
                  type="text"
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  placeholder="e.g. 0.15% - 0.35%"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Description */}
            <div className="text-xs pt-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Technical Mission & Architecture Scope *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Required Skills & Proof */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>2. Deterministic Technical Criteria & Evidence Standards</span>
            </h2>

            {/* Required Skills */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Required Technical Competencies (Career Twin Matching)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill('required');
                    }
                  }}
                  placeholder="Add required skill (e.g. Rust, Raft, Linux)..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <Button variant="outline" size="sm" type="button" onClick={() => handleAddSkill('required')}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s, 'required')}
                      className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Competencies
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={preferredInput}
                  onChange={(e) => setPreferredInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill('preferred');
                    }
                  }}
                  placeholder="Add preferred skill (e.g. eBPF, io_uring)..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <Button variant="outline" size="sm" type="button" onClick={() => handleAddSkill('preferred')}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {preferredSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s, 'preferred')}
                      className="text-cyan-500 hover:text-cyan-700 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Evidence Criteria */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Required Project Proof Standard
              </label>
              <input
                type="text"
                value={evidenceCriteriaLabel}
                onChange={(e) => setEvidenceCriteriaLabel(e.target.value)}
                placeholder="e.g. Production-grade systems repository with unit & fuzz testing benchmarks"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('manage');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? 'Publishing...' : editingJobId ? 'Save & Update Requisition' : 'Publish Requisition'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
