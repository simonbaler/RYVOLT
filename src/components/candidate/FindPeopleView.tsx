import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { networkService, DiscoverablePerson } from '../../services/networkService';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';

interface FindPeopleViewProps {
  onOpenChatWithUser?: (partnerId: string, partnerProfile?: any) => void;
  onNavigateToNetwork?: () => void;
}

export const FindPeopleView: React.FC<FindPeopleViewProps> = ({
  onOpenChatWithUser,
  onNavigateToNetwork,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'demo-candidate';

  const [people, setPeople] = useState<DiscoverablePerson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<DiscoverablePerson | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const SKILL_TAGS = ['all', 'Go', 'Rust', 'TypeScript', 'Kubernetes', 'React', 'PostgreSQL', 'Docker'];

  useEffect(() => {
    loadPeople();
  }, [user]);

  const loadPeople = async () => {
    setIsLoading(true);
    try {
      const data = await networkService.discoverPeople(currentUserId, searchQuery, selectedSkill);
      setPeople(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      networkService.discoverPeople(currentUserId, searchQuery, selectedSkill).then(setPeople);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedSkill]);

  const handleConnect = async (person: DiscoverablePerson) => {
    try {
      await networkService.sendConnectionRequest(
        currentUserId,
        person.id,
        'Connecting via RYVOLT Engineering Discovery.',
        {
          id: person.id,
          display_name: person.display_name,
          headline: person.headline,
          avatar_path: person.avatar_path,
          location: person.location,
          primary_skills: person.primary_skills,
        }
      );

      setPeople((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, connection_status: 'pending_outgoing' } : p))
      );

      setFeedback({ message: `Connection invitation sent to ${person.display_name}.`, type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ message: 'Failed to send invitation.', type: 'error' });
    }
  };

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

      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-4 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Find Peer Engineers</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Discover candidates and collaborators by verified skills, systems architecture, and university credentials.
            </p>
          </div>

          {onNavigateToNetwork && (
            <Button size="sm" variant="outline" onClick={onNavigateToNetwork}>
              My Network
            </Button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, headline, college, or engineering expertise..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Skill Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
          <span className="text-slate-400 shrink-0 text-[11px] font-medium mr-1">Skills:</span>
          {SKILL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedSkill(tag)}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer shrink-0 ${
                selectedSkill === tag
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tag === 'all' ? 'All Skills' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* People Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-mono animate-pulse">
          Searching candidate network...
        </div>
      ) : people.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No candidates found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different skill filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <div
              key={person.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-xs transition-colors hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={person.display_name}
                      src={person.avatar_path || undefined}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4
                          onClick={() => setSelectedPerson(person)}
                          className="text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
                        >
                          {person.display_name}
                        </h4>
                        {person.verified_status === 'verified' && (
                          <span title="Verified Student / Candidate">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {person.headline}
                      </p>
                    </div>
                  </div>
                </div>

                {person.institution && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{person.institution}</span>
                  </div>
                )}

                {person.location && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{person.location}</span>
                  </div>
                )}

                {/* Skills Unboxed List */}
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono truncate pt-1">
                  {person.primary_skills.slice(0, 4).join(' · ')}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedPerson(person)}
                  className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                >
                  Preview Profile
                </button>

                {person.connection_status === 'connected' ? (
                  onOpenChatWithUser ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenChatWithUser(person.id, person)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Message
                    </Button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                      Connected
                    </span>
                  )
                ) : person.connection_status === 'pending_outgoing' ? (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                    Pending
                  </span>
                ) : person.connection_status === 'pending_incoming' ? (
                  onNavigateToNetwork ? (
                    <Button size="sm" variant="primary" onClick={onNavigateToNetwork}>
                      Review Request
                    </Button>
                  ) : (
                    <span className="text-[11px] text-indigo-600 font-mono">Invited you</span>
                  )
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleConnect(person)}
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Person Detail Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  name={selectedPerson.display_name}
                  src={selectedPerson.avatar_path || undefined}
                  size="lg"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{selectedPerson.display_name}</span>
                    {selectedPerson.verified_status === 'verified' && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedPerson.headline}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPerson(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              {selectedPerson.institution && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Education: </span>
                  {selectedPerson.degree ? `${selectedPerson.degree}, ` : ''}{selectedPerson.institution}
                </div>
              )}
              {selectedPerson.location && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Location: </span>
                  {selectedPerson.location}
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Technical Competencies:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedPerson.primary_skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedPerson(null)}>
                Close
              </Button>
              {selectedPerson.connection_status === 'none' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    handleConnect(selectedPerson);
                    setSelectedPerson(null);
                  }}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Send Invitation
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
