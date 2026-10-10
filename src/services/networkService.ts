/**
 * RYVOLT — Professional Network Service
 * Multi-tier storage: Supabase PostgreSQL with schema cache tolerance,
 * persistent local storage fallback, mutual connection state machine,
 * candidate discovery, and recommendation matching.
 */

import { supabase, isSupabaseConfigured, isSchemaCacheError } from '../lib/supabase';
import { NetworkConnection, ConnectionStatus } from '../types/database';

const CONNECTIONS_STORAGE_KEY = 'ryvolt_network_connections';

export interface DiscoverablePerson {
  id: string;
  display_name: string;
  headline: string;
  location: string;
  avatar_path: string | null;
  institution?: string;
  degree?: string;
  primary_skills: string[];
  verified_status?: 'verified' | 'pending' | 'none';
  mutual_connections_count: number;
  connection_status: 'none' | 'pending_outgoing' | 'pending_incoming' | 'connected';
  connection_id?: string;
}

const defaultSeedPeople: DiscoverablePerson[] = [
  {
    id: 'user-net-1',
    display_name: 'Sophia Liang',
    headline: 'Senior Cloud Native Architect · Kubernetes SIG Member',
    location: 'San Francisco, CA',
    avatar_path: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&q=80',
    institution: 'UC Berkeley',
    degree: 'B.S. Electrical Engineering & CS',
    primary_skills: ['Go', 'Kubernetes', 'eBPF', 'Prometheus', 'Docker'],
    verified_status: 'verified',
    mutual_connections_count: 8,
    connection_status: 'none',
  },
  {
    id: 'user-net-2',
    display_name: 'Devon Vance',
    headline: 'Backend Infrastructure Engineer · Distributed Systems',
    location: 'Austin, TX',
    avatar_path: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&q=80',
    institution: 'MIT',
    degree: 'M.S. Computer Science',
    primary_skills: ['Go', 'Rust', 'Raft Consensus', 'Linux', 'PostgreSQL'],
    verified_status: 'verified',
    mutual_connections_count: 5,
    connection_status: 'connected',
  },
  {
    id: 'user-net-3',
    display_name: 'Kavita Raman',
    headline: 'Machine Learning Systems Researcher · vLLM & Triton',
    location: 'New York, NY',
    avatar_path: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&q=80',
    institution: 'Stanford University',
    degree: 'Ph.D. Computer Science',
    primary_skills: ['Python', 'PyTorch', 'CUDA', 'Triton', 'C++'],
    verified_status: 'verified',
    mutual_connections_count: 12,
    connection_status: 'pending_outgoing',
  },
  {
    id: 'user-net-4',
    display_name: 'Liam Gallagher',
    headline: 'Cryptographic Protocols Engineer · Rust & Zero Knowledge',
    location: 'Boston, MA',
    avatar_path: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=128&q=80',
    institution: 'Carnegie Mellon University',
    degree: 'B.S. Computer Science & Mathematics',
    primary_skills: ['Rust', 'Cryptography', 'WebAssembly', 'C++', 'Security'],
    verified_status: 'verified',
    mutual_connections_count: 4,
    connection_status: 'none',
  },
  {
    id: 'user-net-5',
    display_name: 'Ananya Sharma',
    headline: 'High-Craft Frontend Architect · React 19 & Web Audio',
    location: 'San Jose, CA',
    avatar_path: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=128&q=80',
    institution: 'University of Washington',
    degree: 'B.S. Informatics',
    primary_skills: ['TypeScript', 'React', 'Tailwind CSS', 'Vite', 'Next.js'],
    verified_status: 'pending',
    mutual_connections_count: 7,
    connection_status: 'pending_incoming',
  },
  {
    id: 'user-net-6',
    display_name: 'Alexander Schmidt',
    headline: 'Real-time Audio & DSP Engineer · WebAssembly & C++',
    location: 'Berlin, Germany',
    avatar_path: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=128&q=80',
    institution: 'TU Berlin',
    degree: 'M.Sc. Audio Communication',
    primary_skills: ['C++', 'WebAssembly', 'Web Audio API', 'Python', 'Docker'],
    verified_status: 'verified',
    mutual_connections_count: 3,
    connection_status: 'none',
  },
];

