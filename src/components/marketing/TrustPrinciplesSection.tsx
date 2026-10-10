import React from 'react';
import { PLANNED_INTEGRATIONS } from '../../lib/constants';
import { Lock, Eye, UserCheck2, Sparkles, Check } from 'lucide-react';

export const TrustPrinciplesSection: React.FC = () => {
  const principles = [
    {
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      title: 'Candidate Privacy First',
      description:
        'Your profile, code repositories, and career twin remain completely private until you explicitly choose to share them or apply for a role.',
    },
    {
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      title: 'Permission-Based Integrations',
      description:
        'Integrations only request minimal required scopes. We never request blanket write access to your GitHub repositories or LinkedIn profile.',
    },
    {
      icon: <UserCheck2 className="w-5 h-5 text-indigo-600" />,
      title: 'Mandatory User Approval',
      description:
        'No external messages, recruiter applications, or social posts are ever sent automatically. Every action requires your explicit confirmation.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
      title: 'Transparent AI Assistance',
      description:
        'AI recommendations always explain their exact technical reasoning. We do not use black-box ranking algorithms or arbitrary percentage match gimmicks.',
    },
  ];

  return (
    <section id="trust" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-indigo-950/60 bg-white/70 dark:bg-[#0c1024]/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-14 sm:mb-20">
          <div className="text-xs font-semibold text-violet-600 dark:text-cyan-400 uppercase tracking-widest mb-2.5">
            Governance & Standards
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Trust, Privacy & Staged Integrations
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed text-balance">
            RYVOLT operates on strict integrity principles. We do not display fabricated customer logos, fake success statistics, or pretend integrations.
          </p>
        </div>

        {/* 4 Core Trust Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {principles.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11162A]/90 hover:border-violet-500/50 dark:hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-lg hover:shadow-violet-500/10 flex flex-col justify-between group"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 dark:bg-cyan-500/10 border border-violet-500/20 dark:border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {p.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {p.description}
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-cyan-400">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Enforced by design</span>
              </div>
            </div>
          ))}
        </div>

        {/* Planned Integrations Staging Status */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-[#F7F8FF] dark:bg-[#11162A] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-5 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Planned Ecosystem Integrations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transparent roadmap status. All services below are in architectural design phase and are strictly non-connected in Phase 1.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
              Integrations: 0 Live · 4 Planned
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANNED_INTEGRATIONS.map((integ) => (
              <div
                key={integ.id}
                className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {integ.name}
                    </span>
                    <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      {integ.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-2">
                    {integ.category} · State: {integ.connectionState}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {integ.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Security boundary: </span>
                  {integ.securityScope}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
