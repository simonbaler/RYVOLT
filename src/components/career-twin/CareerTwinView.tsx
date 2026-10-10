import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CandidateSkill,
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
  CandidateCertification,
  CandidateAchievement,
  CandidatePreferences,
  SkillProficiency,
  SkillEvidenceType,
  EmploymentType,
  RemotePreference,
} from '../../types/database';
import { careerTwinService, ProfileCompletenessResult } from '../../services/careerTwinService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Tabs } from '../ui/Tabs';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Github,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  ChevronRight,
  Target,
  ArrowRight,
  Compass,
  MapPin,
  DollarSign,
  Link as LinkIcon,
} from 'lucide-react';
import { TwinEvidenceGraph } from './TwinEvidenceGraph';

export interface CareerTwinViewProps {
  onNavigateToResumeStudio?: () => void;
  onEditBaselineProfile?: () => void;
}

export const CareerTwinView: React.FC<CareerTwinViewProps> = ({
  onNavigateToResumeStudio,
  onEditBaselineProfile,
}) => {
  const { user, profile } = useAuth();
  const userId = user?.id || 'guest-builder';

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'projects' | 'experience' | 'education' | 'credentials' | 'preferences'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Entities
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [education, setEducation] = useState<CandidateEducation[]>([]);
  const [experience, setExperience] = useState<CandidateExperience[]>([]);
  const [projects, setProjects] = useState<CandidateProject[]>([]);
  const [certifications, setCertifications] = useState<CandidateCertification[]>([]);
  const [achievements, setAchievements] = useState<CandidateAchievement[]>([]);
  const [preferences, setPreferences] = useState<CandidatePreferences | null>(null);

  // Modals state
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<CandidateSkill | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CandidateProject | null>(null);

  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<CandidateExperience | null>(null);

  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<CandidateEducation | null>(null);

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CandidateCertification | null>(null);

  const [achModalOpen, setAchModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<CandidateAchievement | null>(null);

  const [prefForm, setPrefForm] = useState({
    preferred_roles: '',
    target_locations: '',
    remote_preference: 'Hybrid' as RemotePreference,
    salary_expectation_min: 150000,
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  });
  const [isSavingPref, setIsSavingPref] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; title: string } | null>(null);

  // Load all user records
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, ed, ex, p, c, a, pref] = await Promise.all([
        careerTwinService.getSkills(userId),
        careerTwinService.getEducation(userId),
        careerTwinService.getExperience(userId),
        careerTwinService.getProjects(userId),
        careerTwinService.getCertifications(userId),
        careerTwinService.getAchievements(userId),
        careerTwinService.getPreferences(userId),
      ]);
      setSkills(s);
      setEducation(ed);
      setExperience(ex);
      setProjects(p);
      setCertifications(c);
      setAchievements(a);
      setPreferences(pref);
      if (pref) {
        setPrefForm({
          preferred_roles: pref.preferred_roles?.join(', ') || '',
          target_locations: pref.target_locations?.join(', ') || '',
          remote_preference: (pref.remote_preference as RemotePreference) || 'Hybrid',
          salary_expectation_min: pref.salary_expectation_min || 150000,
          github_url: pref.github_url || '',
          linkedin_url: pref.linkedin_url || '',
          portfolio_url: pref.portfolio_url || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading Career Twin data:', err);
      setFeedback({ type: 'error', message: 'Unable to load profile data. Showing local session.' });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Completeness computation
  const completeness: ProfileCompletenessResult = careerTwinService.calculateCompleteness(
    profile,
    skills,
    education,
    experience,
    projects,
    preferences
  );

  // ============================================================================
  // SKILL FORM HANDLERS
  // ============================================================================
  const [skillForm, setSkillForm] = useState({
    name: '',
    category: 'Distributed Systems',
    proficiency_level: 'Proficient' as SkillProficiency,
    evidence_type: 'project' as SkillEvidenceType,
    evidence_url: '',
    evidence_description: '',
  });

  const openSkillModal = (skill?: CandidateSkill) => {
    if (skill) {
      setEditingSkill(skill);
      setSkillForm({
        name: skill.name,
        category: skill.category,
        proficiency_level: skill.proficiency_level,
        evidence_type: skill.evidence_type,
        evidence_url: skill.evidence_url || '',
        evidence_description: skill.evidence_description || '',
      });
    } else {
      setEditingSkill(null);
      setSkillForm({
        name: '',
        category: 'Core Engineering',
        proficiency_level: 'Proficient',
        evidence_type: 'project',
        evidence_url: '',
        evidence_description: '',
      });
    }
    setSkillModalOpen(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;

    try {
      if (editingSkill) {
        await careerTwinService.updateSkill(editingSkill.id, userId, {
          name: skillForm.name.trim(),
          category: skillForm.category,
          proficiency_level: skillForm.proficiency_level,
          evidence_type: skillForm.evidence_type,
          evidence_url: skillForm.evidence_url.trim() || null,
          evidence_description: skillForm.evidence_description.trim() || null,
        });
      } else {
        await careerTwinService.createSkill({
          user_id: userId,
          name: skillForm.name.trim(),
          category: skillForm.category,
          proficiency_level: skillForm.proficiency_level,
          evidence_type: skillForm.evidence_type,
          evidence_url: skillForm.evidence_url.trim() || null,
          evidence_description: skillForm.evidence_description.trim() || null,
          verified: false,
        });
      }
      setSkillModalOpen(false);
      loadAll();
      setFeedback({ type: 'success', message: 'Skill evidence saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save skill.' });
    }
  };

  // ============================================================================
  // PROJECT FORM HANDLERS
  // ============================================================================
  const [projectForm, setProjectForm] = useState({
    title: '',
    tagline: '',
    description: '',
    repo_url: '',
    live_url: '',
    technologies: '',
    highlights: '',
  });

  const openProjectModal = (proj?: CandidateProject) => {
    if (proj) {
      setEditingProject(proj);
      setProjectForm({
        title: proj.title,
        tagline: proj.tagline || '',
        description: proj.description,
        repo_url: proj.repo_url || '',
        live_url: proj.live_url || '',
        technologies: proj.technologies.join(', '),
        highlights: proj.highlights.join('\n'),
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        title: '',
        tagline: '',
        description: '',
        repo_url: '',
        live_url: '',
        technologies: '',
        highlights: '',
      });
    }
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;

    const techArray = projectForm.technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const highlightsArray = projectForm.highlights
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);

    try {
      if (editingProject) {
        await careerTwinService.updateProject(editingProject.id, userId, {
          title: projectForm.title.trim(),
          tagline: projectForm.tagline.trim() || null,
          description: projectForm.description.trim(),
          repo_url: projectForm.repo_url.trim() || null,
          live_url: projectForm.live_url.trim() || null,
          technologies: techArray,
          highlights: highlightsArray,
        });
      } else {
        await careerTwinService.createProject({
          user_id: userId,
          title: projectForm.title.trim(),
          tagline: projectForm.tagline.trim() || null,
          description: projectForm.description.trim(),
          repo_url: projectForm.repo_url.trim() || null,
          live_url: projectForm.live_url.trim() || null,
          technologies: techArray,
          highlights: highlightsArray,
          verified: false,
        });
      }
      setProjectModalOpen(false);
      loadAll();
      setFeedback({ type: 'success', message: 'Project artifact saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save project.' });
    }
  };

  // ============================================================================
  // EXPERIENCE FORM HANDLERS
  // ============================================================================
  const [expForm, setExpForm] = useState({
    organization: '',
    role_title: '',
    employment_type: 'Full-time' as EmploymentType,
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    achievements: '',
  });

  const openExpModal = (exp?: CandidateExperience) => {
    if (exp) {
      setEditingExp(exp);
      setExpForm({
        organization: exp.organization,
        role_title: exp.role_title,
        employment_type: exp.employment_type,
        location: exp.location || '',
        start_date: exp.start_date,
        end_date: exp.end_date || '',
        is_current: exp.is_current,
        description: exp.description || '',
        achievements: exp.achievements.join('\n'),
      });
    } else {
      setEditingExp(null);
      setExpForm({
        organization: '',
        role_title: '',
        employment_type: 'Full-time',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
        achievements: '',
      });
    }
    setExpModalOpen(true);
  };

  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.organization.trim() || !expForm.role_title.trim()) return;

    const achArray = expForm.achievements
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      if (editingExp) {
        await careerTwinService.updateExperience(editingExp.id, userId, {
          organization: expForm.organization.trim(),
          role_title: expForm.role_title.trim(),
          employment_type: expForm.employment_type,
          location: expForm.location.trim() || null,
          start_date: expForm.start_date.trim(),
          end_date: expForm.is_current ? null : expForm.end_date.trim() || null,
          is_current: expForm.is_current,
          description: expForm.description.trim() || null,
          achievements: achArray,
        });
      } else {
        await careerTwinService.createExperience({
          user_id: userId,
          organization: expForm.organization.trim(),
          role_title: expForm.role_title.trim(),
          employment_type: expForm.employment_type,
          location: expForm.location.trim() || null,
          start_date: expForm.start_date.trim(),
          end_date: expForm.is_current ? null : expForm.end_date.trim() || null,
          is_current: expForm.is_current,
          description: expForm.description.trim() || null,
          achievements: achArray,
        });
      }
      setExpModalOpen(false);
      loadAll();
      setFeedback({ type: 'success', message: 'Experience record saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save experience.' });
    }
  };

  // ============================================================================
  // EDUCATION FORM HANDLERS
  // ============================================================================
  const [eduForm, setEduForm] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    grade_or_gpa: '',
    description: '',
  });

  const openEduModal = (edu?: CandidateEducation) => {
    if (edu) {
      setEditingEdu(edu);
      setEduForm({
        institution: edu.institution,
        degree: edu.degree,
        field_of_study: edu.field_of_study,
        start_date: edu.start_date,
        end_date: edu.end_date || '',
        is_current: edu.is_current,
        grade_or_gpa: edu.grade_or_gpa || '',
        description: edu.description || '',
      });
    } else {
      setEditingEdu(null);
      setEduForm({
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        is_current: false,
        grade_or_gpa: '',
        description: '',
      });
    }
    setEduModalOpen(true);
  };

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.institution.trim() || !eduForm.degree.trim()) return;

    try {
      if (editingEdu) {
        await careerTwinService.updateEducation(editingEdu.id, userId, {
          institution: eduForm.institution.trim(),
          degree: eduForm.degree.trim(),
          field_of_study: eduForm.field_of_study.trim(),
          start_date: eduForm.start_date.trim(),
          end_date: eduForm.is_current ? null : eduForm.end_date.trim() || null,
          is_current: eduForm.is_current,
          grade_or_gpa: eduForm.grade_or_gpa.trim() || null,
          description: eduForm.description.trim() || null,
        });
      } else {
        await careerTwinService.createEducation({
          user_id: userId,
          institution: eduForm.institution.trim(),
          degree: eduForm.degree.trim(),
          field_of_study: eduForm.field_of_study.trim(),
          start_date: eduForm.start_date.trim(),
          end_date: eduForm.is_current ? null : eduForm.end_date.trim() || null,
          is_current: eduForm.is_current,
          grade_or_gpa: eduForm.grade_or_gpa.trim() || null,
          description: eduForm.description.trim() || null,
        });
      }
      setEduModalOpen(false);
      loadAll();
      setFeedback({ type: 'success', message: 'Education record saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save education.' });
    }
  };

  // ============================================================================
  // CERTIFICATION HANDLERS
  // ============================================================================
  const [certForm, setCertForm] = useState({
    name: '',
    issuing_org: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: '',
  });

  const openCertModal = (cert?: CandidateCertification) => {
    if (cert) {
      setEditingCert(cert);
      setCertForm({
        name: cert.name,
        issuing_org: cert.issuing_org,
        issue_date: cert.issue_date,
        expiration_date: cert.expiration_date || '',
        credential_id: cert.credential_id || '',
        credential_url: cert.credential_url || '',
      });
    } else {
      setEditingCert(null);
      setCertForm({
        name: '',
        issuing_org: '',
        issue_date: '',
        expiration_date: '',
        credential_id: '',
        credential_url: '',
      });
    }
    setCertModalOpen(true);
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.name.trim() || !certForm.issuing_org.trim() || !certForm.issue_date.trim()) return;

    try {
      if (editingCert) {
        await careerTwinService.deleteCertification(editingCert.id, userId);
      }
      await careerTwinService.createCertification({
        user_id: userId,
        name: certForm.name.trim(),
        issuing_org: certForm.issuing_org.trim(),
        issue_date: certForm.issue_date.trim(),
        expiration_date: certForm.expiration_date.trim() || null,
        credential_id: certForm.credential_id.trim() || null,
        credential_url: certForm.credential_url.trim() || null,
        verified: false,
      });
      setCertModalOpen(false);
      loadAll();
      setFeedback({ type: 'success', message: 'Certification credential saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save certification.' });
    }
  };

  // ============================================================================
  // ACHIEVEMENT HANDLERS
  // ============================================================================
  const [achForm, setAchForm] = useState({
    title: '',
    issuer: '',
    date: '',
    description: '',
    url: '',
  });

  const openAchModal = (ach?: CandidateAchievement) => {
    if (ach) {
      setEditingAch(ach);
      setAchForm({
        title: ach.title,
        issuer: ach.issuer || '',
        date: ach.date,
        description: ach.description,
        url: ach.url || '',
      });
    } else {
      setEditingAch(null);
      setAchForm({
        title: '',
        issuer: '',
        date: '',
        description: '',
        url: '',
      });
    }
    setAchModalOpen(true);
  };

  const handleSaveAch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achForm.title.trim() || !achForm.date.trim() || !achForm.description.trim()) return;

    try {
      if (editingAch) {
        await careerTwinService.deleteAchievement(editingAch.id, userId);
      }
      await careerTwinService.createAchievement({
        user_id: userId,
        title: achForm.title.trim(),
        issuer: achForm.issuer.trim() || null,
        date: achForm.date.trim(),
        description: achForm.description.trim(),
        url: achForm.url.trim() || null,
      });
      setAchModalOpen(false);
      loadAll();
      setFeedback({ type: 'success', message: 'Achievement record saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save achievement.' });
    }
  };

  // ============================================================================
  // PREFERENCES HANDLER
  // ============================================================================
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPref(true);
    try {
      const preferredRoles = prefForm.preferred_roles
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
      const targetLocations = prefForm.target_locations
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await careerTwinService.upsertPreferences({
        user_id: userId,
        preferred_roles: preferredRoles,
        target_locations: targetLocations,
        remote_preference: prefForm.remote_preference,
        target_industries: preferences?.target_industries || ['Technology', 'Cloud Infrastructure', 'FinTech'],
        salary_expectation_min: Number(prefForm.salary_expectation_min) || null,
        salary_currency: 'USD',
        github_url: prefForm.github_url.trim() || null,
        linkedin_url: prefForm.linkedin_url.trim() || null,
        portfolio_url: prefForm.portfolio_url.trim() || null,
      });

      loadAll();
      setFeedback({ type: 'success', message: 'Career preferences saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save preferences.' });
    } finally {
      setIsSavingPref(false);
    }
  };

  // ============================================================================
  // DELETE HANDLER
  // ============================================================================
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'skill') {
        await careerTwinService.deleteSkill(deleteConfirm.id, userId);
      } else if (deleteConfirm.type === 'project') {
        await careerTwinService.deleteProject(deleteConfirm.id, userId);
      } else if (deleteConfirm.type === 'experience') {
        await careerTwinService.deleteExperience(deleteConfirm.id, userId);
      } else if (deleteConfirm.type === 'education') {
        await careerTwinService.deleteEducation(deleteConfirm.id, userId);
      } else if (deleteConfirm.type === 'certification') {
        await careerTwinService.deleteCertification(deleteConfirm.id, userId);
      } else if (deleteConfirm.type === 'achievement') {
        await careerTwinService.deleteAchievement(deleteConfirm.id, userId);
      }
      setDeleteConfirm(null);
      loadAll();
      setFeedback({ type: 'success', message: 'Item removed.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
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
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Profile Header & Completeness Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Avatar
            name={profile?.display_name || user?.email || 'Candidate'}
            size="lg"
            roleTag="candidate"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {profile?.display_name || 'Candidate Twin'}
              </h1>
              <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                Dynamic Ontology
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {profile?.headline || 'No professional headline calibrated yet.'}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span>{profile?.location || 'Location unset'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-600 font-medium">
                {profile?.target_role ? `Target: ${profile.target_role}` : 'General Track'}
              </span>
            </div>
          </div>
        </div>

        {/* Real Profile Completeness Calculation Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 min-w-[280px] max-w-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-900">Profile Completeness</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-indigo-600 tabular-nums">
                {completeness.score}%
              </span>
              <span className="text-[10px] text-slate-400">({completeness.level})</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness.score}%` }}
            />
          </div>

          {completeness.missingSections.length > 0 ? (
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate">Next: {completeness.missingSections[0].label}</span>
              <button
                onClick={() => setActiveTab(completeness.missingSections[0].targetTab as any)}
                className="text-indigo-600 font-semibold hover:underline shrink-0 ml-1 cursor-pointer"
              >
                Add {completeness.missingSections[0].impact}
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All core evidence sections calibrated!</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Strip: Synthesize Resume & Edit Baseline Profile */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Claims backed by verifiable code artifacts, repositories, and benchmark runs.</span>
        </div>

        <div className="flex items-center gap-2">
          {onEditBaselineProfile && (
            <Button variant="outline" size="sm" onClick={onEditBaselineProfile}>
              Edit Profile Info
            </Button>
          )}
          {onNavigateToResumeStudio && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToResumeStudio}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Resume Studio
            </Button>
          )}
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {[
            { id: 'overview', label: 'Overview Archetype', count: undefined },
            { id: 'skills', label: 'Skills Matrix', count: skills.length },
            { id: 'projects', label: 'Projects & Proof', count: projects.length },
            { id: 'experience', label: 'Experience', count: experience.length },
            { id: 'education', label: 'Education', count: education.length },
            { id: 'credentials', label: 'Certifications & Proof', count: certifications.length + achievements.length },
            { id: 'preferences', label: 'Career Preferences & Target', count: undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] tabular-nums font-mono ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW ARCHETYPE */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Live Career Twin Evidence Graph */}
          <TwinEvidenceGraph
            targetRole={profile?.target_role || 'Platform & Distributed Systems Engineer'}
            skills={skills}
            projects={projects}
            experience={experience}
            certifications={certifications}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills Highlight */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Core Competencies & Evidence</CardTitle>
                  <CardDescription>
                    Categorized competencies linked to code repositories and execution artifacts.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => openSkillModal()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
                </Button>
              </CardHeader>
              <CardContent>
                {skills.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No competencies indexed yet. Click "Add Skill" to map your abilities.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{skill.name}</span>
                            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {skill.proficiency_level}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {skill.category}
                          </div>
                        </div>

                        {skill.evidence_url && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="truncate max-w-[150px]">
                              Evidence: {skill.evidence_type}
                            </span>
                            <a
                              href={skill.evidence_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-0.5"
                            >
                              Inspect <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Verified Project Artifacts</CardTitle>
                  <CardDescription>
                    Demonstrable codebases, test suites, and deployed architecture.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => openProjectModal()}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
                </Button>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No projects cataloged yet. Add a repository to substantiate your skills.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{proj.title}</h4>
                            {proj.tagline && (
                              <p className="text-xs text-indigo-600 mt-0.5 font-medium">
                                {proj.tagline}
                              </p>
                            )}
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {proj.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {proj.repo_url && (
                              <a
                                href={proj.repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                                title="Repository Link"
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                            {proj.live_url && (
                              <a
                                href={proj.live_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                                title="Live URL"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {proj.technologies.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                            {proj.technologies.map((t, idx) => (
                              <span
                                key={idx}
                                className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Quick Summary */}
          <div className="space-y-6">
            {/* Experience Snapshot */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Experience Snapshot</CardTitle>
                <button
                  onClick={() => setActiveTab('experience')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Manage
                </button>
              </CardHeader>
              <CardContent>
                {experience.length === 0 ? (
                  <p className="text-xs text-slate-500">No work history added.</p>
                ) : (
                  <div className="space-y-3">
                    {experience.slice(0, 3).map((exp) => (
                      <div key={exp.id} className="text-xs border-b border-slate-100 pb-2 last:border-none">
                        <div className="font-bold text-slate-900">{exp.role_title}</div>
                        <div className="text-slate-500">{exp.organization} · {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Education Snapshot */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Education Snapshot</CardTitle>
                <button
                  onClick={() => setActiveTab('education')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Manage
                </button>
              </CardHeader>
              <CardContent>
                {education.length === 0 ? (
                  <p className="text-xs text-slate-500">No education programs listed.</p>
                ) : (
                  <div className="space-y-3">
                    {education.slice(0, 2).map((edu) => (
                      <div key={edu.id} className="text-xs border-b border-slate-100 pb-2 last:border-none">
                        <div className="font-bold text-slate-900">{edu.degree}</div>
                        <div className="text-slate-500">{edu.institution} · {edu.field_of_study}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SKILLS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Skills Matrix & Evidence Grounding</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each stated competency can be linked directly to inspectable evidence.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => openSkillModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Competency
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{skill.name}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">{skill.category}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      {skill.proficiency_level}
                    </span>
                  </div>

                  {skill.evidence_description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {skill.evidence_description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500">
                    {skill.evidence_url ? (
                      <a
                        href={skill.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Evidence Link <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Self-attested</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openSkillModal(skill)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ type: 'skill', id: skill.id, title: skill.name })
                      }
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROJECTS */}
      {/* ========================================================================= */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Projects & Code Repositories</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Demonstrated codebases, test suites, and deployed architecture.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => openProjectModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{proj.title}</h4>
                      {proj.tagline && (
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">{proj.tagline}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openProjectModal(proj)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ type: 'project', id: proj.id, title: proj.title })
                        }
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {proj.description}
                  </p>

                  {proj.highlights.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                      {proj.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {proj.repo_url && (
                      <a
                        href={proj.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Github className="w-3.5 h-3.5" /> Repository
                      </a>
                    )}
                    {proj.live_url && (
                      <a
                        href={proj.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" /> Demo
                      </a>
                    )}
                  </div>

                  {proj.technologies.length > 0 && (
                    <div className="text-[10px] font-mono text-slate-500">
                      {proj.technologies.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXPERIENCE */}
      {/* ========================================================================= */}
      {activeTab === 'experience' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Work Experience & Internships</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Past engineering positions, contributions, and key accomplishments.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => openExpModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Experience
            </Button>
          </div>

          <div className="space-y-4">
            {experience.map((exp) => (
              <div
                key={exp.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{exp.role_title}</h4>
                    <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-2">
                      <span className="text-indigo-600 font-semibold">{exp.organization}</span>
                      <span>·</span>
                      <span>{exp.employment_type}</span>
                      <span>·</span>
                      <span>{exp.location || 'Remote'}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openExpModal(exp)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'experience',
                          id: exp.id,
                          title: `${exp.role_title} at ${exp.organization}`,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {exp.description && (
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {exp.description}
                  </p>
                )}

                {exp.achievements.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {exp.achievements.map((ach, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EDUCATION */}
      {/* ========================================================================= */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Education & Degrees</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Academic institutions, qualifications, and graduation dates.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => openEduModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Degree
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {education.map((edu) => (
              <div
                key={edu.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{edu.degree}</h4>
                    <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                      {edu.institution}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Field: {edu.field_of_study}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {edu.start_date} — {edu.is_current ? 'Current' : edu.end_date}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEduModal(edu)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'education',
                          id: edu.id,
                          title: `${edu.degree} from ${edu.institution}`,
                        })
                      }
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {edu.grade_or_gpa && (
                  <div className="mt-3 text-xs text-slate-600 font-medium">
                    GPA / Score: <span className="font-mono">{edu.grade_or_gpa}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CERTIFICATIONS & ACHIEVEMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'credentials' && (
        <div className="space-y-8">
          {/* Certifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Certifications & Verified Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Industry licenses, vendor certifications, and exam accreditations.
                </p>
              </div>
              <Button size="sm" variant="primary" onClick={() => openCertModal()}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Certification
              </Button>
            </div>

            {certifications.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No certifications recorded yet. Add AWS, CNCF, or specialized credentials to demonstrate domain competency.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{cert.name}</h4>
                          <span className="text-xs text-indigo-600 font-medium">{cert.issuing_org}</span>
                        </div>
                        <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 mt-2">
                        Issued: {cert.issue_date}
                        {cert.expiration_date && ` · Expires: ${cert.expiration_date}`}
                      </div>

                      {cert.credential_id && (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          ID: {cert.credential_id}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        {cert.credential_url ? (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-medium text-[11px]"
                          >
                            Verify Credential <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct attestation</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openCertModal(cert)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'certification',
                              id: cert.id,
                              title: `${cert.name} (${cert.issuing_org})`,
                            })
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Honors, Awards & Milestones
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hackathons, competitive programming results, publications, and patents.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openAchModal()}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
              </Button>
            </div>

            {achievements.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No milestones recorded yet. Add hackathon placements, open-source grants, or patents.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{ach.title}</h4>
                          {ach.issuer && (
                            <span className="text-xs text-slate-500 font-medium">{ach.issuer}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">{ach.date}</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        {ach.url && (
                          <a
                            href={ach.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-medium text-[11px]"
                          >
                            Proof Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAchModal(ach)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'achievement',
                              id: ach.id,
                              title: ach.title,
                            })
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: CAREER PREFERENCES & GOALS */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs max-w-3xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              Career Preferences & Target Archetype
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Define your preferred roles, locations, compensation baseline, and external professional profiles.
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <Input
              label="Preferred Job Roles (comma separated)"
              placeholder="e.g. Staff Platform Engineer, Distributed Systems Architect, Lead SRE"
              value={prefForm.preferred_roles}
              onChange={(e) => setPrefForm({ ...prefForm, preferred_roles: e.target.value })}
              helperText="These roles guide automated opportunity matching and AI resume tailoring."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Target Locations (comma separated)"
                placeholder="e.g. San Francisco, CA, Remote, New York, NY"
                value={prefForm.target_locations}
                onChange={(e) => setPrefForm({ ...prefForm, target_locations: e.target.value })}
              />

              <Select
                label="Remote Work Preference"
                value={prefForm.remote_preference}
                onChange={(e) =>
                  setPrefForm({
                    ...prefForm,
                    remote_preference: e.target.value as RemotePreference,
                  })
                }
                options={[
                  { value: 'Remote', label: 'Remote Only' },
                  { value: 'Hybrid', label: 'Hybrid' },
                  { value: 'Onsite', label: 'Onsite' },
                  { value: 'Flexible', label: 'Flexible / Open to All' },
                ]}
              />
            </div>

            <Input
              label="Minimum Base Salary Expectation (USD / Year)"
              type="number"
              placeholder="175000"
              value={prefForm.salary_expectation_min || ''}
              onChange={(e) =>
                setPrefForm({ ...prefForm, salary_expectation_min: Number(e.target.value) })
              }
              helperText="Kept confidential. Only used to filter opportunity discovery."
            />

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">External Profiles & Portfolio Links</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="GitHub Profile"
                  placeholder="https://github.com/..."
                  value={prefForm.github_url}
                  onChange={(e) => setPrefForm({ ...prefForm, github_url: e.target.value })}
                />
                <Input
                  label="LinkedIn Profile"
                  placeholder="https://linkedin.com/in/..."
                  value={prefForm.linkedin_url}
                  onChange={(e) => setPrefForm({ ...prefForm, linkedin_url: e.target.value })}
                />
                <Input
                  label="Portfolio / Site"
                  placeholder="https://..."
                  value={prefForm.portfolio_url}
                  onChange={(e) => setPrefForm({ ...prefForm, portfolio_url: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSavingPref}>
                Save Career Preferences
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD/EDIT SKILL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={skillModalOpen}
        onClose={() => setSkillModalOpen(false)}
        title={editingSkill ? 'Edit Competency Evidence' : 'Add Competency Claim'}
        description="Specify the skill, category, and associate verifiable proof."
      >
        <form onSubmit={handleSaveSkill} className="space-y-4">
          <Input
            label="Competency Name"
            placeholder="e.g. Raft Consensus, TypeScript, Kubernetes"
            value={skillForm.name}
            onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={skillForm.category}
              onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
              options={[
                { value: 'Distributed Systems', label: 'Distributed Systems' },
                { value: 'Languages & Runtimes', label: 'Languages & Runtimes' },
                { value: 'Frontend & Architecture', label: 'Frontend & Architecture' },
                { value: 'Cloud & Infrastructure', label: 'Cloud & Infrastructure' },
                { value: 'Databases & Storage', label: 'Databases & Storage' },
                { value: 'Data Engineering & ML', label: 'Data Engineering & ML' },
              ]}
            />

            <Select
              label="Proficiency Level"
              value={skillForm.proficiency_level}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  proficiency_level: e.target.value as SkillProficiency,
                })
              }
              options={[
                { value: 'Foundational', label: 'Foundational' },
                { value: 'Working Knowledge', label: 'Working Knowledge' },
                { value: 'Proficient', label: 'Proficient' },
                { value: 'Advanced', label: 'Advanced' },
                { value: 'Staff / Expert', label: 'Staff / Expert' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Evidence Type"
              value={skillForm.evidence_type}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  evidence_type: e.target.value as SkillEvidenceType,
                })
              }
              options={[
                { value: 'project', label: 'Project Repository' },
                { value: 'github_repo', label: 'GitHub Commit / Pull Request' },
                { value: 'work_experience', label: 'Work Experience Record' },
                { value: 'certification', label: 'Certification / Exam' },
                { value: 'portfolio_link', label: 'Live Portfolio / Demo' },
                { value: 'none', label: 'Self-attested without link' },
              ]}
            />

            <Input
              label="Evidence URL (Optional)"
              placeholder="https://github.com/org/repo"
              value={skillForm.evidence_url}
              onChange={(e) => setSkillForm({ ...skillForm, evidence_url: e.target.value })}
            />
          </div>

          <Input
            label="Evidence Description / Scope"
            placeholder="e.g. Implemented persistent write-ahead logging and passing partition chaos tests."
            value={skillForm.evidence_description}
            onChange={(e) =>
              setSkillForm({ ...skillForm, evidence_description: e.target.value })
            }
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setSkillModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Competency
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD/EDIT PROJECT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title={editingProject ? 'Edit Project Artifact' : 'Add Project Artifact'}
        description="Document code projects with repositories, tech stacks, and highlights."
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g. High-Throughput Stream Ingestion Engine"
            value={projectForm.title}
            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
            required
          />

          <Input
            label="Short Tagline"
            placeholder="e.g. 50k events/sec zero-allocation parser in Go"
            value={projectForm.tagline}
            onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Project Description
            </label>
            <textarea
              className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
              rows={3}
              placeholder="Describe the architectural design, trade-offs, and outcomes."
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Repository URL"
              placeholder="https://github.com/..."
              value={projectForm.repo_url}
              onChange={(e) => setProjectForm({ ...projectForm, repo_url: e.target.value })}
            />
            <Input
              label="Live Demo URL"
              placeholder="https://..."
              value={projectForm.live_url}
              onChange={(e) => setProjectForm({ ...projectForm, live_url: e.target.value })}
            />
          </div>

          <Input
            label="Technologies (comma separated)"
            placeholder="Go, Raft, RocksDB, gRPC, Docker"
            value={projectForm.technologies}
            onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Bullet Highlights (one per line)
            </label>
            <textarea
              className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
              rows={3}
              placeholder="Engineered fault-tolerant election protocol&#10;Achieved p99 latency under 4ms"
              value={projectForm.highlights}
              onChange={(e) => setProjectForm({ ...projectForm, highlights: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD/EDIT EXPERIENCE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title={editingExp ? 'Edit Experience' : 'Add Experience Record'}
        description="Record company, title, dates, and verifiable engineering achievements."
      >
        <form onSubmit={handleSaveExp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Organization / Company"
              placeholder="e.g. Acme Cloud Corp"
              value={expForm.organization}
              onChange={(e) => setExpForm({ ...expForm, organization: e.target.value })}
              required
            />
            <Input
              label="Role Title"
              placeholder="e.g. Staff Platform Engineer"
              value={expForm.role_title}
              onChange={(e) => setExpForm({ ...expForm, role_title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Employment Type"
              value={expForm.employment_type}
              onChange={(e) =>
                setExpForm({ ...expForm, employment_type: e.target.value as EmploymentType })
              }
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Internship', label: 'Internship' },
                { value: 'Co-op', label: 'Co-op' },
                { value: 'Open Source', label: 'Open Source' },
              ]}
            />
            <Input
              label="Start Date"
              placeholder="Jan 2023"
              value={expForm.start_date}
              onChange={(e) => setExpForm({ ...expForm, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              placeholder="Present or Dec 2024"
              value={expForm.end_date}
              disabled={expForm.is_current}
              onChange={(e) => setExpForm({ ...expForm, end_date: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={expForm.is_current}
              onChange={(e) => setExpForm({ ...expForm, is_current: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span>I currently work here</span>
          </label>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Achievement Bullet Points (one per line)
            </label>
            <textarea
              className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
              rows={3}
              placeholder="Led migration of legacy service to distributed Go cluster&#10;Decreased build times by 45%"
              value={expForm.achievements}
              onChange={(e) => setExpForm({ ...expForm, achievements: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setExpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Experience
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: ADD/EDIT EDUCATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={eduModalOpen}
        onClose={() => setEduModalOpen(false)}
        title={editingEdu ? 'Edit Degree' : 'Add Degree / Education'}
        description="Record academic qualifications and graduation periods."
      >
        <form onSubmit={handleSaveEdu} className="space-y-4">
          <Input
            label="Institution / University"
            placeholder="e.g. University of California, Berkeley"
            value={eduForm.institution}
            onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Degree"
              placeholder="e.g. Bachelor of Science in Computer Science"
              value={eduForm.degree}
              onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
              required
            />
            <Input
              label="Field of Study"
              placeholder="e.g. Computer Science & Distributed Systems"
              value={eduForm.field_of_study}
              onChange={(e) => setEduForm({ ...eduForm, field_of_study: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Start Year"
              placeholder="2019"
              value={eduForm.start_date}
              onChange={(e) => setEduForm({ ...eduForm, start_date: e.target.value })}
              required
            />
            <Input
              label="Graduation Year"
              placeholder="2023"
              value={eduForm.end_date}
              disabled={eduForm.is_current}
              onChange={(e) => setEduForm({ ...eduForm, end_date: e.target.value })}
            />
            <Input
              label="GPA / Grade"
              placeholder="e.g. 3.9 / 4.0"
              value={eduForm.grade_or_gpa}
              onChange={(e) => setEduForm({ ...eduForm, grade_or_gpa: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEduModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Degree
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: ADD/EDIT CERTIFICATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        title={editingCert ? 'Edit Certification Credential' : 'Add Certification Credential'}
        description="Record license or credential details, issuing organization, and verification link."
      >
        <form onSubmit={handleSaveCert} className="space-y-4">
          <Input
            label="Certification Name"
            placeholder="e.g. AWS Certified Solutions Architect - Professional"
            value={certForm.name}
            onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Issuing Organization"
              placeholder="e.g. Amazon Web Services, Linux Foundation"
              value={certForm.issuing_org}
              onChange={(e) => setCertForm({ ...certForm, issuing_org: e.target.value })}
              required
            />
            <Input
              label="Issue Date"
              placeholder="e.g. Nov 2023"
              value={certForm.issue_date}
              onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Expiration Date (Optional)"
              placeholder="e.g. Nov 2026 or No Expiration"
              value={certForm.expiration_date}
              onChange={(e) => setCertForm({ ...certForm, expiration_date: e.target.value })}
            />
            <Input
              label="Credential ID / License #"
              placeholder="e.g. AWS-PSA-94821"
              value={certForm.credential_id}
              onChange={(e) => setCertForm({ ...certForm, credential_id: e.target.value })}
            />
          </div>

          <Input
            label="Credential Verification URL"
            placeholder="https://www.credly.com/badges/..."
            value={certForm.credential_url}
            onChange={(e) => setCertForm({ ...certForm, credential_url: e.target.value })}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCertModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Certification
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: ADD/EDIT ACHIEVEMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={achModalOpen}
        onClose={() => setAchModalOpen(false)}
        title={editingAch ? 'Edit Milestone / Honor' : 'Add Milestone / Honor'}
        description="Document hackathon prizes, patents, notable PRs, or public recognition."
      >
        <form onSubmit={handleSaveAch} className="space-y-4">
          <Input
            label="Milestone / Honor Title"
            placeholder="e.g. 1st Place - Global Cloud Architecture Hackathon"
            value={achForm.title}
            onChange={(e) => setAchForm({ ...achForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Issuer / Sponsor"
              placeholder="e.g. CNCF, MIT Tech Review"
              value={achForm.issuer}
              onChange={(e) => setAchForm({ ...achForm, issuer: e.target.value })}
            />
            <Input
              label="Date / Period"
              placeholder="e.g. Oct 2024"
              value={achForm.date}
              onChange={(e) => setAchForm({ ...achForm, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description & Significance
            </label>
            <textarea
              className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
              rows={3}
              placeholder="Selected out of 250+ engineering teams for zero-downtime consensus failover implementation."
              value={achForm.description}
              onChange={(e) => setAchForm({ ...achForm, description: e.target.value })}
              required
            />
          </div>

          <Input
            label="Verification / Article URL"
            placeholder="https://..."
            value={achForm.url}
            onChange={(e) => setAchForm({ ...achForm, url: e.target.value })}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Removal"
        description="Are you sure you want to remove this record from your Career Twin?"
      >
        <p className="text-xs text-slate-600 mb-4">
          This will delete <strong className="text-slate-900">{deleteConfirm?.title}</strong>. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={executeDelete}>
            Delete Record
          </Button>
        </div>
      </Modal>
    </div>
  );
};
