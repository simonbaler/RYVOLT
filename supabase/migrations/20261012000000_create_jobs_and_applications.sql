-- ============================================================================
-- RYVOLT Migration 20261012000000: Jobs, Applications, Saved Jobs & Integrations
-- Phase 04: Real Job Discovery, Application Tracking, and n8n/Telegram Integrations
-- ============================================================================

-- 1. Table: jobs (Verified Technical Requisitions)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT NOT NULL,
  remote_type TEXT NOT NULL CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'principal')),
  department TEXT NOT NULL,
  salary_min INTEGER NOT NULL,
  salary_max INTEGER NOT NULL,
  salary_currency TEXT NOT NULL DEFAULT 'USD',
  equity TEXT,
  description TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_skills TEXT[] NOT NULL DEFAULT '{}',
  evidence_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: saved_jobs (Candidate Bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- 3. Table: job_applications (Submitted Applications & Pipeline Tracking)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.candidate_resumes(id) ON DELETE SET NULL,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'interview_scheduled', 'interviewed', 'offered', 'rejected', 'withdrawn')),
  match_score INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: candidate_integrations (Telegram & n8n Webhook Settings)
CREATE TABLE IF NOT EXISTS public.candidate_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id TEXT,
  telegram_username TEXT,
  telegram_pairing_code TEXT,
  telegram_enabled BOOLEAN NOT NULL DEFAULT false,
  telegram_notify_status BOOLEAN NOT NULL DEFAULT true,
  telegram_notify_jobs BOOLEAN NOT NULL DEFAULT true,
  n8n_webhook_url TEXT,
  n8n_webhook_secret TEXT,
  n8n_events TEXT[] NOT NULL DEFAULT '{application.status_changed, job.high_match, twin.verified_evidence}',
  n8n_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_department ON public.jobs(department);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON public.jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs
-- Anyone can view published jobs
CREATE POLICY "Public read published jobs" ON public.jobs
  FOR SELECT USING (status = 'published');

-- Only admins/recruiters can manage jobs
CREATE POLICY "Staff insert jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('recruiter', 'admin')
    )
  );

CREATE POLICY "Staff update jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('recruiter', 'admin')
    )
  );

-- RLS Policies for saved_jobs
CREATE POLICY "Users read own saved jobs" ON public.saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved jobs" ON public.saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved jobs" ON public.saved_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for job_applications
CREATE POLICY "Users read own job applications" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('recruiter', 'admin')
    )
  );

CREATE POLICY "Users insert own job applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own job applications" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('recruiter', 'admin')
    )
  );

