import React, { useState, useEffect } from 'react';
import {
  ResumeRecord,
  ResumeVersionRecord,
  ResumeContent,
  ResumeTemplateId,
} from '../../types/database';
import { resumeService } from '../../services/resumeService';
import { careerTwinService } from '../../services/careerTwinService';
import { useAuth } from '../../contexts/AuthContext';
import { ResumeTemplates } from './ResumeTemplates';
import { ResumeAssistantPanel } from './ResumeAssistantPanel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import {
  ArrowLeft,
  Save,
  Printer,
  History,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Download,
  FileCode,
} from 'lucide-react';

export interface ResumeEditorProps {
  resume: ResumeRecord;
  onBack: () => void;
  onUpdated: (updated: ResumeRecord) => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  resume,
  onBack,
  onUpdated,
}) => {
  const { user, profile } = useAuth();
  const userId = user?.id || 'guest-builder';

  // Editor State
  const [content, setContent] = useState<ResumeContent>(resume.content);
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(resume.template_id);
  const [resumeTitle, setResumeTitle] = useState(resume.title);
  const [targetRole, setTargetRole] = useState(resume.target_role);

  const [activeSection, setActiveSection] = useState<'contact' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'ai'>('contact');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Versions Modal
  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [versions, setVersions] = useState<ResumeVersionRecord[]>([]);
  const [versionLabelInput, setVersionLabelInput] = useState('');

  // Import from Career Twin modal
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);

  // Load versions
  const loadVersions = async () => {
    try {
      const v = await resumeService.getVersions(resume.id, userId);
      setVersions(v);
    } catch (err) {
      console.warn('Error loading versions:', err);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [resume.id]);

  // Save current resume state
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await resumeService.updateResume(resume.id, userId, {
        title: resumeTitle.trim(),
        target_role: targetRole.trim(),
        template_id: templateId,
        content,
      });
      onUpdated(updated);
      setFeedback({ type: 'success', message: 'Resume draft saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save resume.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Create Snapshot Version
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionLabelInput.trim()) return;

    try {
      await resumeService.createVersionSnapshot(
        resume.id,
        userId,
        versionLabelInput.trim(),
        content
      );
      setVersionLabelInput('');
      await loadVersions();
      setFeedback({ type: 'success', message: 'Revision snapshot saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to snapshot version.' });
    }
  };

  // Restore Snapshot Version
  const handleRestoreSnapshot = async (v: ResumeVersionRecord) => {
    setContent(v.snapshot_content);
    await resumeService.updateResume(resume.id, userId, {
      content: v.snapshot_content,
    });
    setVersionsModalOpen(false);
    setFeedback({ type: 'success', message: `Restored version: ${v.version_label}` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Import from Career Twin
  const handleImportCareerTwin = async () => {
    try {
      const [skills, edu, exp, proj, certs, achs] = await Promise.all([
        careerTwinService.getSkills(userId),
        careerTwinService.getEducation(userId),
        careerTwinService.getExperience(userId),
        careerTwinService.getProjects(userId),
        careerTwinService.getCertifications(userId),
        careerTwinService.getAchievements(userId),
      ]);

      const synthesized = resumeService.synthesizeFromCareerTwin(
        profile,
        skills,
        edu,
        exp,
        proj,
        certs,
        achs
      );

      setContent(synthesized);
      setImportConfirmOpen(false);
      setFeedback({ type: 'success', message: 'Career Twin profile facts imported.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Unable to import from Career Twin.' });
    }
  };

  // Print / PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  // Export as Standardized JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${resumeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-resume.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setFeedback({ type: 'success', message: 'Resume exported as structured JSON.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Export as ATS-Friendly Plain Text (.txt)
  const handleExportText = () => {
    let txt = `${(content.contactInfo.fullName || 'CANDIDATE').toUpperCase()}\n`;
    if (content.contactInfo.headline) txt += `${content.contactInfo.headline}\n`;
    txt += `${[content.contactInfo.email, content.contactInfo.phone, content.contactInfo.location].filter(Boolean).join(' | ')}\n`;
    if (content.contactInfo.githubUrl) txt += `GitHub: ${content.contactInfo.githubUrl}\n`;
    if (content.contactInfo.portfolioUrl) txt += `Portfolio: ${content.contactInfo.portfolioUrl}\n`;
    txt += '\n' + '='.repeat(48) + '\n';

    if (content.summary) {
      txt += `\nPROFESSIONAL SUMMARY\n${content.summary}\n`;
    }

    if (content.skills.length > 0) {
      txt += `\nTECHNICAL COMPETENCIES\n`;
      content.skills.forEach((g) => {
        txt += `${g.category}: ${g.skills.join(', ')}\n`;
      });
    }

    if (content.experience.length > 0) {
      txt += `\nPROFESSIONAL EXPERIENCE\n`;
      content.experience.forEach((e) => {
        txt += `\n${e.roleTitle} — ${e.organization} (${e.startDate} - ${e.isCurrent ? 'Present' : e.endDate})\n`;
        if (e.location) txt += `Location: ${e.location}\n`;
        e.bullets.forEach((b) => {
          txt += `  * ${b}\n`;
        });
      });
    }

    if (content.projects.length > 0) {
      txt += `\nTECHNICAL PROJECTS & ARTIFACTS\n`;
      content.projects.forEach((p) => {
        txt += `\n${p.title}${p.technologies?.length ? ` [${p.technologies.join(', ')}]` : ''}\n`;
        if (p.repoUrl) txt += `Repository: ${p.repoUrl}\n`;
        p.bullets.forEach((b) => {
          txt += `  * ${b}\n`;
        });
      });
    }

    if (content.education.length > 0) {
      txt += `\nEDUCATION\n`;
      content.education.forEach((ed) => {
        txt += `${ed.degree} in ${ed.fieldOfStudy} — ${ed.institution} (${ed.startDate} - ${ed.endDate || 'Present'})\n`;
      });
    }

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${resumeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-resume.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setFeedback({ type: 'success', message: 'Resume exported as ATS Plain Text (.txt).' });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              {resumeTitle}
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Role: {targetRole}</span>
              <span>·</span>
              <span className="font-mono text-indigo-600 uppercase text-[10px] font-semibold">
                Template: {templateId}
              </span>
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Template Selector */}
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as ResumeTemplateId)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 cursor-pointer"
          >
            <option value="classic-ats">Classic ATS</option>
            <option value="modern-pro">Modern Professional</option>
            <option value="tech-portfolio">Technical Portfolio</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportConfirmOpen(true)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
            title="Prefill from Career Twin"
          >
            Import Twin
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setVersionsModalOpen(true)}
            leftIcon={<History className="w-3.5 h-3.5 text-slate-500" />}
          >
            Versions ({versions.length})
          </Button>

          {/* Export Group */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportText}
            leftIcon={<Download className="w-3.5 h-3.5 text-slate-500" />}
            title="Export Plain Text for application forms"
          >
            Export .TXT
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            leftIcon={<FileCode className="w-3.5 h-3.5 text-slate-500" />}
            title="Export Standardized Resume JSON"
          >
            Export JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5 text-slate-500" />}
          >
            Export PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveDraft}
            isLoading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Draft
          </Button>
        </div>
      </div>

      {/* Feedback Alert (Hidden in Print) */}
      {feedback && (
        <div
          role="alert"
          className={`print:hidden p-3 rounded-xl border text-xs flex items-center justify-between ${
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

      {/* Main Split Grid (Editor Form + Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Section Editor Controls (Hidden in Print) */}
        <div className="print:hidden lg:col-span-5 space-y-4">
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 overflow-x-auto text-xs">
            {[
              { id: 'contact', label: 'Contact' },
              { id: 'summary', label: 'Summary' },
              { id: 'experience', label: 'Experience' },
              { id: 'projects', label: 'Projects' },
              { id: 'skills', label: 'Skills' },
              { id: 'education', label: 'Education' },
              { id: 'ai', label: 'AI Assistant', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSection === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* SECTION 1: CONTACT */}
          {activeSection === 'contact' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Header & Contact Info</h3>
              <Input
                label="Full Name"
                value={content.contactInfo.fullName}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contactInfo: { ...content.contactInfo, fullName: e.target.value },
                  })
                }
              />
              <Input
                label="Target Title / Headline"
                value={content.contactInfo.headline || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contactInfo: { ...content.contactInfo, headline: e.target.value },
                  })
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email"
                  value={content.contactInfo.email}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contactInfo: { ...content.contactInfo, email: e.target.value },
                    })
                  }
                />
                <Input
                  label="Location"
                  value={content.contactInfo.location || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contactInfo: { ...content.contactInfo, location: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="GitHub Link"
                  value={content.contactInfo.githubUrl || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contactInfo: { ...content.contactInfo, githubUrl: e.target.value },
                    })
                  }
                />
                <Input
                  label="Portfolio Link"
                  value={content.contactInfo.portfolioUrl || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contactInfo: { ...content.contactInfo, portfolioUrl: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* SECTION 2: SUMMARY */}
          {activeSection === 'summary' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Professional Summary</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveSection('ai')}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                  className="text-indigo-600"
                >
                  Generate with AI
                </Button>
              </div>
              <textarea
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
                rows={6}
                value={content.summary}
                onChange={(e) => setContent({ ...content, summary: e.target.value })}
                placeholder="Write a concise 3-4 sentence professional summary focusing on your technical achievements..."
              />
            </div>
          )}

          {/* SECTION 3: EXPERIENCE */}
          {activeSection === 'experience' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Professional Experience</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setContent({
                      ...content,
                      experience: [
                        ...content.experience,
                        {
                          id: crypto.randomUUID(),
                          roleTitle: 'Software Engineer',
                          organization: 'New Company',
                          startDate: '2023',
                          endDate: 'Present',
                          isCurrent: true,
                          bullets: ['Engineered scalable microservice handling 10k requests/min.'],
                        },
                      ],
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Role
                </Button>
              </div>

              {content.experience.map((exp, idx) => (
                <div key={exp.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Position #{idx + 1}</span>
                    <button
                      onClick={() =>
                        setContent({
                          ...content,
                          experience: content.experience.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Title"
                      value={exp.roleTitle}
                      onChange={(e) => {
                        const updated = [...content.experience];
                        updated[idx].roleTitle = e.target.value;
                        setContent({ ...content, experience: updated });
                      }}
                    />
                    <Input
                      label="Company"
                      value={exp.organization}
                      onChange={(e) => {
                        const updated = [...content.experience];
                        updated[idx].organization = e.target.value;
                        setContent({ ...content, experience: updated });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Bullet Points (one per line)
                    </label>
                    <textarea
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 leading-relaxed"
                      rows={3}
                      value={exp.bullets.join('\n')}
                      onChange={(e) => {
                        const updated = [...content.experience];
                        updated[idx].bullets = e.target.value.split('\n');
                        setContent({ ...content, experience: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4: PROJECTS */}
          {activeSection === 'projects' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Technical Projects</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setContent({
                      ...content,
                      projects: [
                        ...content.projects,
                        {
                          id: crypto.randomUUID(),
                          title: 'New Technical Artifact',
                          technologies: ['TypeScript', 'Go'],
                          bullets: ['Built fault-tolerant distributed system with persistent storage.'],
                        },
                      ],
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
                </Button>
              </div>

              {content.projects.map((proj, idx) => (
                <div key={proj.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Project #{idx + 1}</span>
                    <button
                      onClick={() =>
                        setContent({
                          ...content,
                          projects: content.projects.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input
                    label="Project Title"
                    value={proj.title}
                    onChange={(e) => {
                      const updated = [...content.projects];
                      updated[idx].title = e.target.value;
                      setContent({ ...content, projects: updated });
                    }}
                  />
                  <Input
                    label="Tech Stack (comma separated)"
                    value={proj.technologies.join(', ')}
                    onChange={(e) => {
                      const updated = [...content.projects];
                      updated[idx].technologies = e.target.value.split(',').map((s) => s.trim());
                      setContent({ ...content, projects: updated });
                    }}
                  />
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Achievement Bullets (one per line)
                    </label>
                    <textarea
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 leading-relaxed"
                      rows={2}
                      value={proj.bullets.join('\n')}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].bullets = e.target.value.split('\n');
                        setContent({ ...content, projects: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 5: SKILLS */}
          {activeSection === 'skills' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Skills Matrix</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setContent({
                      ...content,
                      skills: [
                        ...content.skills,
                        {
                          id: crypto.randomUUID(),
                          category: 'New Category',
                          skills: ['Skill 1', 'Skill 2'],
                        },
                      ],
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Group
                </Button>
              </div>

              {content.skills.map((group, idx) => (
                <div key={group.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Group #{idx + 1}</span>
                    <button
                      onClick={() =>
                        setContent({
                          ...content,
                          skills: content.skills.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input
                    label="Category"
                    value={group.category}
                    onChange={(e) => {
                      const updated = [...content.skills];
                      updated[idx].category = e.target.value;
                      setContent({ ...content, skills: updated });
                    }}
                  />
                  <Input
                    label="Skills (comma separated)"
                    value={group.skills.join(', ')}
                    onChange={(e) => {
                      const updated = [...content.skills];
                      updated[idx].skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      setContent({ ...content, skills: updated });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* SECTION 6: EDUCATION */}
          {activeSection === 'education' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Education</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setContent({
                      ...content,
                      education: [
                        ...content.education,
                        {
                          id: crypto.randomUUID(),
                          institution: 'University Name',
                          degree: 'B.S.',
                          fieldOfStudy: 'Computer Science',
                          startDate: '2020',
                          endDate: '2024',
                        },
                      ],
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Degree
                </Button>
              </div>

              {content.education.map((edu, idx) => (
                <div key={edu.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Degree #{idx + 1}</span>
                    <button
                      onClick={() =>
                        setContent({
                          ...content,
                          education: content.education.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input
                    label="Institution"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...content.education];
                      updated[idx].institution = e.target.value;
                      setContent({ ...content, education: updated });
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Degree"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...content.education];
                        updated[idx].degree = e.target.value;
                        setContent({ ...content, education: updated });
                      }}
                    />
                    <Input
                      label="Field of Study"
                      value={edu.fieldOfStudy}
                      onChange={(e) => {
                        const updated = [...content.education];
                        updated[idx].fieldOfStudy = e.target.value;
                        setContent({ ...content, education: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 7: AI ASSISTANT PANEL */}
          {activeSection === 'ai' && (
            <ResumeAssistantPanel
              resumeContent={content}
              targetRole={targetRole}
              onApplySummary={(sum) => {
                setContent({ ...content, summary: sum });
                setFeedback({ type: 'success', message: 'Applied proposed summary to resume.' });
                setTimeout(() => setFeedback(null), 3000);
              }}
              onApplyImprovedBullet={(orig, imp) => {
                let replaced = false;
                const updatedExp = content.experience.map((exp) => ({
                  ...exp,
                  bullets: exp.bullets.map((b) => {
                    if (!replaced && (b === orig || orig.includes(b) || b.includes(orig))) {
                      replaced = true;
                      return imp;
                    }
                    return b;
                  }),
                }));

                const updatedProj = content.projects.map((proj) => ({
                  ...proj,
                  bullets: proj.bullets.map((b) => {
                    if (!replaced && (b === orig || orig.includes(b) || b.includes(orig))) {
                      replaced = true;
                      return imp;
                    }
                    return b;
                  }),
                }));

                if (!replaced && updatedExp.length > 0) {
                  updatedExp[0].bullets.push(imp);
                }

                setContent({
                  ...content,
                  experience: updatedExp,
                  projects: updatedProj,
                });
                setFeedback({ type: 'success', message: 'Applied improved bullet to resume draft.' });
                setTimeout(() => setFeedback(null), 3000);
              }}
              onAddSuggestedSkill={(skill, cat) => {
                const updated = [...content.skills];
                const group = updated.find((g) => g.category.toLowerCase() === cat.toLowerCase());
                if (group) {
                  if (!group.skills.includes(skill)) group.skills.push(skill);
                } else {
                  updated.push({ id: crypto.randomUUID(), category: cat, skills: [skill] });
                }
                setContent({ ...content, skills: updated });
                setFeedback({ type: 'success', message: `Added suggested skill: ${skill}` });
                setTimeout(() => setFeedback(null), 3000);
              }}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Live Print-Oriented Preview Document */}
        <div className="lg:col-span-7 bg-slate-100/70 p-4 sm:p-6 rounded-2xl border border-slate-200/80 overflow-x-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3 print:hidden">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" /> Live Resume Render (A4 Dimensions)
            </span>
            <span className="text-[11px] font-mono">
              Output reflects {templateId} template
            </span>
          </div>

          {/* Clean Rendered Template Output */}
          <ResumeTemplates content={content} templateId={templateId} />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VERSIONS HISTORY MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={versionsModalOpen}
        onClose={() => setVersionsModalOpen(false)}
        title="Resume Version History"
        description="Preserve snapshot milestones before major changes. Restore any historical version."
      >
        <div className="space-y-4">
          {/* Create new version snapshot */}
          <form onSubmit={handleCreateSnapshot} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <span className="font-bold text-xs text-slate-900 block">Create Revision Snapshot</span>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. Tailored for FinTech Infra Role"
                value={versionLabelInput}
                onChange={(e) => setVersionLabelInput(e.target.value)}
                required
              />
              <Button type="submit" size="sm" variant="primary" className="shrink-0">
                Snapshot
              </Button>
            </div>
          </form>

          {/* List of existing versions */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No snapshot revisions recorded yet.</p>
            ) : (
              versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs bg-white"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      v{ver.version_number}: {ver.version_label}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Created: {new Date(ver.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestoreSnapshot(ver)}
                  >
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* CONFIRM IMPORT MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={importConfirmOpen}
        onClose={() => setImportConfirmOpen(false)}
        title="Import from Career Twin"
        description="Populate this resume directly from your verified Career Twin profile facts?"
      >
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          This will prefill your contact information, technical skills, projects, and work experience from your Career Twin ontology. Any unsaved edits in the current draft will be overwritten with current Career Twin data.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setImportConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImportCareerTwin}>
            Confirm Import
          </Button>
        </div>
      </Modal>
    </div>
  );
};
