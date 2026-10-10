import { supabase } from '../lib/supabase';
import {
  Job,
  JobApplication,
  JobStatus,
  RemoteType,
  ExperienceLevel,
  EmploymentType,
  TwinMatchBreakdown,
  CandidateSkill,
  CandidateProject,
  ApplicationStatus,
  ApplicationTimelineEvent,
} from '../types/database';

export interface JobFilterParams {
  query?: string;
  department?: string;
  remoteType?: RemoteType | 'all';
  experienceLevel?: ExperienceLevel | 'all';
  minSalary?: number;
  skills?: string[];
  sortBy?: 'recommended' | 'salary_high' | 'recent' | 'match_score';
}

// Default Seed Jobs (Used when Supabase is offline or empty)
export const DEFAULT_JOBS: Job[] = [
  {
    id: 'job-seed-1',
    title: 'Senior Distributed Systems Engineer',
    company: 'Nexus Cloud Fabric',
    company_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    location: 'San Francisco, CA',
    remote_type: 'remote',
    employment_type: 'Full-time',
    experience_level: 'senior',
    department: 'Infrastructure',
    salary_min: 175000,
    salary_max: 225000,
    salary_currency: 'USD',
    equity: '0.15% - 0.35%',
    description:
      'Build next-generation fault-tolerant state-machine replication layers serving over 2M requests/sec. You will architect multi-region consensus protocols, optimize write-ahead logging under Linux kernel io_uring, and ensure verifiable zero-data-loss durability.',
    responsibilities: [
      'Architect and benchmark consensus replication primitives using Raft or Paxos',
      'Tune lock-free concurrent memory ringbuffers and low-latency storage engines',
      'Write automated chaos engineering suites simulating asymmetric network splits',
      'Participate in on-call rotations for tier-0 distributed database nodes',
    ],
    requirements: [
      '5+ years building backend systems in Go, Rust, or modern C++',
      'Deep understanding of Raft, Paxos, LSM trees, and Linux system calls',
      'Track record of optimizing p99 latencies under high network contention',
      'Commitment to writing deterministic unit and integration test fixtures',
    ],
    required_skills: ['Go', 'Rust', 'Distributed Systems', 'Raft', 'Linux', 'Docker'],
    preferred_skills: ['io_uring', 'gRPC', 'eBPF', 'Prometheus', 'Kubernetes'],
    evidence_criteria: [
      {
        type: 'project',
        label: 'Verifiable consensus implementation or storage engine artifact',
        weight: 'high',
      },
      {
        type: 'code_proof',
        label: 'Demonstrated benchmark suite under network partition',
        weight: 'medium',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-seed-2',
    title: 'Lead AI / LLM Infrastructure Engineer',
    company: 'Cognitive Frontier Labs',
    company_logo: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=128&q=80',
    location: 'New York, NY',
    remote_type: 'hybrid',
    employment_type: 'Full-time',
    experience_level: 'lead',
    department: 'Machine Learning',
    salary_min: 195000,
    salary_max: 255000,
    salary_currency: 'USD',
    equity: '0.20% - 0.45%',
    description:
      'Lead our model serving infrastructure team deploying multi-modal neural architectures. Build high-throughput vLLM clusters, distributed KV-cache paging, and low-latency inference streaming APIs for millions of simultaneous developers.',
    responsibilities: [
      'Direct the architecture of GPU inference clusters utilizing Triton and vLLM',
      'Implement speculative decoding pipelines and continuous batching schedulers',
      'Minimize cold-start weights distribution across Kubernetes nodes using BitTorrent/peer protocols',
      'Collaborate directly with foundation model researchers on quantization strategies',
    ],
    requirements: [
      'Demonstrated leadership in production ML serving at scale',
      'Proficiency with Python, C++, PyTorch, CUDA, and Triton Server',
      'Hands-on expertise with FlashAttention, FP8/AWQ quantization, and KV-cache optimizations',
      'Experience architecting multi-GPU distributed orchestration',
    ],
    required_skills: ['Python', 'PyTorch', 'CUDA', 'Kubernetes', 'Docker', 'FastAPI'],
    preferred_skills: ['vLLM', 'Triton', 'C++', 'Ray', 'TensorRT-LLM', 'AWS'],
    evidence_criteria: [
      {
        type: 'project',
        label: 'Open-source ML serving system or model inference pipeline',
        weight: 'high',
      },
      {
        type: 'benchmark',
        label: 'Documented latency/throughput benchmark metrics',
        weight: 'high',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-seed-3',
    title: 'Staff Full-Stack Systems Architect',
    company: 'RYVOLT Core Technologies',
    company_logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=128&q=80',
    location: 'Austin, TX',
    remote_type: 'remote',
    employment_type: 'Full-time',
    experience_level: 'principal',
    department: 'Product Engineering',
    salary_min: 185000,
    salary_max: 240000,
    salary_currency: 'USD',
    equity: '0.25% - 0.50%',
    description:
      'Spearhead the core Career Twin architecture, real-time reactive graph state, and deterministic synthesis engines. We reject resume fluff and create verifiable proof layers connecting developer repositories to career progression.',
    responsibilities: [
      'Own the frontend-to-database architectural integrity across React 19, TypeScript, and Supabase/PostgreSQL',
      'Design reactive state management paradigms handling complex evidence networks without performance degradation',
      'Partner with product design to build tactile, keyboard-accessible, and visually magnetic UI primitives',
      'Lead rigorous technical design reviews and mentor senior product engineers',
    ],
    requirements: [
      '7+ years shipping high-craft web applications and complex interactive workspaces',
      'Mastery of modern TypeScript, React, Tailwind CSS, PostgreSQL, and Web APIs',
      'Obsession with performance: sub-100ms interactions, zero layout shifts, clean bundle splitting',
      'Deep empathy for developer experience, type safety, and verifiable system architecture',
    ],
    required_skills: ['TypeScript', 'React', 'PostgreSQL', 'Tailwind CSS', 'Node.js', 'Next.js'],
    preferred_skills: ['WebSockets', 'GraphQL', 'Supabase', 'Docker', 'Vite', 'CI/CD'],
    evidence_criteria: [
      {
        type: 'portfolio',
        label: 'Live production application or high-craft developer tool',
        weight: 'high',
      },
      {
        type: 'code_proof',
        label: 'Clean architecture repository demonstrating strict type safety',
        weight: 'high',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-seed-4',
    title: 'Senior Cloud Platform & Kubernetes Engineer',
    company: 'InfraMesh Networks',
    company_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
    location: 'Seattle, WA',
    remote_type: 'remote',
    employment_type: 'Full-time',
    experience_level: 'senior',
    department: 'Platform Ops',
    salary_min: 165000,
    salary_max: 210000,
    salary_currency: 'USD',
    equity: '0.10% - 0.25%',
    description:
      'Empower hundreds of software engineers to deploy safely with zero friction. You will architect GitOps declarative delivery pipelines, write custom Kubernetes operators in Go, and harden multi-tenant ingress boundaries.',
    responsibilities: [
      'Develop Kubernetes custom controllers (CRDs) in Go to automate cloud resource provisioning',
      'Maintain declarative GitOps pipelines via ArgoCD across 40+ production clusters',
      'Enforce zero-trust service mesh networking using Istio and mTLS policies',
      'Optimize cloud spend through automated node autoscaling and spot instance management',
    ],
    requirements: [
      '4+ years managing production Kubernetes environments in AWS or GCP',
      'Proven ability to write production-grade Go code for Kubernetes operators',
      'Deep expertise with Terraform, ArgoCD, Helm, Prometheus, and Grafana',
      'Strong foundation in Linux networking, Cilium, and DNS troubleshooting',
    ],
    required_skills: ['Kubernetes', 'Go', 'AWS', 'Terraform', 'Docker', 'Linux'],
    preferred_skills: ['ArgoCD', 'Helm', 'Istio', 'Prometheus', 'eBPF', 'GCP'],
    evidence_criteria: [
      {
        type: 'project',
        label: 'Kubernetes operator or declarative infrastructure repository',
        weight: 'high',
      },
      {
        type: 'certification',
        label: 'CKA/CKS or equivalent cloud architecture credentials',
        weight: 'medium',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-seed-5',
    title: 'Principal Security & Rust Systems Engineer',
    company: 'ZeroTrust Protocol',
    company_logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=128&q=80',
    location: 'Boston, MA',
    remote_type: 'hybrid',
    employment_type: 'Full-time',
    experience_level: 'principal',
    department: 'Security & Cryptography',
    salary_min: 210000,
    salary_max: 270000,
    salary_currency: 'USD',
    equity: '0.30% - 0.60%',
    description:
      'Design cryptographic key management engines and secure enclave execution runtimes in pure Rust. Protect mission-critical enterprise telemetry from zero-day memory corruption and side-channel leakage.',
    responsibilities: [
      'Implement memory-safe protocol decoders and TLS termination in Rust',
      'Integrate hardware security modules (HSM) and AWS Nitro Enclaves',
      'Conduct automated fuzzing campaigns and formal verification of cryptographic handshakes',
      'Formulate threat models and establish enterprise zero-trust cryptographic baselines',
    ],
    requirements: [
      '8+ years in systems programming with extensive production Rust experience',
      'Deep theoretical and practical knowledge of applied cryptography (AES-GCM, Ed25519, Kyber)',
      'Experience running code inside Intel SGX or AWS Nitro Enclaves',
      'Proven vulnerability research or verifiable security audit history',
    ],
    required_skills: ['Rust', 'Cryptography', 'Linux', 'Security', 'C++', 'Git'],
    preferred_skills: ['WebAssembly', 'eBPF', 'AWS', 'Docker', 'Go'],
    evidence_criteria: [
      {
        type: 'audit',
        label: 'Public security audit or CVE remediation history',
        weight: 'high',
      },
      {
        type: 'code_proof',
        label: 'Cryptographic Rust crate or enclave project repository',
        weight: 'high',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-seed-6',
    title: 'Senior Frontend & Design Systems Engineer',
    company: 'Vivid Interfaces',
    company_logo: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=128&q=80',
    location: 'San Francisco, CA',
    remote_type: 'remote',
    employment_type: 'Full-time',
    experience_level: 'senior',
    department: 'Design Engineering',
    salary_min: 160000,
    salary_max: 205000,
    salary_currency: 'USD',
    equity: '0.15% - 0.30%',
    description:
      'Bridge the boundary between aesthetic perfection and rock-solid frontend engineering. Craft reusable accessible UI component libraries, micro-interactions, responsive spatial layouts, and silky smooth data visualizations.',
    responsibilities: [
      'Maintain and scale an accessible React & Tailwind component library used by 50+ developers',
      'Implement fluid physics-driven micro-interactions using Motion and CSS transforms',
      'Enforce WCAG 2.1 AA accessibility compliance across all keyboard, screen reader, and color contrast tests',
      'Profile and optimize browser frame rates to guarantee 60fps rendering during intensive dashboard manipulations',
    ],
    requirements: [
      '5+ years crafting consumer-facing or complex SaaS web interfaces',
      'Mastery of modern CSS, Tailwind, TypeScript, React, and browser rendering engines',
      'Obsessive attention to typographic rhythm, tactile feedback, and spatial balance',
      'Strong understanding of web accessibility standards (ARIA, keyboard navigation, contrast ratios)',
    ],
    required_skills: ['TypeScript', 'React', 'Tailwind CSS', 'CSS3', 'HTML5', 'Figma'],
    preferred_skills: ['Motion', 'Vite', 'Storybook', 'Next.js', 'Web Audio API', 'Canvas API'],
    evidence_criteria: [
      {
        type: 'portfolio',
        label: 'Interactive component library or high-polish web app demo',
        weight: 'high',
      },
      {
        type: 'project',
        label: 'Production UI system with accessible interactive states',
        weight: 'medium',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-seed-7',
    title: 'Backend Data Platform Engineer',
    company: 'StreamVelocity Analytics',
    company_logo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=128&q=80',
    location: 'Denver, CO',
    remote_type: 'hybrid',
    employment_type: 'Full-time',
    experience_level: 'mid',
    department: 'Data Engineering',
    salary_min: 145000,
    salary_max: 185000,
    salary_currency: 'USD',
    equity: '0.08% - 0.20%',
    description:
      'Construct real-time streaming data pipelines processing 50k events per second. You will maintain Apache Kafka clusters, write stream transformation jobs in Flink, and build high-performance OLAP query layers.',
    responsibilities: [
      'Design and maintain Kafka event streams, schema registries, and dead-letter queues',
      'Build stateful stream processing pipelines in Apache Flink and Python/Java',
      'Model analytical schemas in ClickHouse and PostgreSQL for sub-second business dashboards',
      'Automate data quality validation checks with automated alerting',
    ],
    requirements: [
      '3+ years building data pipelines and backend microservices',
      'Experience with Apache Kafka, ClickHouse, PostgreSQL, and Python or Java/Scala',
      'Familiarity with distributed data consistency and exactly-once processing semantics',
      'Strong SQL tuning abilities and understanding of columnar storage',
    ],
    required_skills: ['Python', 'PostgreSQL', 'SQL', 'Docker', 'Linux', 'Git'],
    preferred_skills: ['Kafka', 'ClickHouse', 'Flink', 'AWS', 'Redis', 'Kubernetes'],
    evidence_criteria: [
      {
        type: 'project',
        label: 'Streaming data pipeline or analytical dashboard backend',
        weight: 'high',
      },
      {
        type: 'code_proof',
        label: 'Repository demonstrating schema validation and event processing',
        weight: 'medium',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-seed-8',
    title: 'Autonomous Systems Core Engineer',
    company: 'Apex Robotics & Mobility',
    company_logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=128&q=80',
    location: 'Palo Alto, CA',
    remote_type: 'onsite',
    employment_type: 'Full-time',
    experience_level: 'senior',
    department: 'Robotics',
    salary_min: 180000,
    salary_max: 235000,
    salary_currency: 'USD',
    equity: '0.20% - 0.40%',
    description:
      'Develop real-time perception and path-planning modules running on edge embedded computers. You will fuse LiDAR, camera, and IMU data to guide autonomous warehouse robotics safely through dynamic environments.',
    responsibilities: [
      'Develop deterministic state estimation and sensor fusion filters in modern C++ and ROS 2',
      'Implement dynamic obstacle avoidance and trajectory optimization algorithms',
      'Optimize deep neural network inference on NVIDIA Jetson edge accelerators using TensorRT',
      'Conduct hardware-in-the-loop simulation runs and real-world robot field testing',
    ],
    requirements: [
      '4+ years experience in robotics, autonomous vehicles, or embedded computer vision',
      'Expertise in modern C++ (C++17/20), Python, and ROS / ROS 2',
      'Strong mathematical foundation in 3D geometry, Kalman filtering, and numerical optimization',
      'Experience with Linux real-time kernels and hardware sensor protocols (CAN, Ethernet, USB)',
    ],
    required_skills: ['C++', 'Python', 'Linux', 'Git', 'CUDA', 'Docker'],
    preferred_skills: ['ROS 2', 'TensorRT', 'OpenCV', 'LiDAR', 'Robotics', 'Embedded Systems'],
    evidence_criteria: [
      {
        type: 'project',
        label: 'Robotics perception, SLAM, or path planning codebase',
        weight: 'high',
      },
      {
        type: 'code_proof',
        label: 'Simulation video or sensor fusion telemetry logs',
        weight: 'high',
      },
    ],
    status: 'published',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Local storage keys for resilient offline operation
const STORAGE_KEY_APPLICATIONS = 'ryvolt_local_job_applications';
const STORAGE_KEY_SAVED_JOBS = 'ryvolt_local_saved_jobs';

export const jobService = {
  /**
   * Fetch all published jobs with optional client/server filtering
   */
  async getJobs(params?: JobFilterParams): Promise<Job[]> {
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (params?.department && params.department !== 'all') {
        query = query.eq('department', params.department);
      }
      if (params?.remoteType && params.remoteType !== 'all') {
        query = query.eq('remote_type', params.remoteType);
      }
      if (params?.experienceLevel && params.experienceLevel !== 'all') {
        query = query.eq('experience_level', params.experienceLevel);
      }
      if (params?.minSalary) {
        query = query.gte('salary_max', params.minSalary);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        // Fallback to rich seed jobs
        return this.filterLocalJobs(DEFAULT_JOBS, params);
      }

      return this.filterLocalJobs(data as Job[], params);
    } catch {
      return this.filterLocalJobs(DEFAULT_JOBS, params);
    }
  },

  /**
   * Get single job by ID
   */
  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!error && data) {
        return data as Job;
      }
    } catch {
      // Fallback
    }

    const found = DEFAULT_JOBS.find((j) => j.id === jobId);
    return found || null;
  },

  /**
   * In-memory / client-side filter helper
   */
  filterLocalJobs(jobs: Job[], params?: JobFilterParams): Job[] {
    if (!params) return jobs;

    return jobs.filter((job) => {
      // Text query match (title, company, description, or skills)
      if (params.query && params.query.trim() !== '') {
        const q = params.query.toLowerCase().trim();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesDesc = job.description.toLowerCase().includes(q);
        const matchesSkill =
          job.required_skills.some((s) => s.toLowerCase().includes(q)) ||
          job.preferred_skills.some((s) => s.toLowerCase().includes(q));

        if (!matchesTitle && !matchesCompany && !matchesDesc && !matchesSkill) {
          return false;
        }
      }

      // Department filter
      if (params.department && params.department !== 'all' && job.department !== params.department) {
        return false;
      }

      // Remote filter
      if (params.remoteType && params.remoteType !== 'all' && job.remote_type !== params.remoteType) {
        return false;
      }

      // Experience level filter
      if (params.experienceLevel && params.experienceLevel !== 'all' && job.experience_level !== params.experienceLevel) {
        return false;
      }

      // Minimum salary
      if (params.minSalary && job.salary_max < params.minSalary) {
        return false;
      }

      return true;
    });
  },

  /**
   * Calculate deterministic Career Twin Match Score between Candidate and Job
   */
  calculateTwinMatch(
    candidateSkills: CandidateSkill[] = [],
    candidateProjects: CandidateProject[] = [],
    job: Job
  ): TwinMatchBreakdown {
    // 1. Normalize all candidate skills
    const candidateSkillSet = new Set<string>();
    candidateSkills.forEach((s) => {
      candidateSkillSet.add(s.name.toLowerCase().trim());
      // Also map variants (e.g., 'typescript' <-> 'ts', 'react' <-> 'react.js')
      if (s.name.toLowerCase().includes('react')) candidateSkillSet.add('react');
      if (s.name.toLowerCase().includes('typescript')) candidateSkillSet.add('ts');
      if (s.name.toLowerCase().includes('postgres')) candidateSkillSet.add('sql');
      if (s.name.toLowerCase().includes('node')) candidateSkillSet.add('nodejs');
    });

    // 2. Add technologies mentioned in verified projects
    const verifiedProjectTechs = new Set<string>();
    candidateProjects.forEach((p) => {
      p.technologies?.forEach((t) => {
        const norm = t.toLowerCase().trim();
        candidateSkillSet.add(norm);
        if (p.verified || p.repo_url) {
          verifiedProjectTechs.add(norm);
        }
      });
    });

    // 3. Match against Required Skills
    const required = job.required_skills || [];
    const matchedRequired: string[] = [];
    const missingRequired: string[] = [];

    required.forEach((req) => {
      const norm = req.toLowerCase().trim();
      const hasDirect = candidateSkillSet.has(norm);
      const hasPartial = Array.from(candidateSkillSet).some(
        (cs) => cs.includes(norm) || norm.includes(cs)
      );

      if (hasDirect || hasPartial) {
        matchedRequired.push(req);
      } else {
        missingRequired.push(req);
      }
    });

    // 4. Match against Preferred Skills
    const preferred = job.preferred_skills || [];
    const matchedPreferred: string[] = [];

    preferred.forEach((pref) => {
      const norm = pref.toLowerCase().trim();
      const hasDirect = candidateSkillSet.has(norm);
      const hasPartial = Array.from(candidateSkillSet).some(
        (cs) => cs.includes(norm) || norm.includes(cs)
      );

      if (hasDirect || hasPartial) {
        matchedPreferred.push(pref);
      }
    });

    // 5. Calculate Score Components:
    // Base weight: Required skills account for up to 65% of the total score
    const requiredRatio = required.length > 0 ? matchedRequired.length / required.length : 1;
    const requiredScore = requiredRatio * 65;

    // Preferred skills account for up to 20%
    const preferredRatio = preferred.length > 0 ? matchedPreferred.length / preferred.length : 0.5;
    const preferredScore = preferredRatio * 20;

    // Evidence bonus: verified projects matching required technologies add up to 15%
    let verifiedCount = 0;
    required.forEach((req) => {
      if (verifiedProjectTechs.has(req.toLowerCase().trim())) {
        verifiedCount++;
      }
    });
    const evidenceBonus = Math.min(15, Math.round((verifiedCount / Math.max(1, required.length)) * 15));

    let totalScore = Math.round(requiredScore + preferredScore + evidenceBonus);
    // Baseline minimum of 35% if candidate has any engineering profile data
    if (candidateSkills.length > 0 && totalScore < 35) {
      totalScore = 35;
    }
    totalScore = Math.min(99, Math.max(15, totalScore));

    let matchLevel: 'Exceptional' | 'Strong' | 'Competitive' | 'Developing' = 'Developing';
    if (totalScore >= 85) matchLevel = 'Exceptional';
    else if (totalScore >= 72) matchLevel = 'Strong';
    else if (totalScore >= 55) matchLevel = 'Competitive';

    let feedback = '';
    if (matchedRequired.length === required.length) {
      feedback = `Full required competency coverage (${matchedRequired.length}/${required.length}). Verified project artifacts strongly validate your engineering craft.`;
    } else if (matchedRequired.length > 0) {
      feedback = `Solid match on ${matchedRequired.join(', ')}. Bridge the gap on ${missingRequired.slice(0, 2).join(' and ')} by attaching code evidence or running BuildLab verification.`;
    } else {
      feedback = `Target role requires foundational focus in ${missingRequired.slice(0, 3).join(', ')}.`;
    }

    return {
      score: totalScore,
      matchedRequired,
      missingRequired,
      matchedPreferred,
      evidenceBonus,
      matchLevel,
      feedback,
    };
  },

  /**
   * Fetch saved jobs for a candidate
   */
  async getSavedJobIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', userId);

      if (!error && data) {
        return data.map((d: any) => d.job_id);
      }
    } catch {
      // Local fallback
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_SAVED_JOBS}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Toggle save/unsave a job
   */
  async toggleSaveJob(userId: string, jobId: string): Promise<boolean> {
    try {
      // Check if already saved
      const { data } = await (supabase as any)
        .from('saved_jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .maybeSingle();

      if (data) {
        // Delete
        await (supabase as any).from('saved_jobs').delete().eq('id', (data as any).id);
        this.updateLocalSaved(userId, jobId, false);
        return false;
      } else {
        // Insert
        await (supabase as any).from('saved_jobs').insert({ user_id: userId, job_id: jobId });
        this.updateLocalSaved(userId, jobId, true);
        return true;
      }
    } catch {
      // Offline fallback
      const saved = await this.getSavedJobIds(userId);
      const isSaved = saved.includes(jobId);
      this.updateLocalSaved(userId, jobId, !isSaved);
      return !isSaved;
    }
  },

  updateLocalSaved(userId: string, jobId: string, shouldAdd: boolean) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_SAVED_JOBS}_${userId}`);
      let list: string[] = raw ? JSON.parse(raw) : [];
      if (shouldAdd) {
        if (!list.includes(jobId)) list.push(jobId);
      } else {
        list = list.filter((id) => id !== jobId);
      }
      localStorage.setItem(`${STORAGE_KEY_SAVED_JOBS}_${userId}`, JSON.stringify(list));
    } catch {
      // Ignore
    }
  },

  /**
   * Fetch all candidate applications with joined job records
   */
  async getApplications(userId: string): Promise<JobApplication[]> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, job:jobs(*)')
        .eq('user_id', userId)
        .order('applied_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as JobApplication[];
      }
    } catch {
      // Local fallback
    }

    // Load from local storage
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_APPLICATIONS}_${userId}`);
      if (raw) {
        const apps: JobApplication[] = JSON.parse(raw);
        // Hydrate job details if missing
        return apps.map((app) => {
          if (!app.job) {
            app.job = DEFAULT_JOBS.find((j) => j.id === app.job_id) || DEFAULT_JOBS[0];
          }
          return app;
        });
      }
    } catch {
      // Ignore
    }

    return [];
  },

  /**
   * Submit new application to a job
   */
  async submitApplication(params: {
    userId: string;
    jobId: string;
    resumeId?: string | null;
    coverLetter?: string | null;
    matchScore: number;
    jobTitle?: string;
    companyName?: string;
  }): Promise<JobApplication> {
    const initialTimeline: ApplicationTimelineEvent[] = [
      {
        timestamp: new Date().toISOString(),
        status: 'applied',
        note: 'Application submitted with Career Twin verified competency profile.',
        actor: 'candidate',
      },
    ];

    const newApp: JobApplication = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: params.userId,
      job_id: params.jobId,
      resume_id: params.resumeId || null,
      cover_letter: params.coverLetter || null,
      status: 'applied',
      match_score: params.matchScore,
      notes: `Applied for ${params.jobTitle || 'Role'} at ${params.companyName || 'Company'}`,
      timeline: initialTimeline,
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      job: DEFAULT_JOBS.find((j) => j.id === params.jobId),
    };

    try {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .insert({
          user_id: params.userId,
          job_id: params.jobId,
          resume_id: params.resumeId || null,
          cover_letter: params.coverLetter || null,
          status: 'applied',
          match_score: params.matchScore,
          notes: newApp.notes,
          timeline: initialTimeline as any,
        })
        .select('*, job:jobs(*)')
        .single();

      if (!error && data) {
        this.saveLocalApplication(params.userId, data as JobApplication);
        return data as JobApplication;
      }
    } catch {
      // Ignore
    }

    this.saveLocalApplication(params.userId, newApp);
    return newApp;
  },

  /**
   * Update application status (e.g. Move through Kanban stages)
   */
  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    newStatus: ApplicationStatus,
    note?: string
  ): Promise<JobApplication | null> {
    const newEvent: ApplicationTimelineEvent = {
      timestamp: new Date().toISOString(),
      status: newStatus,
      note: note || `Status transitioned to ${newStatus.replace('_', ' ').toUpperCase()}`,
      actor: 'candidate',
    };

    // Update in Supabase
    try {
      const { data: current } = await (supabase as any)
        .from('job_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (current) {
        const timeline = [...(current.timeline || []), newEvent];
        const { data, error } = await (supabase as any)
          .from('job_applications')
          .update({
            status: newStatus,
            timeline: timeline as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId)
          .select('*, job:jobs(*)')
          .single();

        if (!error && data) {
          this.updateLocalApplication(userId, data as JobApplication);
          return data as JobApplication;
        }
      }
    } catch {
      // Local fallback
    }

    // Local update
    try {
      const apps = await this.getApplications(userId);
      const target = apps.find((a) => a.id === applicationId);
      if (target) {
        target.status = newStatus;
        target.timeline.push(newEvent);
        target.updated_at = new Date().toISOString();
        this.updateLocalApplication(userId, target);
        return target;
      }
    } catch {
      // Ignore
    }

    return null;
  },

  /**
   * Withdraw application
   */
  async withdrawApplication(userId: string, applicationId: string): Promise<boolean> {
    return (
      (await this.updateApplicationStatus(
        userId,
        applicationId,
        'withdrawn',
        'Application voluntarily withdrawn by candidate.'
      )) !== null
    );
  },

  saveLocalApplication(userId: string, app: JobApplication) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_APPLICATIONS}_${userId}`);
      const list: JobApplication[] = raw ? JSON.parse(raw) : [];
      list.unshift(app);
      localStorage.setItem(`${STORAGE_KEY_APPLICATIONS}_${userId}`, JSON.stringify(list));
    } catch {
      // Ignore
    }
  },

  updateLocalApplication(userId: string, updated: JobApplication) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_APPLICATIONS}_${userId}`);
      let list: JobApplication[] = raw ? JSON.parse(raw) : [];
      list = list.map((a) => (a.id === updated.id ? updated : a));
      localStorage.setItem(`${STORAGE_KEY_APPLICATIONS}_${userId}`, JSON.stringify(list));
    } catch {
      // Ignore
    }
  },
};