CREATE POLICY "Users delete own job applications" ON public.job_applications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for candidate_integrations
CREATE POLICY "Users read own integrations" ON public.candidate_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own integrations" ON public.candidate_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own integrations" ON public.candidate_integrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Seed Initial High-Quality Technical Requisitions
INSERT INTO public.jobs (
  title, company, company_logo, location, remote_type, employment_type, experience_level,
  department, salary_min, salary_max, equity, description, responsibilities, requirements,
  required_skills, preferred_skills, evidence_criteria, status
) VALUES
(
  'Senior Distributed Systems Engineer',
  'Nexus Cloud Fabric',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
  'San Francisco, CA',
  'remote',
  'full-time',
  'senior',
  'Infrastructure',
  175000,
  225000,
  '0.15% - 0.35%',
  'Build next-generation fault-tolerant state-machine replication layers serving over 2M requests/sec. You will architect multi-region consensus protocols, optimize write-ahead logging under Linux kernel io_uring, and ensure verifiable zero-data-loss durability.',
  ARRAY[
    'Architect and benchmark consensus replication primitives using Raft or Paxos',
    'Tune lock-free concurrent memory ringbuffers and low-latency storage engines',
    'Write automated chaos engineering suites simulating asymmetric network splits',
    'Participate in on-call rotations for tier-0 distributed database nodes'
  ],
  ARRAY[
    '5+ years building backend systems in Go, Rust, or modern C++',
    'Deep understanding of Raft, Paxos, LSM trees, and Linux system calls',
    'Track record of optimizing p99 latencies under high network contention',
    'Commitment to writing deterministic unit and integration test fixtures'
  ],
  ARRAY['Go', 'Rust', 'Distributed Systems', 'Raft', 'Linux', 'Docker'],
  ARRAY['io_uring', 'gRPC', 'eBPF', 'Prometheus', 'Kubernetes'],
  '[{"type": "project", "label": "Verifiable consensus implementation or storage engine artifact", "weight": "high"}, {"type": "code_proof", "label": "Demonstrated benchmark suite under network partition", "weight": "medium"}]'::jsonb,
  'published'
),
(
  'Lead AI / LLM Infrastructure Engineer',
  'Cognitive Frontier Labs',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=128&q=80',
  'New York, NY',
  'hybrid',
  'full-time',
  'lead',
  'Machine Learning',
  195000,
  255000,
  '0.20% - 0.45%',
  'Lead our model serving infrastructure team deploying multi-modal neural architectures. Build high-throughput vLLM clusters, distributed KV-cache paging, and low-latency inference streaming APIs for millions of simultaneous developers.',
  ARRAY[
    'Direct the architecture of GPU inference clusters utilizing Triton and vLLM',
    'Implement speculative decoding pipelines and continuous batching schedulers',
    'Minimize cold-start weights distribution across Kubernetes nodes using BitTorrent/peer protocols',
    'Collaborate directly with foundation model researchers on quantization strategies'
  ],
  ARRAY[
    'Demonstrated leadership in production ML serving at scale',
    'Proficiency with Python, C++, PyTorch, CUDA, and Triton Server',
    'Hands-on expertise with FlashAttention, FP8/AWQ quantization, and KV-cache optimizations',
    'Experience architecting multi-GPU distributed orchestration'
  ],
  ARRAY['Python', 'PyTorch', 'CUDA', 'Kubernetes', 'Docker', 'FastAPI'],
  ARRAY['vLLM', 'Triton', 'C++', 'Ray', 'TensorRT-LLM', 'AWS'],
  '[{"type": "project", "label": "Open-source ML serving system or model inference pipeline", "weight": "high"}, {"type": "benchmark", "label": "Documented latency/throughput benchmark metrics", "weight": "high"}]'::jsonb,
  'published'
),
(
  'Staff Full-Stack Systems Architect',
  'RYVOLT Core Technologies',
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=128&q=80',
  'Austin, TX',
  'remote',
  'full-time',
  'principal',
  'Product Engineering',
  185000,
  240000,
  '0.25% - 0.50%',
  'Spearhead the core Career Twin architecture, real-time reactive graph state, and deterministic synthesis engines. We reject resume fluff and create verifiable proof layers connecting developer repositories to career progression.',
  ARRAY[
    'Own the frontend-to-database architectural integrity across React 19, TypeScript, and Supabase/PostgreSQL',
    'Design reactive state management paradigms handling complex evidence networks without performance degradation',
    'Partner with product design to build tactile, keyboard-accessible, and visually magnetic UI primitives',
    'Lead rigorous technical design reviews and mentor senior product engineers'
  ],
  ARRAY[
    '7+ years shipping high-craft web applications and complex interactive workspaces',
    'Mastery of modern TypeScript, React, Tailwind CSS, PostgreSQL, and Web APIs',
    'Obsession with performance: sub-100ms interactions, zero layout shifts, clean bundle splitting',
    'Deep empathy for developer experience, type safety, and verifiable system architecture'
  ],
  ARRAY['TypeScript', 'React', 'PostgreSQL', 'Tailwind CSS', 'Node.js', 'Next.js'],
  ARRAY['WebSockets', 'GraphQL', 'Supabase', 'Docker', 'Vite', 'CI/CD'],
  '[{"type": "portfolio", "label": "Live production application or high-craft developer tool", "weight": "high"}, {"type": "code_proof", "label": "Clean architecture repository demonstrating strict type safety", "weight": "high"}]'::jsonb,
  'published'
),
(
  'Senior Cloud Platform & Kubernetes Engineer',
  'InfraMesh Networks',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80',
  'Seattle, WA',
  'remote',
  'full-time',
  'senior',
  'Platform Ops',
  165000,
  210000,
  '0.10% - 0.25%',
  'Empower hundreds of software engineers to deploy safely with zero friction. You will architect GitOps declarative delivery pipelines, write custom Kubernetes operators in Go, and harden multi-tenant ingress boundaries.',
  ARRAY[
    'Develop Kubernetes custom controllers (CRDs) in Go to automate cloud resource provisioning',
    'Maintain declarative GitOps pipelines via ArgoCD across 40+ production clusters',
    'Enforce zero-trust service mesh networking using Istio and mTLS policies',
    'Optimize cloud spend through automated node autoscaling and spot instance management'
  ],
  ARRAY[
    '4+ years managing production Kubernetes environments in AWS or GCP',
    'Proven ability to write production-grade Go code for Kubernetes operators',
    'Deep expertise with Terraform, ArgoCD, Helm, Prometheus, and Grafana',
    'Strong foundation in Linux networking, Cilium, and DNS troubleshooting'
  ],
  ARRAY['Kubernetes', 'Go', 'AWS', 'Terraform', 'Docker', 'Linux'],
  ARRAY['ArgoCD', 'Helm', 'Istio', 'Prometheus', 'eBPF', 'GCP'],
  '[{"type": "project", "label": "Kubernetes operator or declarative infrastructure repository", "weight": "high"}, {"type": "certification", "label": "CKA/CKS or equivalent cloud architecture credentials", "weight": "medium"}]'::jsonb,
  'published'
),
(
  'Principal Security & Rust Systems Engineer',
  'ZeroTrust Protocol',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=128&q=80',
  'Boston, MA',
  'hybrid',
  'full-time',
  'principal',
  'Security & Cryptography',
  210000,
  270000,
  '0.30% - 0.60%',
  'Design cryptographic key management engines and secure enclave execution runtimes in pure Rust. Protect mission-critical enterprise telemetry from zero-day memory corruption and side-channel leakage.',
  ARRAY[
    'Implement memory-safe protocol decoders and TLS termination in Rust',
    'Integrate hardware security modules (HSM) and AWS Nitro Enclaves',
    'Conduct automated fuzzing campaigns and formal verification of cryptographic handshakes',
    'Formulate threat models and establish enterprise zero-trust cryptographic baselines'
  ],
  ARRAY[
    '8+ years in systems programming with extensive production Rust experience',
    'Deep theoretical and practical knowledge of applied cryptography (AES-GCM, Ed25519, Kyber)',
    'Experience running code inside Intel SGX or AWS Nitro Enclaves',
    'Proven vulnerability research or verifiable security audit history'
  ],
  ARRAY['Rust', 'Cryptography', 'Linux', 'Security', 'C++', 'Git'],
  ARRAY['WebAssembly', 'eBPF', 'AWS', 'Docker', 'Go'],
  '[{"type": "audit", "label": "Public security audit or CVE remediation history", "weight": "high"}, {"type": "code_proof", "label": "Cryptographic Rust crate or enclave project repository", "weight": "high"}]'::jsonb,
  'published'
),
(
  'Senior Frontend & Design Systems Engineer',
  'Vivid Interfaces',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=128&q=80',
  'San Francisco, CA',
  'remote',
  'full-time',
  'senior',
  'Design Engineering',
  160000,
  205000,
  '0.15% - 0.30%',
  'Bridge the boundary between aesthetic perfection and rock-solid frontend engineering. Craft reusable accessible UI component libraries, micro-interactions, responsive spatial layouts, and silky smooth data visualizations.',
  ARRAY[
    'Maintain and scale an accessible React & Tailwind component library used by 50+ developers',
    'Implement fluid physics-driven micro-interactions using Motion and CSS transforms',
    'Enforce WCAG 2.1 AA accessibility compliance across all keyboard, screen reader, and color contrast tests',
    'Profile and optimize browser frame rates to guarantee 60fps rendering during intensive dashboard manipulations'
  ],
  ARRAY[
    '5+ years crafting consumer-facing or complex SaaS web interfaces',
    'Mastery of modern CSS, Tailwind, TypeScript, React, and browser rendering engines',
    'Obsessive attention to typographic rhythm, tactile feedback, and spatial balance',
    'Strong understanding of web accessibility standards (ARIA, keyboard navigation, contrast ratios)'
  ],
  ARRAY['TypeScript', 'React', 'Tailwind CSS', 'CSS3', 'HTML5', 'Figma'],
  ARRAY['Motion', 'Vite', 'Storybook', 'Next.js', 'Web Audio API', 'Canvas API'],
  '[{"type": "portfolio", "label": "Interactive component library or high-polish web app demo", "weight": "high"}, {"type": "project", "label": "Production UI system with accessible interactive states", "weight": "medium"}]'::jsonb,
  'published'
),
(
  'Backend Data Platform Engineer',
  'StreamVelocity Analytics',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=128&q=80',
  'Denver, CO',
  'hybrid',
  'full-time',
  'mid',
  'Data Engineering',
  145000,
  185000,
  '0.08% - 0.20%',
  'Construct real-time streaming data pipelines processing 50k events per second. You will maintain Apache Kafka clusters, write stream transformation jobs in Flink, and build high-performance OLAP query layers.',
  ARRAY[
    'Design and maintain Kafka event streams, schema registries, and dead-letter queues',
    'Build stateful stream processing pipelines in Apache Flink and Python/Java',
    'Model analytical schemas in ClickHouse and PostgreSQL for sub-second business dashboards',
    'Automate data quality validation checks with automated alerting'
  ],
  ARRAY[
    '3+ years building data pipelines and backend microservices',
    'Experience with Apache Kafka, ClickHouse, PostgreSQL, and Python or Java/Scala',
    'Familiarity with distributed data consistency and exactly-once processing semantics',
    'Strong SQL tuning abilities and understanding of columnar storage'
  ],
  ARRAY['Python', 'PostgreSQL', 'SQL', 'Docker', 'Linux', 'Git'],
  ARRAY['Kafka', 'ClickHouse', 'Flink', 'AWS', 'Redis', 'Kubernetes'],
  '[{"type": "project", "label": "Streaming data pipeline or analytical dashboard backend", "weight": "high"}, {"type": "code_proof", "label": "Repository demonstrating schema validation and event processing", "weight": "medium"}]'::jsonb,
  'published'
),
(
  'Autonomous Systems Core Engineer',
  'Apex Robotics & Mobility',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=128&q=80',
  'Palo Alto, CA',
  'onsite',
  'full-time',
  'senior',
  'Robotics',
  180000,
  235000,
  '0.20% - 0.40%',
  'Develop real-time perception and path-planning modules running on edge embedded computers. You will fuse LiDAR, camera, and IMU data to guide autonomous warehouse robotics safely through dynamic environments.',
  ARRAY[
    'Develop deterministic state estimation and sensor fusion filters in modern C++ and ROS 2',
    'Implement dynamic obstacle avoidance and trajectory optimization algorithms',
    'Optimize deep neural network inference on NVIDIA Jetson edge accelerators using TensorRT',
    'Conduct hardware-in-the-loop simulation runs and real-world robot field testing'
  ],
  ARRAY[
    '4+ years experience in robotics, autonomous vehicles, or embedded computer vision',
    'Expertise in modern C++ (C++17/20), Python, and ROS / ROS 2',
    'Strong mathematical foundation in 3D geometry, Kalman filtering, and numerical optimization',
    'Experience with Linux real-time kernels and hardware sensor protocols (CAN, Ethernet, USB)'
  ],
  ARRAY['C++', 'Python', 'Linux', 'Git', 'CUDA', 'Docker'],
  ARRAY['ROS 2', 'TensorRT', 'OpenCV', 'LiDAR', 'Robotics', 'Embedded Systems'],
  '[{"type": "project", "label": "Robotics perception, SLAM, or path planning codebase", "weight": "high"}, {"type": "code_proof", "label": "Simulation video or sensor fusion telemetry logs", "weight": "high"}]'::jsonb,
  'published'
);
