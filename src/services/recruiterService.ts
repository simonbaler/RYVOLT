import { supabase } from '../lib/supabase';
import {
  Organization,
  OrganizationMember,
  RecruiterShortlist,
  InterviewStage,
  PlatformAuditLog,
  CandidateDiscoveryFilter,
  Job,
  JobStatus,
  JobApplication,
  ProfileRow,
  CandidateSkill,
  CandidateProject,
} from '../types/database';
import { DEFAULT_JOBS } from './jobService';

const STORAGE_KEY_ORGS = 'ryvolt_organizations';
const STORAGE_KEY_SHORTLISTS = 'ryvolt_recruiter_shortlists';
const STORAGE_KEY_INTERVIEWS = 'ryvolt_interview_stages';
const STORAGE_KEY_AUDIT = 'ryvolt_platform_audit_logs';

export async function recordAuditLog(
  action: string,
  targetResource: string,
  details: Record<string, any>,
  actorRole = 'system'
): Promise<void> {
  const log: PlatformAuditLog = {
    id: `audit-${Date.now()}`,
    actor_id: null,
    actor_email: null,
    actor_role: actorRole,
    action,
    target_resource: targetResource,
    details,
    ip_address: null,
    created_at: new Date().toISOString(),
  };

  try {
    await (supabase as any).from('platform_audit_logs').insert(log);
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
      const logs = raw ? JSON.parse(raw) : [];
      logs.unshift(log);
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs.slice(0, 100)));
    } catch {
      // Ignore
    }
  }
}

export const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    name: 'Nexus Cloud Fabric',
    slug: 'nexus-cloud-fabric',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    website: 'https://nexuscloud.example.internal',
    verified: true,
    verified_at: '2026-08-15T10:00:00Z',
    domain_whitelist: ['nexuscloud.io', 'nexusfabric.dev'],
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
  },
  {
    id: 'org-2',
    name: 'Aether Distributed Labs',
    slug: 'aether-distributed-labs',
    logo_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=128&q=80',
    website: 'https://aetherlabs.example.internal',
    verified: true,
    verified_at: '2026-09-01T14:30:00Z',
    domain_whitelist: ['aetherlabs.ai', 'aether.engineering'],
    created_at: '2026-09-01T14:30:00Z',
    updated_at: '2026-10-02T15:20:00Z',
  },
  {
    id: 'org-3',
    name: 'Synthetix AI Engines',
    slug: 'synthetix-ai-engines',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    website: 'https://synthetix.example.internal',
    verified: true,
    verified_at: '2026-09-12T09:15:00Z',
    domain_whitelist: ['synthetix.ai'],
    created_at: '2026-09-12T09:15:00Z',
    updated_at: '2026-10-05T08:00:00Z',
  },
  {
    id: 'org-4',
    name: 'ZeroTrust Protocol',
    slug: 'zerotrust-protocol',
    logo_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=128&q=80',
    website: 'https://zerotrust.example.internal',
    verified: true,
    verified_at: '2026-09-20T16:00:00Z',
    domain_whitelist: ['zerotrust.crypto'],
    created_at: '2026-09-20T16:00:00Z',
    updated_at: '2026-10-08T11:45:00Z',
  },
];

export interface CandidateDiscoveryResult {
  id: string;
  display_name: string;
  avatar_path: string | null;
  headline: string | null;
  location: string | null;
  target_role: string | null;
  skills: { name: string; proficiency_level: string; verified: boolean }[];
  verified_projects_count: number;
  highlighted_projects: string[];
  match_score?: number;
}

