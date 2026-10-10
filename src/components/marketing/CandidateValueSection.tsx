import React from 'react';
import { GitBranch, FileCheck, Layers, Sparkles } from 'lucide-react';

export const CandidateValueSection: React.FC = () => {
  const pillars = [
    {
      icon: <GitBranch className="w-5 h-5 text-indigo-600" />,
      title: 'Projects as Verifiable Proof',
      description:
        'Instead of claiming proficiency on a static PDF, your code commits, architecture decisions, and unit tests substantiate every skill claim.',
    },
    {
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      title: 'Unified Career Twin',
      description:
        'A single source of truth for your evolving engineering capabilities. As you build and deploy, your Twin updates automatically.',
    },
    {
      icon: <FileCheck className="w-5 h-5 text-indigo-600" />,
      title: 'Targeted Resume Generation',
      description:
        'Generate deterministic resumes tailored to specific engineering jobs, complete with verifiable proof links and zero hallucinated bullet points.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
      title: 'Merit-Based Discovery',
      description:
        'Technical recruiters evaluate candidates on actual code quality and architectural depth, giving equal voice to self-taught and traditional backgrounds.',
    },
  ];

  return (
    <section id="career-twin" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-indigo-950/60 bg-white/70 dark:bg-[#0c1024]/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-semibold text-violet-600 dark:text-cyan-400 uppercase tracking-widest mb-2.5">
              For Builders & Engineers
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              Every piece of code you ship becomes career leverage.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Traditional job boards treat your career as a list of buzzwords. RYVOLT unifies project evidence, skills, resumes, and applications into an interconnected execution engine where your work speaks for itself.
            </p>

            <div className="mt-6 p-5 rounded-2xl bg-[#F7F8FF] dark:bg-[#11162A] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                The Integrated Candidate Loop
              </div>
              <p className="leading-relaxed font-mono text-[11px] text-violet-600 dark:text-cyan-400">
                Code Commit ➔ BuildLab Verification ➔ Skill Evidence Update ➔ Resume Generation ➔ Direct Interview Shortlist.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11162A]/90 hover:border-violet-500/50 dark:hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-lg hover:shadow-violet-500/10 group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-cyan-500/10 border border-violet-500/20 dark:border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {pillar.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
