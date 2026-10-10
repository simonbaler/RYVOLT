import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { networkService, DiscoverablePerson } from '../../services/networkService';
import { NetworkConnection } from '../../types/database';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Users,
  UserCheck,
  UserPlus,
  Send,
  MessageSquare,
  CheckCircle2,
  X,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Trash2,
  ChevronRight,
} from 'lucide-react';

interface MyNetworkViewProps {
  onOpenChatWithUser?: (partnerId: string, partnerProfile?: any) => void;
  onNavigateToFindPeople?: () => void;
}

export const MyNetworkView: React.FC<MyNetworkViewProps> = ({
  onOpenChatWithUser,
  onNavigateToFindPeople,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'demo-candidate';

  const [activeTab, setActiveTab] = useState<'connections' | 'incoming' | 'outgoing'>('connections');
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<NetworkConnection[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<NetworkConnection[]>([]);
  const [suggestions, setSuggestions] = useState<DiscoverablePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadNetwork();
  }, [user]);

  const loadNetwork = async () => {
    setIsLoading(true);
    try {
      const [accepted, pending, people] = await Promise.all([
        networkService.getAcceptedConnections(currentUserId),
        networkService.getPendingRequests(currentUserId),
        networkService.discoverPeople(currentUserId),
      ]);

      setConnections(accepted);
      setIncomingRequests(pending.incoming);
      setOutgoingRequests(pending.outgoing);
      setSuggestions(people.filter((p) => p.connection_status === 'none').slice(0, 4));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await networkService.acceptConnectionRequest(requestId, currentUserId);
      setFeedback({ message: 'Connection accepted. You can now exchange direct messages.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
      loadNetwork();
    } catch {
      setFeedback({ message: 'Failed to accept connection.', type: 'error' });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await networkService.declineConnectionRequest(requestId, currentUserId);
      setFeedback({ message: 'Connection invitation declined.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
      loadNetwork();
    } catch {
      setFeedback({ message: 'Failed to decline request.', type: 'error' });
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Remove this engineer from your connected network?')) return;
    try {
      await networkService.removeConnection(connectionId, currentUserId);
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      setFeedback({ message: 'Connection removed.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ message: 'Failed to remove connection.', type: 'error' });
    }
  };

  const handleConnectSuggestion = async (person: DiscoverablePerson) => {
    try {
      await networkService.sendConnectionRequest(
        currentUserId,
        person.id,
        'Connecting based on shared systems engineering focus.',
        {
          id: person.id,
          display_name: person.display_name,
          headline: person.headline,
          avatar_path: person.avatar_path,
          location: person.location,
          primary_skills: person.primary_skills,
        }
      );
      setFeedback({ message: `Connection invitation sent to ${person.display_name}.`, type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
      loadNetwork();
    } catch {
      setFeedback({ message: 'Failed to send connection invitation.', type: 'error' });
    }
  };

  const filteredConnections = connections.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const name = c.partner_profile?.display_name?.toLowerCase() || '';
    const headline = c.partner_profile?.headline?.toLowerCase() || '';
    const location = c.partner_profile?.location?.toLowerCase() || '';
    return name.includes(q) || headline.includes(q) || location.includes(q);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Professional Network
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connect with verified software engineers, collaborate on code repositories, and exchange direct messages.
          </p>
        </div>

        {onNavigateToFindPeople && (
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToFindPeople}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Find Engineers
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'connections'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer relative ${
              activeTab === 'incoming'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Invitations Received</span>
            {incomingRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'outgoing'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Sent Requests ({outgoingRequests.length})
          </button>
        </div>

        {activeTab === 'connections' && (
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search your network..."
              className="w-full text-xs pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Accepted Connections */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          {filteredConnections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No connections found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchFilter ? 'No connections matching your filter.' : 'Expand your professional network by discovering and connecting with peer engineers.'}
              </p>
              {onNavigateToFindPeople && (
                <Button size="sm" variant="outline" onClick={onNavigateToFindPeople} className="mt-2">
                  Browse Candidates & Peers
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConnections.map((conn) => {
                const partner = conn.partner_profile;
                if (!partner) return null;

                return (
                  <div
                    key={conn.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 flex items-start justify-between gap-3 shadow-xs transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar
                        name={partner.display_name}
                        src={partner.avatar_path || undefined}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {partner.display_name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {partner.headline || 'Software Systems Engineer'}
                        </p>
                        {partner.location && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{partner.location}</span>
                          </div>
                        )}
                        {partner.primary_skills && partner.primary_skills.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1.5 truncate">
                            Skills: {partner.primary_skills.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenChatWithUser && (
                        <button
                          onClick={() => onOpenChatWithUser(partner.id, partner)}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-medium transition-colors cursor-pointer"
                          title="Message engineer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveConnection(conn.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Remove connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Requests */}
      {activeTab === 'incoming' && (
        <div className="space-y-3">
          {incomingRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
              No pending invitations received.
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={req.partner_profile?.display_name || 'Candidate'}
                    src={req.partner_profile?.avatar_path || undefined}
                    size="md"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {req.partner_profile?.display_name || 'Peer Engineer'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {req.partner_profile?.headline || 'Software Engineer'}
                    </p>
                    {req.note && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 italic">
                        "{req.note}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAccept(req.id)}
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(req.id)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Outgoing Requests */}
      {activeTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
              No pending sent invitations.
            </div>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={req.partner_profile?.display_name || 'Engineer'}
                    src={req.partner_profile?.avatar_path || undefined}
                    size="md"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {req.partner_profile?.display_name || 'Candidate Peer'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Invitation sent {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  Pending Review
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Suggested Engineers Section */}
      {suggestions.length > 0 && (
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Suggested Engineers In Your Track</span>
            </h3>
            {onNavigateToFindPeople && (
              <button
                onClick={onNavigateToFindPeople}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {suggestions.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 text-center space-y-2 shadow-xs transition-colors flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <Avatar
                    name={p.display_name}
                    src={p.avatar_path || undefined}
                    size="md"
                    className="mx-auto"
                  />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.display_name}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                    {p.headline}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {p.primary_skills.slice(0, 2).join(' · ')}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnectSuggestion(p)}
                  className="w-full justify-center text-xs py-1"
                >
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
