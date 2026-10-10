import React, { useState } from 'react';
import {
  CandidateSkill,
  CandidateProject,
  CandidateExperience,
  CandidateCertification,
} from '../../types/database';
import {
  Layers,
  GitCommit,
  CheckCircle2,
  ExternalLink,
  Target,
  Sparkles,
  Shield,
  Briefcase,
  Award,
  ChevronRight,
} from 'lucide-react';

export interface TwinEvidenceGraphProps {
  targetRole?: string;
  skills: CandidateSkill[];
  projects: CandidateProject[];
  experience: CandidateExperience[];
  certifications: CandidateCertification[];
}

export const TwinEvidenceGraph: React.FC<TwinEvidenceGraphProps> = ({
  targetRole = 'Platform & Distributed Systems Engineer',
  skills,
  projects,
  experience,
  certifications,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeNode, setActiveNode] = useState<{
    id: string;
    type: 'role' | 'skill' | 'evidence';
    title: string;
    subtitle: string;
    details?: string;
    link?: string;
  } | null>(null);

  // Group skills by category
  const categories = Array.from(new Set(skills.map((s) => s.category || 'General')));
  const filteredSkills =
    selectedCategory === 'all'
      ? skills
      : skills.filter((s) => (s.category || 'General') === selectedCategory);

  // Gather unique evidence linked to filtered skills
  const linkedEvidence = filteredSkills
    .filter((s) => s.evidence_url || s.evidence_description)
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Career Twin Skill & Evidence Graph
            </h3>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-semibold">
              Live Ontology
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive map demonstrating how code artifacts and real experience ground your target role.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories ({skills.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Canvas Representation */}
      <div className="relative bg-slate-50/70 rounded-xl border border-slate-200/80 p-5 overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#090d16 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* LEVEL 1: TARGET ROLE ANCHOR */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              01 · Target Archetype
            </div>
            <div
              onClick={() =>
                setActiveNode({
                  id: 'target-role',
                  type: 'role',
                  title: targetRole,
                  subtitle: `${filteredSkills.length} Verified Competencies Roll Up Here`,
                  details:
                    'Every code commit, test suite, and experience milestone in your twin strengthens this profile archetype.',
                })
              }
              className={`w-full p-4 rounded-xl border transition-all cursor-pointer text-left ${
                activeNode?.id === 'target-role'
                  ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 bg-indigo-50/60 px-1.5 py-0.5 rounded">
                  Primary Role
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 leading-snug">
                {targetRole}
              </h4>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Coverage:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {skills.length > 0 ? 'Substantiated' : 'Pending Skills'}
                </span>
              </div>
            </div>
          </div>

          {/* LEVEL 2: COMPETENCY CLUSTER */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 text-center">
              02 · Stated Competencies ({filteredSkills.length})
            </div>
            {filteredSkills.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-white text-center text-xs text-slate-400">
                No competencies found in this filter.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredSkills.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    onClick={() =>
                      setActiveNode({
                        id: s.id,
                        type: 'skill',
                        title: s.name,
                        subtitle: `${s.category} · ${s.proficiency_level}`,
                        details:
                          s.evidence_description ||
                          'Skill is documented in your verified career ontology.',
                        link: s.evidence_url || undefined,
                      })
                    }
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      activeNode?.id === s.id
                        ? 'bg-indigo-50/90 border-indigo-400 font-semibold'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.category}</div>
                    </div>
                    <span className="font-mono text-[9px] uppercase font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {s.proficiency_level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LEVEL 3: VERIFIABLE EVIDENCE PROOF */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 text-center">
              03 · Grounding Proof ({projects.length + experience.length + certifications.length})
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    setActiveNode({
                      id: p.id,
                      type: 'evidence',
                      title: p.title,
                      subtitle: `Project Codebase · ${p.technologies.slice(0, 3).join(', ')}`,
                      details: p.description,
                      link: p.repo_url || p.live_url || undefined,
                    })
                  }
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                    activeNode?.id === p.id
                      ? 'bg-indigo-50/90 border-indigo-400'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <GitCommit className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {p.tagline || p.description}
                  </div>
                </div>
              ))}

              {experience.slice(0, 2).map((exp) => (
                <div
                  key={exp.id}
                  onClick={() =>
                    setActiveNode({
                      id: exp.id,
                      type: 'evidence',
                      title: `${exp.role_title} @ ${exp.organization}`,
                      subtitle: `${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}`,
                      details: exp.description || exp.achievements.join(' '),
                    })
                  }
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                    activeNode?.id === exp.id
                      ? 'bg-indigo-50/90 border-indigo-400'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Briefcase className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">{exp.role_title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {exp.organization}
                  </div>
                </div>
              ))}

              {certifications.slice(0, 2).map((cert) => (
                <div
                  key={cert.id}
                  onClick={() =>
                    setActiveNode({
                      id: cert.id,
                      type: 'evidence',
                      title: cert.name,
                      subtitle: `Issued by ${cert.issuing_org}`,
                      details: `Date: ${cert.issue_date} · ID: ${cert.credential_id || 'Verified'}`,
                      link: cert.credential_url || undefined,
                    })
                  }
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                    activeNode?.id === cert.id
                      ? 'bg-indigo-50/90 border-indigo-400'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{cert.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {cert.issuing_org}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        {activeNode && (
          <div className="mt-4 p-4 rounded-xl bg-white border border-indigo-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {activeNode.type} Node
                </span>
                <span className="font-bold text-slate-900 text-sm">{activeNode.title}</span>
              </div>
              <div className="text-slate-500 font-medium">{activeNode.subtitle}</div>
              {activeNode.details && (
                <p className="text-slate-700 leading-relaxed pt-1">{activeNode.details}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeNode.link && (
                <a
                  href={activeNode.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1"
                >
                  Inspect Evidence <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={() => setActiveNode(null)}
                className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