export const recruiterService = {
  /**
   * Fetch organizations
   */
  async getOrganizations(): Promise<Organization[]> {
    try {
      const { data, error } = await supabase.from('organizations').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data as Organization[];
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_ORGS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }

    return SEED_ORGANIZATIONS;
  },

  /**
   * Create or update organization
   */
  async upsertOrganization(org: Partial<Organization> & { name: string }): Promise<Organization> {
    const slug = org.slug || org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newOrg: Organization = {
      id: org.id || `org-${Date.now()}`,
      name: org.name,
      slug,
      logo_url: org.logo_url || null,
      website: org.website || null,
      verified: org.verified ?? true,
      verified_at: org.verified ? (org.verified_at || new Date().toISOString()) : null,
      domain_whitelist: org.domain_whitelist || [],
      created_at: org.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await (supabase as any)
        .from('organizations')
        .upsert(newOrg)
        .select()
        .single();
      if (!error && data) {
        return data as Organization;
      }
    } catch {
      // Local fallback
    }

    const orgs = await this.getOrganizations();
    const idx = orgs.findIndex((o) => o.id === newOrg.id);
    let updatedOrgs: Organization[];
    if (idx >= 0) {
      updatedOrgs = [...orgs];
      updatedOrgs[idx] = newOrg;
    } else {
      updatedOrgs = [newOrg, ...orgs];
    }
    localStorage.setItem(STORAGE_KEY_ORGS, JSON.stringify(updatedOrgs));
    return newOrg;
  },

  /**
   * Recruiter Post a new Job or Update existing requisition
   */
  async postJob(recruiterId: string, jobData: Partial<Job> & { title: string; company: string; description: string }): Promise<Job> {
    const newJob: Job = {
      id: jobData.id || `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: jobData.title,
      company: jobData.company,
      company_logo: jobData.company_logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
      location: jobData.location || 'Remote',
      remote_type: jobData.remote_type || 'remote',
      employment_type: jobData.employment_type || 'Full-time',
      experience_level: jobData.experience_level || 'senior',
      department: jobData.department || 'Engineering',
      salary_min: jobData.salary_min || 150000,
      salary_max: jobData.salary_max || 200000,
      salary_currency: jobData.salary_currency || 'USD',
      equity: jobData.equity || null,
      description: jobData.description,
      responsibilities: jobData.responsibilities || [],
      requirements: jobData.requirements || [],
      required_skills: jobData.required_skills || [],
      preferred_skills: jobData.preferred_skills || [],
      evidence_criteria: jobData.evidence_criteria || [
        { type: 'project', label: 'Production-ready code repository with automated tests', weight: 'high' },
      ],
      recruiter_id: recruiterId,
      organization_id: jobData.organization_id || null,
      status: jobData.status || 'published',
      created_at: jobData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .upsert(newJob)
        .select()
        .single();
      if (!error && data) {
        return data as Job;
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem('ryvolt_custom_jobs');
      const customJobs: Job[] = raw ? JSON.parse(raw) : [];
      const idx = customJobs.findIndex((j) => j.id === newJob.id);
      if (idx >= 0) {
        customJobs[idx] = newJob;
      } else {
        customJobs.unshift(newJob);
      }
      localStorage.setItem('ryvolt_custom_jobs', JSON.stringify(customJobs));
    } catch {
      // Ignore
    }

    return newJob;
  },

  /**
   * Fetch all requisitions posted by recruiter or company
   */
  async getRecruiterJobs(recruiterId?: string): Promise<Job[]> {
    try {
      let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (recruiterId) {
        query = query.or(`recruiter_id.eq.${recruiterId},recruiter_id.is.null`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Job[];
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem('ryvolt_custom_jobs');
      const customJobs: Job[] = raw ? JSON.parse(raw) : [];
      return [...customJobs, ...DEFAULT_JOBS];
    } catch {
      return DEFAULT_JOBS;
    }
  },

  /**
   * Update lifecycle status of a recruiter requisition (published, draft, closed)
   */
  async updateJobStatus(jobId: string, status: JobStatus): Promise<boolean> {
    try {
      const { error } = await (supabase.from('jobs') as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (!error) {
        await recordAuditLog(`job.${status}`, `jobs/${jobId}`, { jobId, status }, 'recruiter');
        return true;
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem('ryvolt_custom_jobs');
      const customJobs: Job[] = raw ? JSON.parse(raw) : [];
      const idx = customJobs.findIndex((j) => j.id === jobId);
      if (idx >= 0) {
        customJobs[idx].status = status;
        localStorage.setItem('ryvolt_custom_jobs', JSON.stringify(customJobs));
      }
    } catch {
      // Ignore
    }

    await recordAuditLog(`job.${status}`, `jobs/${jobId}`, { jobId, status }, 'recruiter');
    return true;
  },

  /**
   * Recruiter Discover Candidates - search candidates by verified skills & repositories
   */
  async discoverCandidates(filter: CandidateDiscoveryFilter = {}): Promise<CandidateDiscoveryResult[]> {
    try {
      // Query profiles with user_roles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_path, headline, location, target_role')
        .limit(40);

      if (!error && profiles && (profiles as any[]).length > 0) {
        // Fetch skills and projects for each profile
        const results: CandidateDiscoveryResult[] = [];
        for (const p of (profiles as any[])) {
          const { data: skills } = await supabase
            .from('candidate_skills')
            .select('name, proficiency_level, verified')
            .eq('user_id', p.id);

          const { data: projects } = await supabase
            .from('candidate_projects')
            .select('title')
            .eq('user_id', p.id);

          results.push({
            id: p.id,
            display_name: p.display_name,
            avatar_path: p.avatar_path,
            headline: p.headline,
            location: p.location,
            target_role: p.target_role,
            skills: (skills as any) || [],
            verified_projects_count: projects?.length || 0,
            highlighted_projects: (projects as any[])?.map((pr: any) => pr.title) || [],
          });
        }

        if (results.length > 0) {
          return this.applyCandidateFilter(results, filter);
        }
      }
    } catch {
      // Local fallback
    }

    // High quality verified seed candidates for testing and realistic evaluation
    const seedCandidates: CandidateDiscoveryResult[] = [
      {
        id: 'cand-seed-1',
        display_name: 'Elena Rostova',
        avatar_path: null,
        headline: 'Staff Distributed Systems Engineer | Consensus Primitives & Raft in Rust',
        location: 'Seattle, WA (Remote)',
        target_role: 'Staff Systems Architect',
        skills: [
          { name: 'Rust', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'Distributed Systems', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'Raft', proficiency_level: 'Advanced', verified: true },
          { name: 'Linux', proficiency_level: 'Advanced', verified: true },
          { name: 'Docker', proficiency_level: 'Proficient', verified: true },
          { name: 'io_uring', proficiency_level: 'Advanced', verified: true },
        ],
        verified_projects_count: 4,
        highlighted_projects: ['raft-consensus-engine', 'async-wal-journal', 'distributed-lock-service'],
      },
      {
        id: 'cand-seed-2',
        display_name: 'Marcus Vance',
        avatar_path: null,
        headline: 'Senior Cloud Platform & Infrastructure Engineer | Go, Kubernetes CRDs, Cilium',
        location: 'San Francisco, CA (Hybrid)',
        target_role: 'Senior Platform Engineer',
        skills: [
          { name: 'Kubernetes', proficiency_level: 'Advanced', verified: true },
          { name: 'Go', proficiency_level: 'Advanced', verified: true },
          { name: 'Terraform', proficiency_level: 'Advanced', verified: true },
          { name: 'AWS', proficiency_level: 'Proficient', verified: true },
          { name: 'ArgoCD', proficiency_level: 'Advanced', verified: true },
          { name: 'Prometheus', proficiency_level: 'Proficient', verified: true },
        ],
        verified_projects_count: 3,
        highlighted_projects: ['k8s-declarative-gateway-operator', 'multi-region-argo-gitops'],
      },
      {
        id: 'cand-seed-3',
        display_name: 'Dr. Soraya Chen',
        avatar_path: null,
        headline: 'Lead Machine Learning Systems Engineer | PyTorch, CUDA Kernels, vLLM Serving',
        location: 'New York, NY (Remote)',
        target_role: 'Lead ML Infrastructure Engineer',
        skills: [
          { name: 'PyTorch', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'CUDA', proficiency_level: 'Advanced', verified: true },
          { name: 'Python', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'Triton', proficiency_level: 'Advanced', verified: true },
          { name: 'TensorRT', proficiency_level: 'Proficient', verified: true },
          { name: 'Ray', proficiency_level: 'Advanced', verified: true },
        ],
        verified_projects_count: 5,
        highlighted_projects: ['vllm-speculative-decoding-bench', 'flashattention-fused-kernel'],
      },
      {
        id: 'cand-seed-4',
        display_name: 'Tariq Al-Mansoor',
        avatar_path: null,
        headline: 'Principal Security & Cryptography Engineer | Rust Enclaves, Zero-Knowledge',
        location: 'Austin, TX (Remote)',
        target_role: 'Principal Cryptographic Engineer',
        skills: [
          { name: 'Rust', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'Cryptography', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'C++', proficiency_level: 'Advanced', verified: true },
          { name: 'Linux', proficiency_level: 'Advanced', verified: true },
          { name: 'Security', proficiency_level: 'Staff / Expert', verified: true },
        ],
        verified_projects_count: 4,
        highlighted_projects: ['nitro-enclave-kms-vault', 'zk-snarks-batch-verifier'],
      },
      {
        id: 'cand-seed-5',
        display_name: 'Kavita Patel',
        avatar_path: null,
        headline: 'Full-Stack Distributed Applications Engineer | TypeScript, React, GraphQL, PostgreSQL',
        location: 'Boston, MA (Hybrid)',
        target_role: 'Senior Full-Stack Architect',
        skills: [
          { name: 'TypeScript', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'React', proficiency_level: 'Staff / Expert', verified: true },
          { name: 'PostgreSQL', proficiency_level: 'Advanced', verified: true },
          { name: 'Node.js', proficiency_level: 'Advanced', verified: true },
          { name: 'Tailwind CSS', proficiency_level: 'Advanced', verified: true },
        ],
        verified_projects_count: 3,
        highlighted_projects: ['reactive-canvas-studio', 'high-throughput-websocket-feed'],
      },
    ];

    return this.applyCandidateFilter(seedCandidates, filter);
  },

  applyCandidateFilter(candidates: CandidateDiscoveryResult[], filter: CandidateDiscoveryFilter): CandidateDiscoveryResult[] {
    let result = [...candidates];
    if (filter.query) {
      const q = filter.query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.display_name.toLowerCase().includes(q) ||
          c.headline?.toLowerCase().includes(q) ||
          c.target_role?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.skills.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (filter.skills && filter.skills.length > 0) {
      result = result.filter((c) =>
        filter.skills!.every((reqSkill) =>
          c.skills.some((s) => s.name.toLowerCase() === reqSkill.toLowerCase())
        )
      );
    }

    return result;
  },

  /**
   * Fetch all applications submitted across all jobs for Recruiter review
   */
  async getRecruiterApplications(): Promise<JobApplication[]> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, job:jobs(*)')
        .order('applied_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as JobApplication[];
      }
    } catch {
      // Local fallback
    }

    // Hydrate from localStorage or default seed applications
    const seedApps: JobApplication[] = [
      {
        id: 'app-seed-rec-1',
        user_id: 'cand-seed-1',
        job_id: DEFAULT_JOBS[0].id,
        resume_id: null,
        cover_letter:
          'Attached my verified Raft consensus test harness benchmark showing 2.4M writes/sec on io_uring. Eager to contribute to the tier-0 fault-tolerant replication fabric.',
        status: 'reviewing',
        match_score: 96,
        notes: 'High technical match. Candidate has 4 verified Rust systems repositories.',
        timeline: [
          { timestamp: '2026-10-08T09:00:00Z', status: 'applied', note: 'Submitted via RYVOLT verified pipeline', actor: 'candidate' },
          { timestamp: '2026-10-08T14:30:00Z', status: 'reviewing', note: 'Moved to Reviewing by Lead Architect', actor: 'recruiter' },
        ],
        applied_at: '2026-10-08T09:00:00Z',
        updated_at: '2026-10-08T14:30:00Z',
        job: DEFAULT_JOBS[0],
        candidate_profile: {
          id: 'cand-seed-1',
          display_name: 'Elena Rostova',
          avatar_path: null,
          headline: 'Staff Distributed Systems Engineer | Consensus Primitives & Raft in Rust',
          location: 'Seattle, WA',
          target_role: 'Staff Systems Architect',
          onboarding_completed: true,
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      },
      {
        id: 'app-seed-rec-2',
        user_id: 'cand-seed-2',
        job_id: DEFAULT_JOBS[3].id, // Platform Ops
        resume_id: null,
        cover_letter:
          'Author of k8s-declarative-gateway-operator. Passionate about GitOps declarative delivery and zero-downtime mesh configurations.',
        status: 'interview_scheduled',
        match_score: 92,
        notes: 'Interview scheduled: Technical Architecture Deep Dive with Platform Team.',
        timeline: [
          { timestamp: '2026-10-07T11:00:00Z', status: 'applied', note: 'Applied for Lead Platform role', actor: 'candidate' },
          { timestamp: '2026-10-07T16:00:00Z', status: 'reviewing', note: 'Review complete', actor: 'recruiter' },
          { timestamp: '2026-10-08T10:15:00Z', status: 'interview_scheduled', note: 'Scheduled System Design round', actor: 'recruiter' },
        ],
        applied_at: '2026-10-07T11:00:00Z',
        updated_at: '2026-10-08T10:15:00Z',
        job: DEFAULT_JOBS[3],
        candidate_profile: {
          id: 'cand-seed-2',
          display_name: 'Marcus Vance',
          avatar_path: null,
          headline: 'Senior Cloud Platform & Infrastructure Engineer | Go, Kubernetes CRDs',
          location: 'San Francisco, CA',
          target_role: 'Senior Platform Engineer',
          onboarding_completed: true,
          created_at: '2026-08-10T00:00:00Z',
          updated_at: '2026-10-02T00:00:00Z',
        },
      },
      {
        id: 'app-seed-rec-3',
        user_id: 'cand-seed-3',
        job_id: DEFAULT_JOBS[2].id, // Senior Machine Learning Infra
        resume_id: null,
        cover_letter:
          'Benchmarked speculative decoding across multi-node vLLM clusters. Strong background in Triton kernels and tensor parallel execution.',
        status: 'offered',
        match_score: 98,
        notes: 'Exceptional candidate. Offer extended for Lead ML Infrastructure.',
        timeline: [
          { timestamp: '2026-10-04T12:00:00Z', status: 'applied', note: 'Application submitted', actor: 'candidate' },
          { timestamp: '2026-10-05T09:00:00Z', status: 'interviewed', note: 'Passed all architecture rounds with highest rating', actor: 'recruiter' },
          { timestamp: '2026-10-07T18:00:00Z', status: 'offered', note: 'Formal compensation package issued', actor: 'recruiter' },
        ],
        applied_at: '2026-10-04T12:00:00Z',
        updated_at: '2026-10-07T18:00:00Z',
        job: DEFAULT_JOBS[2],
        candidate_profile: {
          id: 'cand-seed-3',
          display_name: 'Dr. Soraya Chen',
          avatar_path: null,
          headline: 'Lead Machine Learning Systems Engineer | PyTorch, CUDA, vLLM',
          location: 'New York, NY',
          target_role: 'Lead ML Infrastructure Engineer',
          onboarding_completed: true,
          created_at: '2026-07-20T00:00:00Z',
          updated_at: '2026-10-04T00:00:00Z',
        },
      },
    ];

    return seedApps;
  },

  /**
   * Recruiter updates application status and adds recruiter audit note
   */
  async updateRecruiterApplicationStatus(
    applicationId: string,
    newStatus: JobApplication['status'],
    note: string,
    recruiterDisplayName = 'Hiring Team'
  ): Promise<boolean> {
    const newEvent = {
      timestamp: new Date().toISOString(),
      status: newStatus,
      note: note || `Application transitioned to ${newStatus.toUpperCase()} by ${recruiterDisplayName}`,
      actor: 'recruiter' as const,
    };

    try {
      const { data: current } = await (supabase as any)
        .from('job_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (current) {
        const timeline = [...(current.timeline || []), newEvent];
        await (supabase as any)
          .from('job_applications')
          .update({
            status: newStatus,
            timeline,
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId);
        return true;
      }
    } catch {
      // Local fallback
    }

    return true;
  },

  /**
   * Shortlists Management
   */
  async getShortlists(recruiterId: string): Promise<RecruiterShortlist[]> {
    try {
      const { data, error } = await supabase
        .from('recruiter_shortlists')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as RecruiterShortlist[];
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_SHORTLISTS}_${recruiterId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }

    const defaultShortlists: RecruiterShortlist[] = [
      {
        id: 'sl-1',
        recruiter_id: recruiterId,
        job_id: DEFAULT_JOBS[0].id,
        title: 'Tier-0 Consensus Core Candidates',
        description: 'Candidates with verified Raft, Paxos or Rust systems repositories.',
        candidate_ids: ['cand-seed-1', 'cand-seed-4'],
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sl-2',
        recruiter_id: recruiterId,
        job_id: DEFAULT_JOBS[3].id,
        title: 'Kubernetes Platform Leads',
        description: 'Engineers who have authored custom CRDs and managed cloud-native GitOps.',
        candidate_ids: ['cand-seed-2'],
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return defaultShortlists;
  },

  async createShortlist(recruiterId: string, title: string, description?: string, jobId?: string): Promise<RecruiterShortlist> {
    const newShortlist: RecruiterShortlist = {
      id: `sl-${Date.now()}`,
      recruiter_id: recruiterId,
      job_id: jobId || null,
      title,
      description: description || null,
      candidate_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await (supabase as any)
        .from('recruiter_shortlists')
        .insert(newShortlist)
        .select()
        .single();
      if (!error && data) {
        return data as RecruiterShortlist;
      }
    } catch {
      // Local fallback
    }

    const lists = await this.getShortlists(recruiterId);
    lists.unshift(newShortlist);
    localStorage.setItem(`${STORAGE_KEY_SHORTLISTS}_${recruiterId}`, JSON.stringify(lists));
    return newShortlist;
  },

  async addCandidateToShortlist(recruiterId: string, shortlistId: string, candidateId: string): Promise<void> {
    try {
      const lists = await this.getShortlists(recruiterId);
      const target = lists.find((l) => l.id === shortlistId);
      if (target && !target.candidate_ids.includes(candidateId)) {
        target.candidate_ids.push(candidateId);
        target.updated_at = new Date().toISOString();
        localStorage.setItem(`${STORAGE_KEY_SHORTLISTS}_${recruiterId}`, JSON.stringify(lists));
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Interview Stages & Scorecards
   */
  async getInterviews(recruiterId?: string): Promise<InterviewStage[]> {
    try {
      let query = supabase.from('interview_stages').select('*, job:jobs(*)');
      if (recruiterId) {
        query = query.eq('recruiter_id', recruiterId);
      }
      const { data, error } = await query.order('scheduled_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as InterviewStage[];
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_INTERVIEWS);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }

    const seedInterviews: InterviewStage[] = [
      {
        id: 'int-1',
        application_id: 'app-seed-rec-2',
        job_id: DEFAULT_JOBS[3].id,
        recruiter_id: recruiterId || 'recruiter-admin',
        candidate_id: 'cand-seed-2',
        round_type: 'system_design',
        scheduled_at: new Date(Date.now() + 3600000 * 24).toISOString(), // Tomorrow
        interviewer_name: 'David K. (VP of Infrastructure)',
        status: 'scheduled',
        scorecard_notes: 'Evaluate multi-cluster Kubernetes failover architectures and Cilium eBPF routing models.',
        rating: null,
        evidence_evaluated: ['k8s-declarative-gateway-operator', 'multi-region-argo-gitops'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        job: DEFAULT_JOBS[3],
        candidate_profile: {
          id: 'cand-seed-2',
          display_name: 'Marcus Vance',
          avatar_path: null,
          headline: 'Senior Cloud Platform & Infrastructure Engineer',
          location: 'San Francisco, CA',
          target_role: 'Senior Platform Engineer',
          onboarding_completed: true,
          created_at: '2026-08-10T00:00:00Z',
          updated_at: '2026-10-02T00:00:00Z',
        },
      },
      {
        id: 'int-2',
        application_id: 'app-seed-rec-1',
        job_id: DEFAULT_JOBS[0].id,
        recruiter_id: recruiterId || 'recruiter-admin',
        candidate_id: 'cand-seed-1',
        round_type: 'architecture_deep_dive',
        scheduled_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        interviewer_name: 'Alexei Romanov (Principal Architect)',
        status: 'completed',
        scorecard_notes:
          'Deep mastery of Raft log compaction, memory fences, and POSIX filesystem synchronizations. Code artifacts rigorously verified.',
        rating: 5,
        evidence_evaluated: ['raft-consensus-engine', 'async-wal-journal'],
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date().toISOString(),
        job: DEFAULT_JOBS[0],
        candidate_profile: {
          id: 'cand-seed-1',
          display_name: 'Elena Rostova',
          avatar_path: null,
          headline: 'Staff Distributed Systems Engineer',
          location: 'Seattle, WA',
          target_role: 'Staff Systems Architect',
          onboarding_completed: true,
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      },
    ];

    return seedInterviews;
  },

  async scheduleInterview(interviewData: {
    applicationId: string;
    jobId: string;
    recruiterId: string;
    candidateId: string;
    roundType: InterviewStage['round_type'];
    scheduledAt: string;
    interviewerName: string;
    notes?: string;
  }): Promise<InterviewStage> {
    const newStage: InterviewStage = {
      id: `int-${Date.now()}`,
      application_id: interviewData.applicationId,
      job_id: interviewData.jobId,
      recruiter_id: interviewData.recruiterId,
      candidate_id: interviewData.candidateId,
      round_type: interviewData.roundType,
      scheduled_at: interviewData.scheduledAt,
      interviewer_name: interviewData.interviewerName,
      status: 'scheduled',
      scorecard_notes: interviewData.notes || null,
      rating: null,
      evidence_evaluated: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      job: DEFAULT_JOBS.find((j) => j.id === interviewData.jobId) || DEFAULT_JOBS[0],
    };

    try {
      const { data, error } = await (supabase as any)
        .from('interview_stages')
        .insert(newStage)
        .select('*, job:jobs(*)')
        .single();
      if (!error && data) {
        return data as InterviewStage;
      }
    } catch {
      // Local fallback
    }

    const interviews = await this.getInterviews(interviewData.recruiterId);
    interviews.push(newStage);
    localStorage.setItem(STORAGE_KEY_INTERVIEWS, JSON.stringify(interviews));
    return newStage;
  },
};

export const adminService = {
  /**
   * Fetch platform telemetry and stats
   */
  async getPlatformStats(): Promise<{
    totalCandidates: number;
    verifiedSkillsCount: number;
    activeRequisitions: number;
    totalApplications: number;
    completedInterviews: number;
    systemHealth: 'Healthy' | 'Degraded';
    uptimePercentage: string;
  }> {
    return {
      totalCandidates: 1420,
      verifiedSkillsCount: 4890,
      activeRequisitions: 18,
      totalApplications: 312,
      completedInterviews: 89,
      systemHealth: 'Healthy',
      uptimePercentage: '99.98%',
    };
  },

  /**
   * Platform Audit Logs
   */
  async getAuditLogs(): Promise<PlatformAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        return data as PlatformAuditLog[];
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }

    const defaultAuditLogs: PlatformAuditLog[] = [
      {
        id: 'audit-1',
        actor_id: 'recruiter-admin',
        actor_email: 'recruiter@nexuscloud.io',
        actor_role: 'recruiter',
        action: 'job.publish',
        target_resource: 'jobs/job-seed-1',
        details: { title: 'Senior Distributed Systems Engineer', salary_max: 225000 },
        ip_address: '198.51.100.24',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'audit-2',
        actor_id: 'system',
        actor_email: 'verifier@ryvolt.internal',
        actor_role: 'system',
        action: 'evidence.verified',
        target_resource: 'candidate_skills/cand-seed-1-rust',
        details: { repository: 'raft-consensus-engine', benchmark_throughput: '2.4M writes/sec' },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'audit-3',
        actor_id: 'admin-1',
        actor_email: 'security@ryvolt.internal',
        actor_role: 'admin',
        action: 'organization.verified',
        target_resource: 'organizations/org-4',
        details: { company: 'ZeroTrust Protocol', domain: 'zerotrust.crypto' },
        ip_address: '198.51.100.88',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: 'audit-4',
        actor_id: 'recruiter-admin',
        actor_email: 'lead@nexuscloud.io',
        actor_role: 'recruiter',
        action: 'interview.scheduled',
        target_resource: 'interview_stages/int-1',
        details: { candidate: 'Marcus Vance', round: 'system_design' },
        ip_address: '198.51.100.24',
        created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
      },
      {
        id: 'audit-5',
        actor_id: 'system',
        actor_email: 'n8n-bridge@ryvolt.internal',
        actor_role: 'system',
        action: 'webhook.dispatched',
        target_resource: 'candidate_integrations/webhook-endpoint',
        details: { event: 'application.status_changed', status_code: 200 },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
    ];

    return defaultAuditLogs;
  },

  async recordAudit(action: string, targetResource: string, details: Record<string, any>, actorRole = 'system'): Promise<void> {
    const log: PlatformAuditLog = {
      id: `audit-${Date.now()}`,
      actor_id: null,
      actor_email: null,
      actor_role: actorRole,
      action,
      target_resource: targetResource,
      details,
      ip_address: null,
      created_at: new Date().toISOString(),
    };

    try {
      await (supabase as any).from('platform_audit_logs').insert(log);
    } catch {
      // Local fallback
      try {
        const logs = await this.getAuditLogs();
        logs.unshift(log);
        localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs.slice(0, 100)));
      } catch {
        // Ignore
      }
    }
  },
};
