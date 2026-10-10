/**
 * RYVOLT — Student Verification Service
 * Multi-tier storage: Supabase PostgreSQL with schema cache tolerance,
 * persistent local storage fallback, clear state transitions, and secure document handling.
 *
 * States:
 * - not_started: No submission initiated
 * - pending: Evidence uploaded, awaiting verification reviewer
 * - verified: Confirmed by authoritative institutional review
 * - rejected: Evidence invalid or unreadable; resubmission enabled
 * - action_required: Additional documentation requested by reviewer
 */

import { supabase, isSupabaseConfigured, isSchemaCacheError } from '../lib/supabase';
import { StudentVerification, StudentVerificationStatus } from '../types/database';

const STUDENT_VERIF_STORAGE_KEY = 'ryvolt_student_verifications';

export interface SubmitVerificationPayload {
  userId: string;
  institution: string;
  degree: string;
  department: string;
  studentIdNumber?: string;
  expectedGraduationYear: number;
  evidenceUrl?: string;
  evidenceFileName?: string;
}

function getLocalVerification(userId: string): StudentVerification | null {
  try {
    const raw = localStorage.getItem(`${STUDENT_VERIF_STORAGE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return null;
}

function setLocalVerification(userId: string, data: StudentVerification): void {
  try {
    localStorage.setItem(`${STUDENT_VERIF_STORAGE_KEY}_${userId}`, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

export const studentVerificationService = {
  /**
   * Get student verification record for a user
   */
  async getVerification(userId: string): Promise<StudentVerification | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_verifications')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          setLocalVerification(userId, data as StudentVerification);
          return data as StudentVerification;
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] student_verifications query notice:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] student_verifications fetch exception:', err);
      }
    }

    return getLocalVerification(userId);
  },

  /**
   * Submit or resubmit student verification
   */
  async submitVerification(payload: SubmitVerificationPayload): Promise<StudentVerification> {
    const record: StudentVerification = {
      id: crypto.randomUUID(),
      user_id: payload.userId,
      institution: payload.institution.trim(),
      degree: payload.degree.trim(),
      department: payload.department.trim(),
      student_id_number: payload.studentIdNumber?.trim() || null,
      expected_graduation_year: payload.expectedGraduationYear,
      evidence_url: payload.evidenceUrl || null,
      evidence_file_name: payload.evidenceFileName || null,
      status: 'pending', // Strictly pending until authentic reviewer approval
      reviewer_notes: null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('student_verifications') as any)
          .upsert(
            {
              user_id: payload.userId,
              institution: payload.institution.trim(),
              degree: payload.degree.trim(),
              department: payload.department.trim(),
              student_id_number: payload.studentIdNumber?.trim() || null,
              expected_graduation_year: payload.expectedGraduationYear,
              evidence_url: payload.evidenceUrl || null,
              evidence_file_name: payload.evidenceFileName || null,
              status: 'pending',
              submitted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (!error && data) {
          setLocalVerification(payload.userId, data as StudentVerification);
          return data as StudentVerification;
        }

        if (error && !isSchemaCacheError(error)) {
          console.warn('[RYVOLT] student_verifications upsert warning:', error.message);
        }
      } catch (err) {
        console.warn('[RYVOLT] student_verifications upsert exception:', err);
      }
    }

    setLocalVerification(payload.userId, record);
    return record;
  },

  /**
   * Converts file to secure base64 data URI for safe storage without exposing public buckets
   */
  async processEvidenceDocument(file: File): Promise<{ dataUrl: string; fileName: string }> {
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('Evidence document exceeds 8MB maximum size limit.');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Unsupported document format. Please upload a PDF, PNG, or JPG file.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          fileName: file.name,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file contents.'));
      reader.readAsDataURL(file);
    });
  },
};
