/**
 * RYVOLT — Candidate Unified Notification Service
 * Multi-tier storage: Supabase PostgreSQL with schema cache tolerance,
 * persistent local storage fallback, unread counters, and instant updates.
 */

import { supabase, isSupabaseConfigured, isSchemaCacheError } from '../lib/supabase';
import { CandidateNotification, NotificationType } from '../types/database';

const NOTIFICATIONS_STORAGE_KEY = 'ryvolt_notifications';

const defaultStarterNotifications = (userId: string): CandidateNotification[] => [
  {
    id: `notif-1-${userId.slice(0, 8)}`,
    user_id: userId,
    title: 'Connection Accepted',
    message: 'Devon Vance accepted your connection request. You can now exchange direct messages.',
    type: 'connection_accepted',
    link: '#candidate-messaging',
    read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: `notif-2-${userId.slice(0, 8)}`,
    user_id: userId,
    title: 'Application Received',
    message: 'Nexus Cloud Fabric received your application for Senior Distributed Systems Engineer.',
    type: 'application_update',
    link: '#candidate-applications',
    read: false,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: `notif-3-${userId.slice(0, 8)}`,
    user_id: userId,
    title: 'BuildLab Test Attestation Verified',
    message: 'Your commit proof SHA a89c72e1 for raft-consensus-go was certified (48/48 tests passed).',
    type: 'post_reaction',
    link: '#candidate-buildlab',
    read: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: `notif-4-${userId.slice(0, 8)}`,
    user_id: userId,
    title: 'New Connection Request',
    message: 'Ananya Sharma (Frontend Architect) sent you a connection request.',
    type: 'connection_request',
    link: '#candidate-network',
    read: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

function getLocalNotifications(userId: string): CandidateNotification[] {
  try {
    const raw = localStorage.getItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  const initial = defaultStarterNotifications(userId);
  setLocalNotifications(userId, initial);
  return initial;
}

function setLocalNotifications(userId: string, notifs: CandidateNotification[]): void {
  try {
    localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`, JSON.stringify(notifs));
  } catch {
    // Ignore
  }
}

export const notificationService = {
  /**
   * Fetch all notifications for a candidate
   */
  async getNotifications(userId: string): Promise<CandidateNotification[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('candidate_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setLocalNotifications(userId, data as CandidateNotification[]);
          return data as CandidateNotification[];
        }
      } catch (err) {
        console.warn('[RYVOLT] notifications fetch warning:', err);
      }
    }

    return getLocalNotifications(userId);
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('candidate_notifications') as any)
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', userId);
      } catch {
        // Fallback
      }
    }

    const notifs = getLocalNotifications(userId);
    setLocalNotifications(
      userId,
      notifs.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('candidate_notifications') as any)
          .update({ read: true })
          .eq('user_id', userId);
      } catch {
        // Fallback
      }
    }

    const notifs = getLocalNotifications(userId);
    setLocalNotifications(
      userId,
      notifs.map((n) => ({ ...n, read: true }))
    );
  },

  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    link?: string
  ): Promise<CandidateNotification> {
    const newNotif: CandidateNotification = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
      read: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data } = await (supabase.from('candidate_notifications') as any)
          .insert({
            user_id: userId,
            title,
            message,
            type,
            link: link || null,
            read: false,
          })
          .select()
          .single();

        if (data) {
          const notifs = getLocalNotifications(userId);
          setLocalNotifications(userId, [data as CandidateNotification, ...notifs]);
          return data as CandidateNotification;
        }
      } catch {
        // Fallback
      }
    }

    const notifs = getLocalNotifications(userId);
    setLocalNotifications(userId, [newNotif, ...notifs]);
    return newNotif;
  },
};
