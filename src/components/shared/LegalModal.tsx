import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: 'privacy' | 'terms' | null;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  docType,
}) => {
  if (!docType) return null;

  const isPrivacy = docType === 'privacy';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPrivacy ? 'Privacy Notice (Draft Placeholder)' : 'Terms of Service (Draft Placeholder)'}
      description="Notice: This document is an architectural placeholder awaiting formal legal review and counsel clearance."
    >
      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
          Working draft pending formal trademark clearance and legal counsel execution in Phase 2.
        </div>

        {isPrivacy ? (
          <>
            <h4 className="font-bold text-slate-900 text-sm">1. Candidate Data Privacy Standard</h4>
            <p>
              RYVOLT will store repository metadata, commit histories, and test suite logs solely for verifying technical capability with explicit candidate authorization.
            </p>
            <h4 className="font-bold text-slate-900 text-sm">2. Zero Unauthorized Data Brokerage</h4>
            <p>
              Candidate profiles and career twin representations are never sold or shared with third-party recruitment brokers. Only verified prospective employers with active hiring roles receive profile access upon candidate application.
            </p>
            <h4 className="font-bold text-slate-900 text-sm">3. Sandboxed Execution Isolation</h4>
            <p>
              Code repositories cloned by BuildLab runners will run in isolated, ephemeral sandboxes and will be purged following benchmark completion.
            </p>
          </>
        ) : (
          <>
            <h4 className="font-bold text-slate-900 text-sm">1. Brand and Platform Ownership</h4>
            <p>
              RYVOLT is a working brand pending formal trademark and domain clearance. All code, design systems, and verification algorithms are proprietary foundations.
            </p>
            <h4 className="font-bold text-slate-900 text-sm">2. Authentic Skill Attestation</h4>
            <p>
              Users agree to submit only code repositories they have authored or substantially contributed to. Automated test cheating or submission of spoofed artifacts will result in account suspension.
            </p>
            <h4 className="font-bold text-slate-900 text-sm">3. Employer Responsibilities</h4>
            <p>
              Employers and recruiters agree to evaluate candidates based on verifiable technical merit, objective scorecards, and human review.
            </p>
          </>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Notice
          </Button>
        </div>
      </div>
    </Modal>
  );
};