function getLocalConnections(userId: string): NetworkConnection[] {
  try {
    const raw = localStorage.getItem(`${CONNECTIONS_STORAGE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  // Initialize with seed connections
  const initial: NetworkConnection[] = [
    {
      id: 'conn-seed-1',
      requester_id: 'user-net-2',
      recipient_id: userId,
      status: 'accepted',
      note: 'Loved your Raft consensus project write-up!',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      partner_profile: {
        id: 'user-net-2',
        display_name: 'Devon Vance',
        headline: 'Backend Infrastructure Engineer · MIT Alumni',
        avatar_path: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&q=80',
        location: 'Austin, TX',
        primary_skills: ['Go', 'Rust', 'Raft Consensus', 'Linux'],
      },
    },
    {
      id: 'conn-seed-2',
      requester_id: 'user-net-5',
      recipient_id: userId,
      status: 'pending',
      note: 'Connecting from the Frontend Systems circle.',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      partner_profile: {
        id: 'user-net-5',
        display_name: 'Ananya Sharma',
        headline: 'High-Craft Frontend Architect · React 19',
        avatar_path: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=128&q=80',
        location: 'San Jose, CA',
        primary_skills: ['TypeScript', 'React', 'Tailwind CSS'],
      },
    },
  ];
  setLocalConnections(userId, initial);
  return initial;
}

function setLocalConnections(userId: string, conns: NetworkConnection[]): void {
  try {
    localStorage.setItem(`${CONNECTIONS_STORAGE_KEY}_${userId}`, JSON.stringify(conns));
  } catch {
    // Ignore
  }
}

export const networkService = {
  /**
   * Get all accepted connections for a user
   */
  async getAcceptedConnections(userId: string): Promise<NetworkConnection[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('network_connections')
          .select('*')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

        if (!error && data) {
          // Hydrate profiles
          const connectionsWithProfiles: NetworkConnection[] = [];
          for (const c of data as any[]) {
            const partnerId = c.requester_id === userId ? c.recipient_id : c.requester_id;
            const { data: p } = await supabase
              .from('profiles')
              .select('id, display_name, headline, avatar_path, location, primary_skills')
              .eq('id', partnerId)
              .maybeSingle();

            connectionsWithProfiles.push({
              ...c,
              partner_profile: p || {
                id: partnerId,
                display_name: 'Peer Engineer',
                headline: null,
                avatar_path: null,
                location: null,
              },
            });
          }

          setLocalConnections(userId, connectionsWithProfiles);
          return connectionsWithProfiles;
        }
      } catch (err) {
        console.warn('[RYVOLT] network connections fetch warning:', err);
      }
    }

    const all = getLocalConnections(userId);
    return all.filter((c) => c.status === 'accepted');
  },

  /**
   * Get pending incoming and outgoing connection requests
   */
  async getPendingRequests(userId: string): Promise<{
    incoming: NetworkConnection[];
    outgoing: NetworkConnection[];
  }> {
    if (isSupabaseConfigured()) {
      try {
        const { data: incoming } = await supabase
          .from('network_connections')
          .select('*')
          .eq('recipient_id', userId)
          .eq('status', 'pending');

        const { data: outgoing } = await supabase
          .from('network_connections')
          .select('*')
          .eq('requester_id', userId)
          .eq('status', 'pending');

        if (incoming || outgoing) {
          return {
            incoming: (incoming as any[]) || [],
            outgoing: (outgoing as any[]) || [],
          };
        }
      } catch {
        // Fallback
      }
    }

    const all = getLocalConnections(userId);
    return {
      incoming: all.filter((c) => c.status === 'pending' && c.recipient_id === userId),
      outgoing: all.filter((c) => c.status === 'pending' && c.requester_id === userId),
    };
  },

  /**
   * Send a connection request
   */
  async sendConnectionRequest(
    requesterId: string,
    recipientId: string,
    note?: string,
    recipientProfile?: NetworkConnection['partner_profile']
  ): Promise<NetworkConnection> {
    if (requesterId === recipientId) {
      throw new Error('Cannot connect with yourself.');
    }

    const newConnection: NetworkConnection = {
      id: crypto.randomUUID(),
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
      note: note || null,
      partner_profile: recipientProfile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.from('network_connections') as any)
          .insert({
            requester_id: requesterId,
            recipient_id: recipientId,
            status: 'pending',
            note: note || null,
          })
          .select()
          .single();

        if (!error && data) {
          const list = getLocalConnections(requesterId);
          setLocalConnections(requesterId, [{ ...data, partner_profile: recipientProfile }, ...list]);
          return { ...data, partner_profile: recipientProfile };
        }
      } catch {
        // Fallback
      }
    }

    const list = getLocalConnections(requesterId);
    setLocalConnections(requesterId, [newConnection, ...list]);
    return newConnection;
  },

  /**
   * Accept an incoming connection request
   */
  async acceptConnectionRequest(requestId: string, currentUserId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('network_connections') as any)
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId)
          .eq('recipient_id', currentUserId);
      } catch {
        // Fallback
      }
    }

    const list = getLocalConnections(currentUserId);
    setLocalConnections(
      currentUserId,
      list.map((c) =>
        c.id === requestId ? { ...c, status: 'accepted' as ConnectionStatus, updated_at: new Date().toISOString() } : c
      )
    );
  },

  /**
   * Decline a connection request
   */
  async declineConnectionRequest(requestId: string, currentUserId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('network_connections') as any)
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', requestId)
          .eq('recipient_id', currentUserId);
      } catch {
        // Fallback
      }
    }

    const list = getLocalConnections(currentUserId);
    setLocalConnections(
      currentUserId,
      list.filter((c) => c.id !== requestId)
    );
  },

  /**
   * Remove an existing connection
   */
  async removeConnection(connectionId: string, currentUserId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase.from('network_connections') as any)
          .delete()
          .eq('id', connectionId)
          .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);
      } catch {
        // Fallback
      }
    }

    const list = getLocalConnections(currentUserId);
    setLocalConnections(
      currentUserId,
      list.filter((c) => c.id !== connectionId)
    );
  },

  /**
   * Discover and search candidates/peers
   */
  async discoverPeople(
    currentUserId: string,
    query?: string,
    filterSkill?: string
  ): Promise<DiscoverablePerson[]> {
    const localConnections = getLocalConnections(currentUserId);

    // Merge default seeds with any DB profiles
    let people = [...defaultSeedPeople];

    if (isSupabaseConfigured()) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, headline, location, avatar_path, primary_skills')
          .neq('id', currentUserId)
          .limit(20);

        if (profiles && profiles.length > 0) {
          const dbPeople: DiscoverablePerson[] = (profiles as any[]).map((p) => ({
            id: p.id,
            display_name: p.display_name,
            headline: p.headline || 'Software Systems Engineer',
            location: p.location || 'San Francisco, CA',
            avatar_path: p.avatar_path,
            primary_skills: p.primary_skills || ['TypeScript', 'React', 'PostgreSQL'],
            mutual_connections_count: 2,
            connection_status: 'none',
          }));

          people = [...people.filter((sp) => !dbPeople.some((dbp) => dbp.id === sp.id)), ...dbPeople];
        }
      } catch {
        // Fallback to seeds
      }
    }

    // Annotate connection status dynamically
    const annotated = people
      .filter((p) => p.id !== currentUserId)
      .map((p) => {
        const conn = localConnections.find(
          (c) =>
            (c.requester_id === currentUserId && c.recipient_id === p.id) ||
            (c.recipient_id === currentUserId && c.requester_id === p.id)
        );

        let status: DiscoverablePerson['connection_status'] = 'none';
        if (conn) {
          if (conn.status === 'accepted') {
            status = 'connected';
          } else if (conn.status === 'pending') {
            status = conn.requester_id === currentUserId ? 'pending_outgoing' : 'pending_incoming';
          }
        }

        return {
          ...p,
          connection_status: status,
          connection_id: conn?.id,
        };
      });

    // Apply search filter
    return annotated.filter((p) => {
      if (query && query.trim() !== '') {
        const q = query.toLowerCase().trim();
        const matchesName = p.display_name.toLowerCase().includes(q);
        const matchesHeadline = p.headline.toLowerCase().includes(q);
        const matchesLocation = p.location.toLowerCase().includes(q);
        const matchesSkills = p.primary_skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesHeadline && !matchesLocation && !matchesSkills) {
          return false;
        }
      }

      if (filterSkill && filterSkill !== 'all') {
        const hasSkill = p.primary_skills.some(
          (s) => s.toLowerCase() === filterSkill.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      return true;
    });
  },
};
