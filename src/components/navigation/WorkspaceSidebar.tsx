import React from 'react';
import {
  Home,
  Users,
  Briefcase,
  Compass,
  Hammer,
  FileText,
  Send,
  Settings,
  Building2,
  FolderKanban,
  CalendarCheck,
  Shield,
  Activity,
  Boxes,
  ScrollText,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { NavItem, WorkspaceRole } from '../../types';

export interface WorkspaceSidebarProps {
  role: WorkspaceRole;
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onExitWorkspace: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  role,
  items,
  activeId,
  onSelect,
  onExitWorkspace,
}) => {
  // Map icons cleanly based on ID
  const getIcon = (id: string) => {
    switch (id) {
      case 'home':
        return <Home className="w-4 h-4 shrink-0" />;
      case 'network':
        return <Users className="w-4 h-4 shrink-0" />;
      case 'discover-jobs':
      case 'jobs-moderation':
        return <Briefcase className="w-4 h-4 shrink-0" />;
      case 'career-twin':
        return <Compass className="w-4 h-4 shrink-0" />;
      case 'buildlab':
        return <Hammer className="w-4 h-4 shrink-0" />;
      case 'resume-studio':
        return <FileText className="w-4 h-4 shrink-0" />;
      case 'applications':
      case 'recruiter-applications':
        return <Send className="w-4 h-4 shrink-0" />;
      case 'settings':
      case 'organization-settings':
        return <Settings className="w-4 h-4 shrink-0" />;
      case 'overview':
      case 'platform-overview':
        return <Layers className="w-4 h-4 shrink-0" />;
      case 'post-job':
        return <Briefcase className="w-4 h-4 shrink-0" />;
      case 'discover-candidates':
      case 'users':
        return <Users className="w-4 h-4 shrink-0" />;
      case 'shortlists':
        return <FolderKanban className="w-4 h-4 shrink-0" />;
      case 'interviews':
        return <CalendarCheck className="w-4 h-4 shrink-0" />;
      case 'organizations':
        return <Building2 className="w-4 h-4 shrink-0" />;
      case 'admin-integrations':
        return <Boxes className="w-4 h-4 shrink-0" />;
      case 'audit-logs':
        return <ScrollText className="w-4 h-4 shrink-0" />;
      case 'system-health':
        return <Activity className="w-4 h-4 shrink-0" />;
      default:
        return <Shield className="w-4 h-4 shrink-0" />;
    }
  };

  const roleLabel = {
    guest: 'Guest Preview',
    candidate: 'Candidate Workspace',
    recruiter: 'Recruiter Workspace',
    admin: 'Admin Console',
  }[role];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onExitWorkspace}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md"
            title="Return to Public Overview"
          >
            <BrandLogo size="sm" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span className="uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">
            {roleLabel}
          </span>
          <span className="font-mono text-slate-400 dark:text-slate-500">Phase 5 Production</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group text-left ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 font-semibold ring-1 ring-indigo-200/60 dark:ring-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }
                >
                  {getIcon(item.id)}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.plannedPhase && (
                <span className="text-[10px] tabular-nums font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-1">
                  P{item.plannedPhase}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer with return action */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={onExitWorkspace}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
        >
          <span>Return to Homepage</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </aside>
  );
};
