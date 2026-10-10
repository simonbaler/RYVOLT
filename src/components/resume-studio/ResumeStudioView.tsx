import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ResumeRecord,
  ResumeTemplateId,
} from '../../types/database';
import { resumeService } from '../../services/resumeService';
import { careerTwinService } from '../../services/careerTwinService';
import { ResumeEditor } from './ResumeEditor';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Edit2,
  ArrowRight,
  Sparkles,
  Printer,
  History,
  CheckCircle2,
  AlertCircle,
  LayoutTemplate,
} from 'lucide-react';

export const ResumeStudioView: React.FC = () => {
  const { user, profile } = useAuth();
  const userId = user?.id || 'guest-builder';

  // State
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeResume, setActiveResume] = useState<ResumeRecord | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetRole, setNewTargetRole] = useState(profile?.target_role || 'Staff Platform Engineer');
  const [newTemplateId, setNewTemplateId] = useState<ResumeTemplateId>('classic-ats');
  const [prefillFromTwin, setPrefillFromTwin] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Rename Modal State
  const [renameTarget, setRenameTarget] = useState<ResumeRecord | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<ResumeRecord | null>(null);

  const loadResumes = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await resumeService.getResumes(userId);
      setResumes(list);
    } catch (err: any) {
      console.error('Error loading resumes:', err);
      setFeedback({ type: 'error', message: 'Unable to load resumes. Using local storage session.' });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // Create New Resume Action
  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      let initialContent = undefined;

      if (prefillFromTwin) {
        const [skills, edu, exp, proj, certs, achs] = await Promise.all([
          careerTwinService.getSkills(userId),
          careerTwinService.getEducation(userId),
          careerTwinService.getExperience(userId),
          careerTwinService.getProjects(userId),
          careerTwinService.getCertifications(userId),
          careerTwinService.getAchievements(userId),
        ]);
        initialContent = resumeService.synthesizeFromCareerTwin(
          profile,
          skills,
          edu,
          exp,
          proj,
          certs,
          achs
        );
      }

      const created = await resumeService.createResume(
        userId,
        newTitle.trim(),
        newTargetRole.trim(),
        newTemplateId,
        initialContent
      );

      setCreateModalOpen(false);
      setNewTitle('');
      await loadResumes();
      setActiveResume(created);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create resume.' });
    } finally {
      setIsCreating(false);
    }
  };

  // Duplicate Resume Action
  const handleDuplicate = async (r: ResumeRecord) => {
    try {
      const copy = await resumeService.duplicateResume(r.id, userId);
      await loadResumes();
      setFeedback({ type: 'success', message: `Duplicated resume: ${copy.title}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to duplicate resume.' });
    }
  };

  // Rename Action
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameTitle.trim()) return;

    try {
      await resumeService.updateResume(renameTarget.id, userId, {
        title: renameTitle.trim(),
      });
      setRenameTarget(null);
      await loadResumes();
      setFeedback({ type: 'success', message: 'Resume renamed.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to rename resume.' });
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await resumeService.deleteResume(deleteTarget.id, userId);
      setDeleteTarget(null);
      await loadResumes();
      setFeedback({ type: 'success', message: 'Resume deleted.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to delete resume.' });
    }
  };

  // If a specific resume is opened in the editor, render the ResumeEditor view
  if (activeResume) {
    return (
      <ResumeEditor
        resume={activeResume}
        onBack={() => {
          setActiveResume(null);
          loadResumes();
        }}
        onUpdated={(updated) => {
          setActiveResume(updated);
          loadResumes();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          role="alert"
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Resume Studio
            </h1>
            <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
              Deterministic Synthesizer
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Build tailored technical resumes citing verified project proof, commit histories, and system benchmarks.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setNewTitle(`${profile?.target_role || 'Engineering'} Resume`);
            setCreateModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Resume
        </Button>
      </div>

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Resumes Created Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
            Create your first tailored technical resume. You can automatically synthesize bullet points from your verified Career Twin records.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-6"
            onClick={() => {
              setNewTitle(`${profile?.target_role || 'Software Engineering'} Resume`);
              setCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create First Resume
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                      Target: {r.target_role}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    {r.template_id}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                  <div>Updated: {new Date(r.updated_at).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <LayoutTemplate className="w-3.5 h-3.5 text-slate-400" />
                    <span>{r.content?.experience?.length || 0} Roles · {r.content?.projects?.length || 0} Projects</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setRenameTarget(r);
                      setRenameTitle(r.title);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(r)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveResume(r)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Open Editor
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* CREATE RESUME MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Resume"
        description="Select target role parameters and initial template layout."
      >
        <form onSubmit={handleCreateResume} className="space-y-4">
          <Input
            label="Resume Title"
            placeholder="e.g. Senior Platform & Infra Resume"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Input
            label="Target Engineering Role"
            placeholder="e.g. Distributed Systems Engineer"
            value={newTargetRole}
            onChange={(e) => setNewTargetRole(e.target.value)}
            required
          />

          <Select
            label="Initial Design Template"
            value={newTemplateId}
            onChange={(e) => setNewTemplateId(e.target.value as ResumeTemplateId)}
            options={[
              { value: 'classic-ats', label: 'Classic ATS (Single-column, High Scannability)' },
              { value: 'modern-pro', label: 'Modern Professional (Balanced Dividers, Clean Header)' },
              { value: 'tech-portfolio', label: 'Technical Portfolio (Evidence & Stack Focused)' },
            ]}
          />

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={prefillFromTwin}
              onChange={(e) => setPrefillFromTwin(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600"
            />
            <div className="text-xs text-indigo-950">
              <span className="font-bold block">Prefill with Career Twin Facts</span>
              <span className="text-[11px] text-indigo-900/80">
                Automatically imports your verified skills, projects, and work history into this draft.
              </span>
            </div>
          </label>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create Resume
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* RENAME MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename Resume"
        description="Update the display title for this resume draft."
      >
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            label="Resume Title"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Title
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* DELETE MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Resume"
        description="Are you sure you want to permanently delete this resume?"
      >
        <p className="text-xs text-slate-600 mb-4">
          This will permanently delete <strong className="text-slate-900">{deleteTarget?.title}</strong> and all its version snapshot history.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
};
