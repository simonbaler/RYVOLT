import React from 'react';
import { BrandLogo } from '../ui/BrandLogo';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenLegalModal: (docType: 'privacy' | 'terms') => void;
  onStartBuilding: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateSection,
  onOpenLegalModal,
  onStartBuilding,
}) => {
  return (
    <footer className="bg-white/80 dark:bg-[#080B18] border-t border-slate-200/80 dark:border-indigo-950/60 text-slate-600 dark:text-slate-400 transition-colors">
      {/* Final Call to Action Strip */}
      <div className="border-b border-slate-100 dark:border-slate-850/60 bg-[#F7F8FF] dark:bg-[#0c1024] py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center relative z-10">
          <div className="text-xs font-semibold text-violet-600 dark:text-cyan-400 uppercase tracking-widest mb-2.5">
            Phase 9 Quantum Studio Staged
          </div>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-xl">
            Ready to experience an execution-first career platform?
          </h3>
          <p className="mt-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed text-balance">
            Preview the candidate career twin, explore recruiter shortlists, and test our verified component architecture.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <Button
              variant="quantum"
              size="md"
              onClick={onStartBuilding}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="shadow-lg shadow-violet-600/20 px-6 font-semibold"
            >
              Start building with RYVOLT
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigateSection('design-system')}
            >
              Inspect Design Primitives
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <BrandLogo size="md" showTagline />
            <p className="mt-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              RYVOLT is a career intelligence platform that connects project execution, verified skill evidence, and real engineering opportunities.
            </p>
            <div className="mt-4 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Note: The RYVOLT name is a working brand pending formal trademark and domain clearance.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateSection('career-twin')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Career Twin
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('buildlab')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  BuildLab Sandbox
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('capabilities')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Opportunity Match
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('capabilities')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Resume Studio
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Audience
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateSection('career-twin')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left"
                >
                  For Candidates
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('recruiters')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left"
                >
                  For Recruiters
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('trust')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left"
                >
                  Hiring Integrity
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('trust')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left"
                >
                  Staged Integrations
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Governance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateSection('trust')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Principles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('privacy')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy (Draft)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('terms')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms of Service (Draft)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('design-system')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Design System Spec
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & legal disclaimer */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div>
            © 2026 RYVOLT. All rights reserved. Quantum Aurora Edition.
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>No fake data</span>
            <span aria-hidden="true">·</span>
            <span>No simulated auth</span>
            <span aria-hidden="true">·</span>
            <span>Real architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
