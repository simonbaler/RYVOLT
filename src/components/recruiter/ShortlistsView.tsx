import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Users,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService, CandidateDiscoveryResult } from '../../services/recruiterService';
import { RecruiterShortlist } from '../../types/database';
import { audioService } from '../../lib/audioService';

interface ShortlistsViewProps {
  onScheduleInterview?: (candidate: CandidateDiscoveryResult) => void;
}

export const ShortlistsView: React.FC<ShortlistsViewProps> = ({
  onScheduleInterview,
}) => {
  const [shortlists, setShortlists] = useState<RecruiterShortlist[]>([]);
  const [candidates, setCandidates] = useState<CandidateDiscoveryResult[]>([]);
  const [selectedShortlist, setSelectedShortlist] = useState<RecruiterShortlist | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    async function load() {
      const [sls, cands] = await Promise.all([
        recruiterService.getShortlists('recruiter-active'),
        recruiterService.discoverCandidates(),
      ]);
      setShortlists(sls);
      setCandidates(cands);
      if (sls.length > 0) setSelectedShortlist(sls[0]);
    }
    load();
  }, []);

  const handleCreateShortlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await recruiterService.createShortlist(
      'recruiter-active',
      newTitle.trim(),
      newDesc.trim() || undefined
    );
    audioService.playSaveSuccess();
    setShortlists([created, ...shortlists]);
    setSelectedShortlist(created);
    setNewTitle('');
    setNewDesc('');
    setShowCreateForm(false);
  };

  const currentCandidates = selectedShortlist
    ? candidates.filter((c) => selectedShortlist.candidate_ids.includes(c.id))
    : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Hiring Team Shortlists</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize engineering candidates into collaborative project folders with verified skill proofs.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateForm(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Shortlist Folder
        </Button>
      </div>

      {/* Create Modal / Popout */}
      {showCreateForm && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md animate-scaleUp">
          <form onSubmit={handleCreateShortlist} className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Shortlist Folder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Folder title (e.g. Distributed Consensus Leads)..."
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Notes for the team (optional)..."
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Folder
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Split view: Shortlists list & Selected Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Folders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 shadow-xs transition-colors">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
            Shortlist Folders ({shortlists.length})
          </h2>

          <div className="space-y-1.5">
            {shortlists.map((sl) => {
              const isSelected = selectedShortlist?.id === sl.id;
              return (
                <div
                  key={sl.id}
                  onClick={() => {
                    audioService.playClick();
                    setSelectedShortlist(sl);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{sl.title}</span>
                    <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800">
                      {sl.candidate_ids.length}
                    </span>
                  </div>
                  {sl.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {sl.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Bookmarked Candidates */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-xs transition-colors">
          {selectedShortlist ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedShortlist.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedShortlist.description || 'Collaborative talent folder'}
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 self-start sm:self-center">
                  {currentCandidates.length} candidate{currentCandidates.length === 1 ? '' : 's'} bookmarked
                </span>
              </div>

              {currentCandidates.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No candidates currently in this folder. Discover talent and use the bookmark action to save candidates here.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentCandidates.map((c) => (
                    <div
                      key={c.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0">
                          {c.display_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.display_name}</h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400">{c.target_role}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{c.headline}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {onScheduleInterview && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onScheduleInterview(c)}
                            leftIcon={<Calendar className="w-3.5 h-3.5" />}
                            className="text-xs h-7 px-2.5"
                          >
                            Schedule Round
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select or create a shortlist folder to view candidates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
