import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { careerTwinService, ProfileCompletenessResult } from '../../services/careerTwinService';
import { studentVerificationService } from '../../services/studentVerificationService';
import { profilePhotoService } from '../../services/profilePhotoService';
import { resumeService } from '../../services/resumeService';
import {
  CandidateSkill,
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
  CandidateCertification,
  CandidatePreferences,
  StudentVerification,
  ResumeRecord,
} from '../../types/database';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  User,
  Camera,
  Trash2,
  Edit3,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  Sparkles,
  Download,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface CandidateProfileViewProps {
  onNavigateToEditProfile?: () => void;
  onNavigateToVerification?: () => void;
  onNavigateToResumeStudio?: () => void;
}

export const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({
  onNavigateToEditProfile,
  onNavigateToVerification,
  onNavigateToResumeStudio,
}) => {
  const { user, profile, updateProfile } = useAuth();
  const userId = user?.id || 'demo-candidate';

  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [education, setEducation] = useState<CandidateEducation[]>([]);
  const [experience, setExperience] = useState<CandidateExperience[]>([]);
  const [projects, setProjects] = useState<CandidateProject[]>([]);
  const [certifications, setCertifications] = useState<CandidateCertification[]>([]);
  const [preferences, setPreferences] = useState<CandidatePreferences | null>(null);
  const [verification, setVerification] = useState<StudentVerification | null>(null);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [completeness, setCompleteness] = useState<ProfileCompletenessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPublicPreview, setIsPublicPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfileData();
  }, [user, profile]);

  const loadProfileData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [sk, ed, ex, pr, ce, pref, verif, resList] = await Promise.all([
        careerTwinService.getSkills(user.id),
        careerTwinService.getEducation(user.id),
        careerTwinService.getExperience(user.id),
        careerTwinService.getProjects(user.id),
        careerTwinService.getCertifications(user.id),
        careerTwinService.getPreferences(user.id),
        studentVerificationService.getVerification(user.id),
        resumeService.getResumes(user.id),
      ]);

      setSkills(sk);
      setEducation(ed);
      setExperience(ex);
      setProjects(pr);
      setCertifications(ce);
      setPreferences(pref);
      setVerification(verif);
      setResumes(resList);

      const comp = careerTwinService.calculateCompleteness(profile, sk, ed, ex, pr, pref);
      setCompleteness(comp);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const dataUrl = await profilePhotoService.processProfilePhoto(file);
      await profilePhotoService.saveProfilePhoto(user?.id || 'demo-candidate', dataUrl);
      await updateProfile({ avatar_path: dataUrl });

      setFeedback({ message: 'Profile photo updated successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to upload photo.', type: 'error' });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Remove your profile photo?')) return;
    try {
      await profilePhotoService.removeProfilePhoto(user?.id || 'demo-candidate');
      await updateProfile({ avatar_path: null });
      setFeedback({ message: 'Profile photo removed.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ message: 'Failed to remove photo.', type: 'error' });
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

      {/* Top Hero Banner & Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        {/* Cinematic Gradient Header Cover */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />

          {/* Public Preview Toggle Banner */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setIsPublicPreview(!isPublicPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white border border-slate-700/80 text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isPublicPreview ? 'Exit Preview' : 'Public Preview'}</span>
            </button>
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          {/* Avatar with Upload Control */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="relative group inline-block">
              <Avatar
                name={profile?.display_name || user?.email || 'Candidate'}
                src={profile?.avatar_path || undefined}
                size="lg"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl ring-4 ring-white dark:ring-slate-900 shadow-md text-xl"
              />

              {!isPublicPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
                      title="Upload photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    {profile?.avatar_path && (
                      <button
                        onClick={handleRemovePhoto}
                        className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Edit Profile Action */}
            {!isPublicPreview && onNavigateToEditProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToEditProfile}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Profile
              </Button>
            )}
          </div>

          {/* Name & Headline */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {profile?.display_name || 'Alex Vance'}
              </h1>

              {/* Student Verified Badge */}
              {verification?.status === 'verified' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Student</span>
                </span>
              ) : verification?.status === 'pending' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <span>Student Verification Pending</span>
                </span>
              ) : onNavigateToVerification ? (
                <button
                  onClick={onNavigateToVerification}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Get Student Verified</span>
                </button>
              ) : null}

              {/* Phone Verified Badge */}
              {profile?.phone_verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phone Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {profile?.headline ||
                'Senior Distributed Systems Engineer · Raft Consensus & Low-Latency Storage'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              {profile?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </div>
              )}
              {profile?.phone_number && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{profile.phone_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completeness Meter (Hidden in public preview) */}
          {!isPublicPreview && completeness && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Profile Strength: {completeness.level} ({completeness.score}%)
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {completeness.completedSections.length} sections validated
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Experience, Projects, Education, Certs */}
        <div className="lg:col-span-2 space-y-6">
          {/* About / Summary Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-3 transition-colors">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              About & Technical Focus
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {profile?.bio ||
                'Staff-level systems engineer with deep expertise in distributed consensus, verifiable state machines, and Linux kernel storage layers. Passionate about creating deterministic software where engineering rigor is proven through commit benchmarks and automated chaos testing.'}
            </p>
          </div>

          {/* Work Experience */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span>Work Experience & Internships</span>
              </h3>
            </div>

            {experience.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No experience records added.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {experience.map((exp) => (
                  <div key={exp.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {exp.role_title}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {exp.start_date} — {exp.end_date || (exp.is_current ? 'Present' : '')}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {exp.organization} {exp.location ? `· ${exp.location}` : ''}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects & Code Proof */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-500" />
              <span>Projects & Code Proof Artifacts</span>
            </h3>

            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No projects added yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {projects.map((proj) => (
                  <div key={proj.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {proj.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {proj.repo_url && (
                          <a
                            href={proj.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Code</span>
                          </a>
                        )}
                        {proj.live_url && (
                          <a
                            href={proj.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Demo</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {proj.tagline && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {proj.tagline}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {proj.description}
                    </p>

                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.technologies.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300"
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
          </div>

          {/* Formal Education */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4 transition-colors">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <span>Education & Academic Programs</span>
            </h3>

            {education.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2">No education records added.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {education.map((edu) => (
                  <div key={edu.id} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {edu.institution}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {edu.start_date} — {edu.end_date || 'Present'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {edu.degree} · {edu.field_of_study}
                      {edu.grade_or_gpa ? ` (GPA: ${edu.grade_or_gpa})` : ''}
                    </div>
                    {edu.description && (
                      <p className="text-xs text-slate-500 leading-relaxed pt-1">
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Skills, Certs, Resumes */}
        <div className="space-y-6">
          {/* Technical Skills Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-3 transition-colors">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Technical Skills Matrix
            </h3>

            {skills.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-1">No skills logged yet.</p>
            ) : (
              <div className="space-y-2.5">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {skill.name}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        {skill.proficiency_level}
                      </span>
                    </div>
                    {skill.evidence_description && (
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {skill.evidence_description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resume Studio Attachment */}
          {resumes.length > 0 && onNavigateToResumeStudio && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-3 transition-colors">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Active Resume</span>
                <span className="text-[10px] font-mono text-emerald-600">ATS v1</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {resumes[0].title}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToResumeStudio}
                className="w-full justify-center"
              >
                Open in Resume Studio
              </Button>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-3 transition-colors">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Certifications & Badges
              </h3>
              <div className="space-y-2">
                {certifications.map((c) => (
                  <div key={c.id} className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {c.issuing_org} · {c.issue_date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
