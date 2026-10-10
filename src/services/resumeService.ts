/**
 * RYVOLT — Resume Studio Service
 * Resilient multi-tier data layer with Supabase PostgreSQL primary storage,
 * automatic PostgREST schema-cache tolerance (PGRST205 / 42P01),
 * persistent local storage synchronization, and Career Twin fact synthesis.
 */

import { supabase, isSupabaseConfigured, isSchemaCacheError } from '../lib/supabase';
import {
  ResumeRecord,
  ResumeVersionRecord,
  ResumeContent,
  ResumeTemplateId,
  ProfileRow,
  CandidateSkill,
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
  CandidateCertification,
  CandidateAchievement,
} from '../types/database';

const RESUME_STORAGE_PREFIX = 'ryvolt_resumes_';
const VERSIONS_STORAGE_PREFIX = 'ryvolt_resume_versions_';

function getLocalResumes(userId: string): ResumeRecord[] {
  try {
    const raw = localStorage.getItem(`${RESUME_STORAGE_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

function setLocalResumes(userId: string, resumes: ResumeRecord[]): void {
  try {
    localStorage.setItem(`${RESUME_STORAGE_PREFIX}${userId}`, JSON.stringify(resumes));
  } catch {
    // Ignore
  }
}

function getLocalVersions(resumeId: string): ResumeVersionRecord[] {
  try {
    const raw = localStorage.getItem(`${VERSIONS_STORAGE_PREFIX}${resumeId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

function setLocalVersions(resumeId: string, versions: ResumeVersionRecord[]): void {
  try {
    localStorage.setItem(`${VERSIONS_STORAGE_PREFIX}${resumeId}`, JSON.stringify(versions));
  } catch {
    // Ignore
  }
}

export const defaultResumeContent: ResumeContent = {
  contactInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
  },
  summary: '',
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
};

const defaultStarterResume = (userId: string): ResumeRecord => {
  const content: ResumeContent = {
    contactInfo: {
      fullName: 'Alex Vance',
      email: 'alex.vance@ryvolt.dev',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      headline: 'Senior Distributed Systems & Backend Engineer',
      githubUrl: 'https://github.com/alexvance-eng',
      linkedinUrl: 'https://linkedin.com/in/alexvance-eng',
      portfolioUrl: 'https://alexvance.dev',
    },
    summary:
      'High-rigor software engineer specializing in consensus state machines, fault-tolerant replication, and high-throughput systems across Go, Rust, and TypeScript. Track record of shipping verified code artifacts with 94%+ automated test coverage.',
    skills: [
      {
        id: 'sk-group-1',
        category: 'Core Systems & Languages',
        skills: ['Go', 'Rust', 'TypeScript', 'PostgreSQL', 'Linux', 'Docker'],
      },
      {
        id: 'sk-group-2',
        category: 'Distributed Infrastructure',
        skills: ['Raft Consensus', 'State Machine Replication', 'io_uring', 'gRPC', 'Kubernetes'],
      },
    ],
    experience: [
      {
        id: 'exp-1',
        roleTitle: 'Software Systems Engineer',
        organization: 'ScaleForge Cloud Systems',
        location: 'San Francisco, CA',
        startDate: '2024-07',
        endDate: 'Present',
        isCurrent: true,
        bullets: [
          'Architected Raft consensus coordinator reducing cluster election failover time by 68%',
          'Optimized database connection pooling reducing p99 response times from 180ms to 24ms across tier-0 services',
        ],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Fault-Tolerant Distributed Raft Consensus Engine',
        technologies: ['Go', 'Distributed Systems', 'Raft', 'Linux', 'Docker'],
        repoUrl: 'https://github.com/ryvolt-labs/raft-consensus-go',
        liveUrl: 'https://raft-demo.ryvolt.dev',
        bullets: [
          'Implemented linearizable Raft state machine replication with quorum leader election and chaos-tested partition healing',
          'Engineered lock-free ringbuffers handling 2.1M ops/sec with zero packet drops under network partition',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'California Institute of Technology',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2020-09',
        endDate: '2024-06',
        highlights: ['GPA: 3.92', 'Focus in Distributed Systems, Operating Systems, Algorithm Engineering, and Cryptography.'],
      },
    ],
    certifications: [],
    achievements: [],
  };

  return {
    id: `resume-primary-${userId.slice(0, 8)}`,
    user_id: userId,
    title: 'Distributed Systems & Backend Master (ATS v1)',
    target_role: 'Senior Distributed Systems Engineer',
    template_id: 'classic-ats',
    content,
    is_primary: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const resumeService = {
  // Synthesizes structured resume content from real Career Twin profile facts
  synthesizeFromCareerTwin(
    profile: ProfileRow | null,
    skills: CandidateSkill[],
    education: CandidateEducation[],
    experience: CandidateExperience[],
    projects: CandidateProject[],
    certifications: CandidateCertification[],
    achievements: CandidateAchievement[]
  ): ResumeContent {
    const skillGroupsMap = new Map<string, string[]>();
    for (const skill of skills) {
      const cat = skill.category || 'General';
      const existing = skillGroupsMap.get(cat) || [];
      existing.push(skill.name);
      skillGroupsMap.set(cat, existing);
    }

    const skillsGrouped = Array.from(skillGroupsMap.entries()).map(([cat, list]) => ({
      id: crypto.randomUUID(),
      category: cat,
      skills: list,
    }));

    return {
      contactInfo: {
        fullName: profile?.display_name || '',
        email: '',
        location: profile?.location || '',
        headline: profile?.headline || '',
      },
      summary: profile?.headline
        ? `${profile.headline} with demonstrated software engineering project experience in ${profile.target_role || 'software systems'}. Proven track record shipping verifiable code artifacts.`
        : '',
      skills: skillsGrouped,
      experience: experience.map((exp) => ({
        id: crypto.randomUUID(),
        roleTitle: exp.role_title,
        organization: exp.organization,
        location: exp.location || '',
        startDate: exp.start_date,
        endDate: exp.end_date || (exp.is_current ? 'Present' : ''),
        isCurrent: exp.is_current,
        bullets: exp.achievements?.length ? exp.achievements : [exp.description || ''],
      })),
      projects: projects.map((proj) => ({
        id: crypto.randomUUID(),
        title: proj.title,
        repoUrl: proj.repo_url || undefined,
        liveUrl: proj.live_url || undefined,
        technologies: proj.technologies || [],
        bullets: proj.highlights?.length ? proj.highlights : [proj.description],
      })),
      education: education.map((edu) => ({
        id: crypto.randomUUID(),
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.field_of_study,
        startDate: edu.start_date,
        endDate: edu.end_date || (edu.is_current ? 'Present' : ''),
        gradeOrGpa: edu.grade_or_gpa || undefined,
        highlights: edu.description ? [edu.description] : [],
      })),
      certifications: certifications.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        issuingOrg: c.issuing_org,
        date: c.issue_date,
        credentialUrl: c.credential_url || undefined,
      })),
      achievements: achievements.map((a) => ({
        id: crypto.randomUUID(),
        title: a.title,
        date: a.date || '',
        description: a.description || '',
      })),
    };
  },

  // --------------------------------------------------------------------------
  // RESUME CRUD
  // --------------------------------------------------------------------------
  async getResumes(userId: string): Promise<ResumeRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setLocalResumes(userId, data as ResumeRecord[]);
          return data as ResumeRecord[];
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] resumes query error:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] resumes query exception:', err);
      }
    }

    const cached = getLocalResumes(userId);
    if (cached.length > 0) return cached;

    const starter = [defaultStarterResume(userId)];
    setLocalResumes(userId, starter);
    return starter;
  },

  async getResume(id: string, userId: string): Promise<ResumeRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return data as unknown as ResumeRecord;
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] getResume query notice:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] getResume exception:', err);
      }
    }

    const list = getLocalResumes(userId);
    return list.find((r) => r.id === id) || null;
  },

  async createResume(
    userId: string,
    title: string,
    targetRole: string,
    templateId: ResumeTemplateId = 'classic-ats',
    initialContent?: ResumeContent
  ): Promise<ResumeRecord> {
    const content = initialContent || {
      ...defaultResumeContent,
      contactInfo: { ...defaultResumeContent.contactInfo, headline: targetRole },
    };

    const newResume: ResumeRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      target_role: targetRole,
      template_id: templateId,
      content,
      is_primary: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('resumes') as any)
          .insert({
            user_id: userId,
            title,
            target_role: targetRole,
            template_id: templateId,
            content,
            is_primary: false,
          })
          .select()
          .single();

        if (!error && data) {
          const list = getLocalResumes(userId);
          setLocalResumes(userId, [data as ResumeRecord, ...list]);

          // Attempt v1 snapshot
          try {
            await (supabase.from('resume_versions') as any).insert({
              resume_id: data.id,
              user_id: userId,
              version_number: 1,
              version_label: 'Initial Draft (v1)',
              snapshot_content: content,
            });
          } catch {
            // Version snapshot fallback
          }

          return data as ResumeRecord;
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] createResume insert error:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] createResume exception:', err);
      }
    }

    const list = getLocalResumes(userId);
    setLocalResumes(userId, [newResume, ...list]);

    // Local snapshot
    const v1: ResumeVersionRecord = {
      id: crypto.randomUUID(),
      resume_id: newResume.id,
      user_id: userId,
      version_number: 1,
      version_label: 'Initial Draft (v1)',
      snapshot_content: content,
      created_at: new Date().toISOString(),
    };
    setLocalVersions(newResume.id, [v1]);

    return newResume;
  },

  async updateResume(
    id: string,
    userId: string,
    updates: Partial<ResumeRecord>
  ): Promise<ResumeRecord> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('resumes') as any)
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          const list = getLocalResumes(userId);
          const updated = list.map((r) => (r.id === id ? (data as ResumeRecord) : r));
          setLocalResumes(userId, updated);
          return data as ResumeRecord;
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] updateResume notice:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] updateResume exception:', err);
      }
    }

    const list = getLocalResumes(userId);
    const updated = list.map((r) =>
      r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
    );
    setLocalResumes(userId, updated);
    return updated.find((r) => r.id === id) || { ...(updates as ResumeRecord), id, user_id: userId };
  },

  async duplicateResume(id: string, userId: string, newTitle?: string): Promise<ResumeRecord> {
    const existing = await this.getResume(id, userId);
    if (!existing) throw new Error('Resume not found to duplicate.');

    const title = newTitle || `${existing.title} (Copy)`;
    return this.createResume(
      userId,
      title,
      existing.target_role,
      existing.template_id,
      existing.content
    );
  },

  async deleteResume(id: string, userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('resumes')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] deleteResume notice:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] deleteResume exception:', err);
      }
    }

    const list = getLocalResumes(userId);
    setLocalResumes(
      userId,
      list.filter((r) => r.id !== id)
    );
  },

  // --------------------------------------------------------------------------
  // VERSION HISTORY
  // --------------------------------------------------------------------------
  async getVersions(resumeId: string, userId: string): Promise<ResumeVersionRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('resume_id', resumeId)
          .eq('user_id', userId)
          .order('version_number', { ascending: false });

        if (!error && data && data.length > 0) {
          setLocalVersions(resumeId, data as ResumeVersionRecord[]);
          return data as ResumeVersionRecord[];
        }
      } catch {
        // Fallback
      }
    }

    return getLocalVersions(resumeId);
  },

  async createVersionSnapshot(
    resumeId: string,
    userId: string,
    label: string,
    content: ResumeContent
  ): Promise<ResumeVersionRecord> {
    const existingVersions = await this.getVersions(resumeId, userId);
    const nextNumber = existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.version_number)) + 1 : 1;

    const newVersion: ResumeVersionRecord = {
      id: crypto.randomUUID(),
      resume_id: resumeId,
      user_id: userId,
      version_number: nextNumber,
      version_label: label || `Revision v${nextNumber}`,
      snapshot_content: content,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('resume_versions') as any)
          .insert({
            resume_id: resumeId,
            user_id: userId,
            version_number: nextNumber,
            version_label: label || `Revision v${nextNumber}`,
            snapshot_content: content,
          })
          .select()
          .single();

        if (!error && data) {
          const versions = getLocalVersions(resumeId);
          setLocalVersions(resumeId, [data as ResumeVersionRecord, ...versions]);
          return data as ResumeVersionRecord;
        }
      } catch {
        // Fallback
      }
    }

    const versions = getLocalVersions(resumeId);
    setLocalVersions(resumeId, [newVersion, ...versions]);
    return newVersion;
  },

  async restoreVersionSnapshot(
    resumeId: string,
    userId: string,
    version: ResumeVersionRecord
  ): Promise<ResumeRecord> {
    return this.updateResume(resumeId, userId, {
      content: version.snapshot_content,
    });
  },
};
