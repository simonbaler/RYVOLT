import React from 'react';
import { ShieldCheck, Users, Search, Award } from 'lucide-react';

export const RecruiterValueSection: React.FC = () => {
  const points = [
    {
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      title: 'Inspect Artifacts, Not Resumes',
      description:
        'Review candidates by evaluating actual test coverage, benchmark execution, and code architecture rather than inflated keyword bullets.',
    },
    {
      icon: <Search className="w-5 h-5 text-indigo-600" />,
      title: 'Precision Competency Search',
      description:
        'Query candidates by concrete technical criteria (e.g., "Demonstrated Raft consensus implementation" or "High-throughput Redis cache pipeline").',
    },
    {
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      title: 'Collaborative Hiring Workflows',
      description:
        'Hiring managers and engineers review the same inspectable artifact evidence, keeping candidate evaluations objective and evidence-grounded.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
      title: 'Human-Reviewed Shortlists',
      description:
        'No opaque automated rejections or arbitrary percentage scores. Real engineers make hiring decisions with complete transparency.',
    },
  ];

  return (
    <section id="recruiters" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-indigo-950/60 bg-[#F7F8FF]/80 dark:bg-[#080B18] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 order-2 lg:order-1">
            {points.map((pt, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11162A]/90 hover:border-violet-500/50 dark:hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-lg hover:shadow-violet-500/10 group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-cyan-500/10 border border-violet-500/20 dark:border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {pt.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {pt.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pt.description}
                </p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="text-xs font-semibold text-violet-600 dark:text-cyan-400 uppercase tracking-widest mb-2.5">
              For Technical Recruiters & Hiring Managers
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              Stop filtering 500 identical resumes. Start hiring verified capability.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Engineering leaders lose hundreds of hours sifting through AI-generated resumes that misrepresent skills. RYVOLT provides verifiable evidence of execution so you can interview candidates with proven engineering craft.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-cyan-400" />
                Verified Artifacts
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Team Scorecards
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                No Keyword Spam
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
