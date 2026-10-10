import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { WorkspaceRole } from '../../types';
import { KeyRound, Shield, User, Building, ArrowRight } from 'lucide-react';

export interface AuthPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: WorkspaceRole) => void;
}

export const AuthPreviewModal: React.FC<AuthPreviewModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RYVOLT Authentication Architecture"
      description="Phase 1 implements the route structure, layout primitives, and navigation contracts without simulated fake accounts."
    >
      <div className="space-y-4">
        {/* Notice of planned Supabase integration */}
        <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
          <KeyRound className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Phase 2 Authentication: </span>
            Supabase Auth with Row Level Security (RLS) is scheduled for Phase 2. No mock credentials or fake database records are stored in Phase 1.
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
            Explore Workspace Navigation Shells
          </h4>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            You can test the navigation architecture, layout responsiveness, and module specifications across all three target roles:
          </p>

          <div className="space-y-2">
            <button
              onClick={() => {
                onClose();
                onSelectRole('candidate');
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-600 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Candidate Workspace
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Career Twin, BuildLab, Resume Studio, Job Discovery
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button
              onClick={() => {
                onClose();
                onSelectRole('recruiter');
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-600 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Recruiter Workspace
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Job Requisitions, Candidate Discovery, Team Shortlists
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button
              onClick={() => {
                onClose();
                onSelectRole('admin');
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-600 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Admin Console Shell
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Platform Moderation, System Health, Audit Telemetry
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
