/**
 * RYVOLT — Candidate Privacy, Security & Abuse Prevention Service
 * Multi-tier storage: Supabase PostgreSQL with schema cache tolerance,
 * persistent local storage fallback, and account protection boundaries.
 */

import { supabase, isSupabaseConfigured, isSchemaCacheError } from '../lib/supabase';
import { UserPrivacySettings, UserBlockReport } from '../types/database';

const PRIVACY_STORAGE_KEY = 'ryvolt_privacy_settings';
const BLOCKS_STORAGE_KEY = 'ryvolt_user_blocks';

const defaultPrivacySettings = (userId: string): UserPrivacySettings => ({
  user_id: userId,
  profile_visibility: 'public',
  allow_connection_requests: true,
  allow_direct_messages: 'connections_only',
  show_email: false,
  show_phone: false,
  notify_connections: true,
  notify_messages: true,
  notify_jobs: true,
  notify_applications: true,
  updated_at: new Date().toISOString(),
});

function getLocalPrivacy(userId: string): UserPrivacySettings {
  try {
    const raw = localStorage.getItem(`${PRIVACY_STORAGE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return defaultPrivacySettings(userId);
}

function setLocalPrivacy(userId: string, data: UserPrivacySettings): void {
  try {
    localStorage.setItem(`${PRIVACY_STORAGE_KEY}_${userId}`, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

export const privacySettingsService = {
  /**
   * Get candidate privacy and notification bounds
   */
  async getSettings(userId: string): Promise<UserPrivacySettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_privacy_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          setLocalPrivacy(userId, data as UserPrivacySettings);
          return data as UserPrivacySettings;
        }
      } catch {
        // Fallback
      }
    }

    return getLocalPrivacy(userId);
  },

  /**
   * Update candidate privacy and notification preferences
   */
  async updateSettings(
    userId: string,
    updates: Partial<UserPrivacySettings>
  ): Promise<UserPrivacySettings> {
    const current = getLocalPrivacy(userId);
    const updated: UserPrivacySettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data } = await (supabase.from('user_privacy_settings') as any)
          .upsert(updated, { onConflict: 'user_id' })
          .select()
          .single();

        if (data) {
          setLocalPrivacy(userId, data as UserPrivacySettings);
          return data as UserPrivacySettings;
        }
      } catch {
        // Fallback
      }
    }

    setLocalPrivacy(userId, updated);
    return updated;
  },

  /**
   * Submit abuse report against a post or user
   */
  async reportContent(
    reporterId: string,
    targetUserId: string,
    reason: string
  ): Promise<void> {
    const report: UserBlockReport = {
      id: crypto.randomUUID(),
      reporter_id: reporterId,
      target_user_id: targetUserId,
      action_type: 'report',
      reason,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('user_blocks_reports') as any).insert(report);
      } catch {
        // Fallback
      }
    }

    try {
      const raw = localStorage.getItem(`${BLOCKS_STORAGE_KEY}_${reporterId}`);
      const list: UserBlockReport[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(`${BLOCKS_STORAGE_KEY}_${reporterId}`, JSON.stringify([...list, report]));
    } catch {
      // Ignore
    }
  },

  /**
   * Block a user
   */
  async blockUser(reporterId: string, targetUserId: string, reason?: string): Promise<void> {
    const block: UserBlockReport = {
      id: crypto.randomUUID(),
      reporter_id: reporterId,
      target_user_id: targetUserId,
      action_type: 'block',
      reason: reason || 'Blocked by user',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('user_blocks_reports') as any).insert(block);
      } catch {
        // Fallback
      }
    }

    try {
      const raw = localStorage.getItem(`${BLOCKS_STORAGE_KEY}_${reporterId}`);
      const list: UserBlockReport[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(`${BLOCKS_STORAGE_KEY}_${reporterId}`, JSON.stringify([...list, block]));
    } catch {
      // Ignore
    }
  },
};
