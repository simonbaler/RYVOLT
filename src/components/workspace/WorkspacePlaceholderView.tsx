import React from 'react';
import { NavItem, WorkspaceRole } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { ShieldAlert, Database, FileCode, CheckCircle2, Lock } from 'lucide-react';

export interface WorkspacePlaceholderViewProps {
  role: WorkspaceRole;
  item: NavItem;
  onNavigateCandidateTab?: (tabId: string) => void;
  onLaunchOnboarding?: () => void;
}

export const WorkspacePlaceholderView: React.FC<WorkspacePlaceholderViewProps> = ({
  role,
  item,
  onLaunchOnboarding,
}) => {
  const getTechnicalSpec = (id: string) => {
    switch (id) {
      case 'career-twin':
        return {
          route: '/app/candidate/career-twin',
          phase: 3,
          dataContract: 'CareerOntologyGraph (Node[]: SkillEvidence | Artifact | TestProof, Edge[]: verifies | links)',
          authRequirement: 'Candidate Session (JWT via Supabase Auth) with RLS candidate_id match',
          plannedFeatures: [
            'SVG/React Flow interactive skill ontology canvas',
            'Verification depth indicators (L1 syntax check through L4 partition load tests)',
            'Direct linkage to verified commit hashes and BuildLab run IDs',
          ],
        };
      case 'buildlab':
        return {
          route: '/app/candidate/buildlab',
          phase: 5,
          dataContract: 'BuildLabJob (repo_url, commit_sha, suite_config, runner_status, test_report)',
          authRequirement: 'Candidate Session + GitHub App installation token',
          plannedFeatures: [
            'Isolated Docker container runner execution',
            'Test coverage and pass rate certification',
            'Automated skill extraction from test suites',
          ],
        };
      case 'discover-jobs':
        return {
          route: '/app/candidate/jobs',
          phase: 4,
          dataContract: 'RequisitionMatch (job_id, required_proof[], candidate_alignment, hiring_org)',
          authRequirement: 'Candidate Session (Read-only verified jobs catalog)',
          plannedFeatures: [
            'Skill-artifact aligned role filtering',
            'Transparent requirement comparison without black-box scores',
            'Direct application with verified evidence payload',
          ],
        };
      case 'resume-studio':
        return {
          route: '/app/candidate/resume-studio',
          phase: 6,
          dataContract: 'ResumeDocument (sections[], cited_artifacts[], formatting_presets)',
          authRequirement: 'Candidate Session (Personal document storage with RLS)',
          plannedFeatures: [
            'Deterministic Markdown/PDF compilation',
            'Footnote citations linking bullet points to public BuildLab reports',
            'Tailored exports for specific verified job requisitions',
          ],
        };
      case 'post-job':
        return {
          route: '/app/recruiter/post-job',
          phase: 7,
          dataContract: 'JobRequisition (org_id, required_competencies[], compensation_band, rubric)',
          authRequirement: 'Verified Employer Role + Organization Admin Membership',
          plannedFeatures: [
            'Artifact-based role specification builder',
            'Custom benchmark definitions for applicants',
            'Automated hiring team invitation routing',
          ],
        };
      case 'discover-candidates':
        return {
          route: '/app/recruiter/candidates',
          phase: 7,
          dataContract: 'CandidateEvidencePortfolio (anonymized_id, verified_skills[], public_repos[])',
          authRequirement: 'Recruiter Subscription + Active Organization Seat',
          plannedFeatures: [
            'Artifact inspection query engine',
            'Evidence-grounded filtering across languages and frameworks',
            'Direct outreach requests with candidate-approval gate',
          ],
        };
      case 'system-health':
        return {
          route: '/app/admin/system-health',
          phase: 8,
          dataContract: 'InfrastructureTelemetry (runner_pool, queue_latency, error_rates, uptime)',
          authRequirement: 'Platform Superadmin Role (MFA enforced)',
          plannedFeatures: [
            'BuildLab sandboxed runner pool metrics',
            'PostgreSQL connection pool and RLS latency monitoring',
            'Security event stream and rate limit alerts',
          ],
        };
      default:
        return {
          route: `/app/${role}/${item.id}`,
          phase: item.plannedPhase || 2,
          dataContract: `DomainRecord (${item.id}_id, tenant_id, created_at, schema_version)`,
          authRequirement: `Role-based Access Control: ${role.toUpperCase()} clearance required`,
          plannedFeatures: [
            'Designed for Phase ' + (item.plannedPhase || 2) + ' implementation',
            'Integrated with PostgreSQL and Supabase Row Level Security in Phase 2',
            'Zero mocked data or simulated transactions',
          ],
        };
    }
  };

  const spec = getTechnicalSpec(item.id);

  return (
    <div className="space-y-6">
      {/* Route & Phase Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Route:</span>
            <code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {spec.route}
            </code>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {item.label}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
          <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Roadmap · Phase {spec.phase} Module
          </span>
          <span className="text-[11px] text-slate-400">
            Architecture Staged · Not Operational
          </span>
        </div>
      </div>

      {/* Honest Empty State */}
      <EmptyState
        title={`${item.label} is planned for Phase ${spec.phase}`}
        description={
          item.id === 'career-twin'
            ? 'The interactive visual skill graph will be established in Phase 3. In Phase 2, you can calibrate your baseline parameters (name, headline, location, target role) persisted directly to PostgreSQL.'
            : `In accordance with the RYVOLT architectural roadmap, this route presents the technical specification without fabricating test data or simulating server authorization.`
        }
        plannedPhase={spec.phase}
        actionLabel={item.id === 'career-twin' && onLaunchOnboarding ? 'Initialize Profile Parameters' : undefined}
        onAction={item.id === 'career-twin' && onLaunchOnboarding ? onLaunchOnboarding : undefined}
      />

      {/* Technical Architecture Blueprint for this Module */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Target Data Contract</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700 break-all leading-relaxed">
            {spec.dataContract}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Relational schema definitions to be provisioned in Phase 2 with Row Level Security.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Authorization Gate</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700 leading-relaxed">
            {spec.authRequirement}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Unauthenticated access strictly prevented; real server-side JWT verification in Phase 2.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Planned Capabilities</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {spec.plannedFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
