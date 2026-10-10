import React, { useState } from 'react';
import { ResumeContent } from '../../types/database';
import { Button } from '../ui/Button';
import {
  Sparkles,
  Check,
  X,
  AlertCircle,
  FileText,
  Target,
  Wand2,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface ResumeAssistantPanelProps {
  resumeContent: ResumeContent;
  targetRole: string;
  onApplySummary: (summary: string) => void;
  onApplyImprovedBullet: (original: string, improved: string) => void;
  onAddSuggestedSkill: (skill: string, category: string) => void;
}

export const ResumeAssistantPanel: React.FC<ResumeAssistantPanelProps> = ({
  resumeContent,
  targetRole,
  onApplySummary,
  onApplyImprovedBullet,
  onAddSuggestedSkill,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'bullets' | 'skills' | 'tailor'>('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appliedBullets, setAppliedBullets] = useState<Record<number, boolean>>({});

  // Job description input for tailoring
  const [jobDescription, setJobDescription] = useState('');

  // Results state
  const [summaryResult, setSummaryResult] = useState<{ summary: string; rationale: string } | null>(null);
  const [bulletsResult, setBulletsResult] = useState<Array<{ original: string; improved: string; explanation: string }> | null>(null);
  const [skillsResult, setSkillsResult] = useState<Array<{ skill: string; category: string; evidenceSource: string }> | null>(null);
  const [tailorResult, setTailorResult] = useState<{
    alignmentSummary: string;
    matchedKeywords: string[];
    missingKeywords: string[];
    recommendations: string[];
    alignmentLevel: string;
  } | null>(null);

  const callAssistant = async (action: string, payload: any) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/resume-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetRole,
          candidateData: {
            name: resumeContent.contactInfo.fullName,
            headline: resumeContent.contactInfo.headline || targetRole,
            targetRole,
            summary: resumeContent.summary,
            skills: resumeContent.skills,
            experience: resumeContent.experience,
            projects: resumeContent.projects,
          },
          ...payload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process AI resume request.');
      }

      return data.data;
    } catch (err: any) {
      console.error('AI Resume Assistant Error:', err);
      setErrorMsg(err.message || 'Server error communicating with AI Resume Engine.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Generate Summary
  const handleGenerateSummary = async () => {
    const res = await callAssistant('generate_summary', {});
    if (res?.summary) {
      setSummaryResult(res);
    }
  };

  // 2. Improve Bullets
  const handleImproveBullets = async () => {
    const sampleBullets: string[] = [];
    if (resumeContent.experience.length > 0 && resumeContent.experience[0].bullets.length > 0) {
      sampleBullets.push(resumeContent.experience[0].bullets[0]);
    }
    if (resumeContent.projects.length > 0 && resumeContent.projects[0].bullets.length > 0) {
      sampleBullets.push(resumeContent.projects[0].bullets[0]);
    }

    if (sampleBullets.length === 0) {
      setErrorMsg('Add at least one experience or project bullet point to improve.');
      return;
    }

    const res = await callAssistant('improve_bullets', { inputContent: sampleBullets });
    if (res?.improvedBullets) {
      setBulletsResult(res.improvedBullets);
    }
  };

  // 3. Suggest Skills
  const handleSuggestSkills = async () => {
    const res = await callAssistant('suggest_skills', {});
    if (res?.suggestedSkills) {
      setSkillsResult(res.suggestedSkills);
    }
  };

  // 4. Tailor to Job
  const handleTailorToJob = async () => {
    if (!jobDescription.trim()) {
      setErrorMsg('Please paste a job description to analyze.');
      return;
    }
    const res = await callAssistant('tailor_to_job', { jobDescription: jobDescription.trim() });
    if (res) {
      setTailorResult(res);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              AI Resume Assistant
            </h3>
            <p className="text-[11px] text-slate-500">
              Truth-preserving suggestions powered by Gemini on server.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
          gemini-3.8-flash
        </span>
      </div>

      {/* Safety Notice */}
      <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 leading-relaxed">
        <strong>Integrity Guardrail:</strong> AI suggestions work strictly from candidate facts. No qualifications, metrics, or credentials are ever fabricated. All proposals require your review and explicit approval before applying.
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'summary' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Summary Generator
        </button>
        <button
          onClick={() => setActiveTab('bullets')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'bullets' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bullet Polisher
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'skills' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Skill Suggester
        </button>
        <button
          onClick={() => setActiveTab('tailor')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'tailor' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Job Fit & Gap Analysis
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 1. SUMMARY GENERATOR */}
      {/* ===================================================================== */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Synthesizes an executive summary strictly from your recorded projects, skills, and target role ({targetRole}).
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={handleGenerateSummary}
            isLoading={isLoading}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            Generate Summary Proposal
          </Button>

          {summaryResult && (
            <div className="mt-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                <span>Proposed Professional Summary</span>
                <span className="text-[10px] font-mono font-normal text-slate-500">Requires Approval</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-indigo-100/60">
                {summaryResult.summary}
              </p>
              {summaryResult.rationale && (
                <p className="text-[11px] text-slate-500 italic">
                  Rationale: {summaryResult.rationale}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSummaryResult(null)}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onApplySummary(summaryResult.summary);
                    setSummaryResult(null);
                  }}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Apply to Resume
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. BULLET POLISHER */}
      {/* ===================================================================== */}
      {activeTab === 'bullets' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Rephrases statements into action-verb achievement bullets without fabricating qualifications.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={handleImproveBullets}
            isLoading={isLoading}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            Review Bullet Improvements
          </Button>

          {bulletsResult && (
            <div className="mt-3 space-y-3">
              {bulletsResult.map((b, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2 shadow-2xs">
                  <div className="text-slate-400 line-through text-[11px]">{b.original}</div>
                  <div className="text-slate-900 font-semibold flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-bold">›</span>
                    <span>{b.improved}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 italic">{b.explanation}</span>
                    <Button
                      size="sm"
                      variant={appliedBullets[idx] ? 'outline' : 'primary'}
                      onClick={() => {
                        onApplyImprovedBullet(b.original, b.improved);
                        setAppliedBullets((prev) => ({ ...prev, [idx]: true }));
                      }}
                      className="text-[11px] py-1 px-2.5 shrink-0"
                    >
                      {appliedBullets[idx] ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 mr-1" /> Applied
                        </>
                      ) : (
                        'Apply to Resume'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SKILL SUGGESTER */}
      {/* ===================================================================== */}
      {activeTab === 'skills' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Identifies competencies demonstrated in your projects and experience that are not yet listed.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSuggestSkills}
            isLoading={isLoading}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            Suggest Evidence-Based Skills
          </Button>

          {skillsResult && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {skillsResult.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{s.skill}</div>
                    <div className="text-[10px] text-slate-500">{s.category} · Source: {s.evidenceSource}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddSuggestedSkill(s.skill, s.category)}
                    className="shrink-0 text-xs py-1"
                  >
                    + Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. JOB FIT & GAP ANALYSIS */}
      {/* ===================================================================== */}
      {activeTab === 'tailor' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Paste target job description to analyze keyword coverage and alignment without black-box scores.
          </p>
          <textarea
            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
            rows={4}
            placeholder="Paste raw target engineering job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <Button
            size="sm"
            variant="primary"
            onClick={handleTailorToJob}
            isLoading={isLoading}
            leftIcon={<Target className="w-3.5 h-3.5" />}
          >
            Run Objective Gap Analysis
          </Button>

          {tailorResult && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Alignment Overview</span>
                <span className="font-mono text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Fit: {tailorResult.alignmentLevel}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {tailorResult.alignmentSummary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <span className="font-bold text-emerald-950 block mb-1">Demonstrated Alignment:</span>
                  <div className="flex flex-wrap gap-1">
                    {tailorResult.matchedKeywords.map((kw, i) => (
                      <span key={i} className="bg-white border border-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                  <span className="font-bold text-amber-950 block mb-1">Potential Missing Competencies:</span>
                  <div className="flex flex-wrap gap-1">
                    {tailorResult.missingKeywords.map((kw, i) => (
                      <span key={i} className="bg-white border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {tailorResult.recommendations.length > 0 && (
                <div className="pt-2">
                  <span className="font-bold text-slate-900 block mb-1">Concrete Suggestions:</span>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside">
                    {tailorResult.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
