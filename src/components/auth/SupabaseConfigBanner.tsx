import React, { useState } from 'react';
import { Database, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SupabaseConfigBannerProps {
  compact?: boolean;
}

export const SupabaseConfigBanner: React.FC<SupabaseConfigBannerProps> = ({
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyMigrationPath = () => {
    navigator.clipboard.writeText('supabase/migrations/20261010000000_create_profiles_and_roles.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 text-xs text-amber-950">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900">
              Supabase Configuration Required for Live Cloud Persistence
            </div>
            <p className="text-amber-800/90 mt-0.5 leading-relaxed">
              Phase 2 auth and database features are ready. To connect a live Supabase project, supply <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-800 hover:text-amber-950 p-1 rounded-md transition-colors shrink-0 cursor-pointer"
          aria-label={expanded ? 'Collapse setup guide' : 'Expand setup guide'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2.5 text-amber-900">
          <div className="font-semibold text-[11px] uppercase tracking-wider text-amber-800">
            Three Setup Steps
          </div>

          <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
            <li>
              <span>Create a Supabase project at </span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold inline-flex items-center gap-0.5 hover:text-amber-950"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>.
            </li>
            <li>
              <span>Run the versioned migration in the Supabase SQL Editor: </span>
              <button
                onClick={copyMigrationPath}
                className="inline-flex items-center gap-1 font-mono text-[11px] bg-amber-100/90 px-1.5 py-0.5 rounded text-amber-950 hover:bg-amber-200 cursor-pointer"
                title="Click to copy file path"
              >
                <span>supabase/migrations/20261010000000_create_profiles_and_roles.sql</span>
                {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              </button>
            </li>
            <li>
              <span>Provide your publishable project credentials in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env.local</code> or platform Secrets:</span>
              <pre className="bg-amber-950 text-amber-100 p-2.5 rounded-lg mt-1 font-mono text-[10px] overflow-x-auto">
{`VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."`}
              </pre>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
