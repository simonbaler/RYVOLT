/**
 * RYVOLT — Candidate Interview Management & Preparation Service
 * Multi-tier storage: Supabase PostgreSQL with schema cache tolerance,
 * persistent local storage fallback, calendar scheduling, and prep checklists.
 */

import { supabase, isSupabaseConfigured, isSchemaCacheError } from '../lib/supabase';
import { CandidateInterview, InterviewFormat, InterviewStatus } from '../types/database';

const INTERVIEWS_STORAGE_KEY = 'ryvolt_candidate_interviews';

const defaultStarterInterviews = (userId: string): CandidateInterview[] => [
  {
    id: `int-1-${userId.slice(0, 8)}`,
    user_id: userId,
    job_id: 'job-seed-1',
    application_id: null,
    job_title: 'Senior Distributed Systems Engineer',
    company_name: 'Nexus Cloud Fabric',
    round_name: 'Technical Systems Architecture & Consensus Deep Dive',
    scheduled_at: new Date(Date.now() + 86400000 * 2 + 3600000 * 3).toISOString(),
    duration_minutes: 60,
    meeting_link: 'https://meet.nexuscloud.io/interview-nexus-892',
    format: 'video',
    status: 'scheduled',
    prep_notes: 'Review Raft leader election invariants, io_uring write batching, and benchmark partition recovery times.',
    candidate_feedback: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: `int-mock-1-${userId.slice(0, 8)}`,
    user_id: userId,
    job_id: 'job-seed-3',
    application_id: null,
    job_title: 'Staff Full-Stack Systems Architect',
    company_name: 'RYVOLT Core Technologies',
    round_name: 'AI Voice Coach — Technical Rigor Simulation',
    scheduled_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    duration_minutes: 30,
    meeting_link: '#voice-coach',
    format: 'ai_mock',
    status: 'completed',
    prep_notes: 'Practiced answering questions on React 19 Concurrent mode, PostgreSQL RLS policies, and distributed transactions.',
    candidate_feedback: 'Confidence 9/10. Great pacing on concurrency explanations. Need to emphasize p99 latency trade-offs.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

function getLocalInterviews(userId: string): CandidateInterview[] {
  try {
    const raw = localStorage.getItem(`${INTERVIEWS_STORAGE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  const initial = defaultStarterInterviews(userId);
  setLocalInterviews(userId, initial);
  return initial;
}

function setLocalInterviews(userId: string, interviews: CandidateInterview[]): void {
  try {
    localStorage.setItem(`${INTERVIEWS_STORAGE_KEY}_${userId}`, JSON.stringify(interviews));
  } catch {
    // Ignore
  }
}

export const interviewService = {
  /**
   * Fetch all interviews for a candidate
   */
  async getInterviews(userId: string): Promise<CandidateInterview[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('candidate_interviews')
          .select('*')
          .eq('user_id', userId)
          .order('scheduled_at', { ascending: true });

        if (!error && data && data.length > 0) {
          setLocalInterviews(userId, data as CandidateInterview[]);
          return data as CandidateInterview[];
        }
      } catch (err) {
        console.warn('[RYVOLT] interviews fetch notice:', err);
      }
    }

    return getLocalInterviews(userId);
  },

  /**
   * Schedule or record an interview
   */
  async scheduleInterview(
    interview: Omit<CandidateInterview, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CandidateInterview> {
    const newInterview: CandidateInterview = {
      ...interview,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('candidate_interviews') as any)
          .insert(interview)
          .select()
          .single();

        if (!error && data) {
          const list = getLocalInterviews(interview.user_id);
          setLocalInterviews(interview.user_id, [...list, data as CandidateInterview]);
          return data as CandidateInterview;
        }
      } catch {
        // Fallback
      }
    }

    const list = getLocalInterviews(interview.user_id);
    setLocalInterviews(interview.user_id, [...list, newInterview]);
    return newInterview;
  },

  /**
   * Update an interview (e.g. status, prep notes, candidate feedback)
   */
  async updateInterview(
    id: string,
    userId: string,
    updates: Partial<CandidateInterview>
  ): Promise<CandidateInterview> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await (supabase.from('candidate_interviews') as any)
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (data) {
          const list = getLocalInterviews(userId);
          const updated = list.map((i) => (i.id === id ? (data as CandidateInterview) : i));
          setLocalInterviews(userId, updated);
          return data as CandidateInterview;
        }
      } catch {
        // Fallback
      }
    }

    const list = getLocalInterviews(userId);
    const updated = list.map((i) => (i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i));
    setLocalInterviews(userId, updated);
    return updated.find((i) => i.id === id)!;
  },

  /**
   * Delete an interview
   */
  async deleteInterview(id: string, userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('candidate_interviews')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch {
        // Fallback
      }
    }

    const list = getLocalInterviews(userId);
    setLocalInterviews(
      userId,
      list.filter((i) => i.id !== id)
    );
  },

  /**
   * Generate an iCal standard calendar event file content
   */
  generateIcsContent(interview: CandidateInterview): string {
    const startDate = new Date(interview.scheduled_at);
    const endDate = new Date(startDate.getTime() + interview.duration_minutes * 60000);

    const formatDate = (date: Date) =>
      date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RYVOLT//Candidate Career Platform//EN',
      'BEGIN:VEVENT',
      `UID:${interview.id}@ryvolt.dev`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${interview.company_name} — ${interview.round_name}`,
      `DESCRIPTION:${interview.job_title}\\nMeeting Link: ${interview.meeting_link || 'TBD'}`,
      `LOCATION:${interview.format === 'video' ? interview.meeting_link || 'Video Call' : 'Onsite'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  },
};
