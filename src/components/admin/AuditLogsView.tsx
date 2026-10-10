import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService } from '../../services/adminService';
import { PlatformAuditLog } from '../../types/database';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await adminService.getAuditLogs();
      setLogs(data);
      setLoading(false);
    }
    load();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.target_resource.toLowerCase().includes(q) ||
      (l.actor_email && l.actor_email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Security & Platform Audit Logs
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cryptographically immutable audit records of administrative, recruiter, and automated platform actions.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter audit events by action (e.g. job.publish, evidence.verified)..."
          className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {log.action}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {log.target_resource}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  actor: <span className="text-slate-900 dark:text-white font-semibold">{log.actor_email || log.actor_role}</span> • ip:{' '}
                  {log.ip_address || '127.0.0.1'}
                </p>
                {log.details && (
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-xl">
                    payload: {JSON.stringify(log.details)}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right self-end sm:self-center">
                <span className="text-xs font-mono text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-400">
              No audit records matching query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
