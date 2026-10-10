import React from 'react';
import { Compass, FileCode2, Target } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Build your Career Twin',
      description:
        'Map your engineering interests, repository languages, and target roles into a living career graph that updates dynamically as you write and ship software.',
      icon: <Compass className="w-6 h-6 text-indigo-600" />,
      detail: 'Structured ontology connecting roles to tangible technical benchmarks.',
    },
    {
      number: '02',
      title: 'Turn projects into skill evidence',
      description:
        'Connect source repositories to BuildLab. Our sandboxed runner executes your tests, inspects architectural boundaries, and indexes verifiable skill proof.',
      icon: <FileCode2 className="w-6 h-6 text-indigo-600" />,
      detail: 'Real commit shas, passing test suites, and transparent benchmark records.',
    },
    {
      number: '03',
      title: 'Connect your skills to real opportunities',
      description:
        'Get discovered by technical engineering leaders for roles precisely calibrated to your verified capability, eliminating keyword spam and opaque candidate filtering.',
      icon: <Target className="w-6 h-6 text-indigo-600" />,
      detail: 'Direct employer matching with inspectable proof portfolios.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-indigo-950/60 bg-white/50 dark:bg-[#0c1024]/60 backdrop-blur-sm relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/10 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-14 sm:mb-20">
          <div className="text-xs font-semibold text-violet-600 dark:text-cyan-400 uppercase tracking-widest mb-2.5 flex items-center justify-center gap-2">
            <span>Deterministic Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How RYVOLT works
          </h2>
          <p className="mt-3.5 text-base text-slate-600 dark:text-slate-300 leading-relaxed text-balance">
            A three-step progression from verifiable code commitment to high-certainty career rise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#11162A]/90 hover:border-violet-500/50 dark:hover:border-cyan-500/50 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 dark:from-violet-500/20 dark:to-cyan-500/20 border border-violet-500/20 dark:border-cyan-500/30 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {step.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-300 dark:text-slate-700 group-hover:text-cyan-400 transition-colors">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2.5">
                  {step.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                  {step.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
