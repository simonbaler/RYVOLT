import React from 'react';
import { AppRole } from '../../types/database';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

export interface UnauthorizedViewProps {
  requiredRole: AppRole;
  userRoles: AppRole[];
  onReturnToAllowedRole: () => void;
  onRequestAccess?: () => void;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  requiredRole,
  userRoles,
  onReturnToAllowedRole,
  onRequestAccess,
}) => {
  const roleName = {
    candidate: 'Candidate',
    recruiter: 'Recruiter',
    admin: 'Platform Administrator',
  }[requiredRole];

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 mb-2">
          <Lock className="w-3 h-3" />
          <span>403 Forbidden · Role Clearance Required</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {roleName} Clearance Required
        </h3>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Your authenticated account holds the <strong className="text-slate-900">[{userRoles.join(', ')}]</strong> role(s).
          Access to this workspace is restricted by database security policies and requires an explicit <strong className="text-slate-900">{requiredRole}</strong> role grant.
        </p>

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left text-xs text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700">Database Policy Enforcement:</div>
          <p className="text-[11px] leading-relaxed">
            Public signups strictly receive the candidate role. Recruiter and administrative roles require authorized invitation or administrative provisioning.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={onReturnToAllowedRole}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto justify-center"
          >
            Return to Candidate Workspace
          </Button>

          {onRequestAccess && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestAccess}
              className="w-full sm:w-auto justify-center"
            >
              Request Access
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
