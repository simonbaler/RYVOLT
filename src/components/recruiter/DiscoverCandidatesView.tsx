import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  CheckCircle2,
  FolderPlus,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Code2,
  Sparkles,
  MapPin,
  Bookmark,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService, CandidateDiscoveryResult } from '../../services/recruiterService';
import { RecruiterShortlist } from '../../types/database';
import { audioService } from '../../lib/audioService';

interface DiscoverCandidatesViewProps {
  onScheduleInterview?: (candidate: CandidateDiscoveryResult) => void;
}

export const DiscoverCandidatesView: React.FC<DiscoverCandidatesViewProps> = ({
  onScheduleInterview,
}) => {
  const [candidates, setCandidates] = useState<CandidateDiscoveryResult[]>([]);
  const [shortlists, setShortlists] = useState<RecruiterShortlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDiscoveryResult | null>(null);

  // Shortlist modal
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
  const [activeCandidateForShortlist, setActiveCandidateForShortlist] = useState<CandidateDiscoveryResult | null>(null);
  const [targetShortlistId, setTargetShortlistId] = useState<string>('');
  const [newShortlistTitle, setNewShortlistTitle] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [cands, sls] = await Promise.all([
          recruiterService.discoverCandidates(),
          recruiterService.getShortlists('recruiter-active'),
        ]);
        setCandidates(cands);
        setShortlists(sls);
        if (sls.length > 0) setTargetShortlistId(sls[0].id);
      } catch (err) {
        console.error('Failed to load candidate discovery:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const filter = {
      query: searchQuery.trim(),
      skills: selectedSkill !== 'all' ? [selectedSkill] : undefined,
    };
    const results = await recruiterService.discoverCandidates(filter);
    setCandidates(results);
    setLoading(false);
  };

  const handleSaveToShortlist = async () => {
    if (!activeCandidateForShortlist) return;

    if (newShortlistTitle.trim()) {
      const created = await recruiterService.createShortlist('recruiter-active', newShortlistTitle.trim());
      await recruiterService.addCandidateToShortlist('recruiter-active', created.id, activeCandidateForShortlist.id);
      setShortlists([created, ...shortlists]);
    } else if (targetShortlistId) {
      await recruiterService.addCandidateToShortlist('recruiter-active', targetShortlistId, activeCandidateForShortlist.id);
    }

    audioService.playSaveSuccess();
    setShortlistModalOpen(false);
    setActiveCandidateForShortlist(null);
    setNewShortlistTitle('');
  };

  const allSkills = Array.from(
    new Set(candidates.flatMap((c) => c.skills.map((s) => s.name)))
  ).slice(0, 8);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Discover Engineering Talent</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search candidates by verified git commit history, system architectures, and benchmarked evidence artifacts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by engineer name, target role, or technical discipline..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSearch}
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Filter Talent
          </Button>
        </div>

        {/* Quick Skill Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            onClick={() => {
              setSelectedSkill('all');
              recruiterService.discoverCandidates({ query: searchQuery }).then(setCandidates);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              selectedSkill === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Disciplines
          </button>
          {allSkills.map((sk) => (
            <button
              key={sk}
              onClick={() => {
                setSelectedSkill(sk);
                recruiterService.discoverCandidates({ query: searchQuery, skills: [sk] }).then(setCandidates);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                selectedSkill === sk
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sk}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {candidates.map((cand) => (
          <div
            key={cand.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                    {cand.display_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {cand.display_name}
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {cand.target_role || 'Systems Engineer'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    audioService.playClick();
                    setActiveCandidateForShortlist(cand);
                    setShortlistModalOpen(true);
                  }}
                  title="Bookmark candidate to shortlist"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {cand.headline}
              </p>

              {cand.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3" />
                  <span>{cand.location}</span>
                </div>
              )}

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cand.skills.slice(0, 4).map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <span>{s.name}</span>
                    {s.verified && <CheckCircle2 className="w-2.5 h-2.5 text-cyan-500" />}
                  </span>
                ))}
                {cand.skills.length > 4 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{cand.skills.length - 4} more
                  </span>
                )}
              </div>

              {/* Verified Project Artifacts */}
              {cand.highlighted_projects.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold uppercase tracking-wider">Verified Repositories:</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono font-medium">
                      {cand.verified_projects_count} verified
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cand.highlighted_projects.slice(0, 2).map((proj) => (
                      <div
                        key={proj}
                        className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded flex items-center gap-1.5 truncate"
                      >
                        <Code2 className="w-3 h-3 text-cyan-500 shrink-0" />
                        <span className="truncate">{proj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCandidate(cand)}
                className="w-full text-xs justify-center"
              >
                Inspect Twin
              </Button>
              {onScheduleInterview && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onScheduleInterview(cand)}
                  className="w-full text-xs justify-center"
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                >
                  Interview
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Twin Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedCandidate.display_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedCandidate.display_name}
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {selectedCandidate.target_role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-semibold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                  Verified Headline & Background
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  {selectedCandidate.headline}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                  Full Verified Competencies Matrix
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCandidate.skills.map((s) => (
                    <div
                      key={s.name}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                        {s.proficiency_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                  Cataloged Code Repositories
                </h4>
                <div className="space-y-1.5">
                  {selectedCandidate.highlighted_projects.map((proj) => (
                    <div
                      key={proj}
                      className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 font-mono flex items-center justify-between"
                    >
                      <span className="text-indigo-950 dark:text-indigo-200">{proj}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                        Verified Sandbox Test Passed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCandidate(null)}
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add To Shortlist Modal */}
      {shortlistModalOpen && activeCandidateForShortlist && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-500" />
              <span>Save Candidate to Shortlist</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCandidateForShortlist.display_name}</span> to a team shortlist folder for collaborative review.
            </p>

            <div className="space-y-3">
              {shortlists.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Existing Folder
                  </label>
                  <select
                    value={targetShortlistId}
                    onChange={(e) => setTargetShortlistId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {shortlists.map((sl) => (
                      <option key={sl.id} value={sl.id}>
                        {sl.title} ({sl.candidate_ids.length} candidates)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Or Create New Shortlist Folder
                </label>
                <input
                  type="text"
                  value={newShortlistTitle}
                  onChange={(e) => setNewShortlistTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Staff Leads"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShortlistModalOpen(false);
                  setActiveCandidateForShortlist(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveToShortlist}
              >
                Confirm Bookmark
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
