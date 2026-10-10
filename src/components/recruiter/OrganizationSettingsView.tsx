import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Users,
  Globe,
  Plus,
  CheckCircle2,
  Lock,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService } from '../../services/recruiterService';
import { Organization } from '../../types/database';
import { audioService } from '../../lib/audioService';

export const OrganizationSettingsView: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const orgs = await recruiterService.getOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedOrg(orgs[0]);
        setOrgName(orgs[0].name);
        setWebsite(orgs[0].website || '');
      }
    }
    load();
  }, []);

  const handleAddDomain = () => {
    if (!newDomain.trim() || !selectedOrg) return;
    const cleanDomain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!selectedOrg.domain_whitelist.includes(cleanDomain)) {
      const updated = {
        ...selectedOrg,
        domain_whitelist: [...selectedOrg.domain_whitelist, cleanDomain],
      };
      setSelectedOrg(updated);
      recruiterService.upsertOrganization(updated);
      audioService.playSaveSuccess();
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (dom: string) => {
    if (!selectedOrg) return;
    const updated = {
      ...selectedOrg,
      domain_whitelist: selectedOrg.domain_whitelist.filter((d) => d !== dom),
    };
    setSelectedOrg(updated);
    recruiterService.upsertOrganization(updated);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    const updated = await recruiterService.upsertOrganization({
      ...selectedOrg,
      name: orgName,
      website,
    });
    setSelectedOrg(updated);
    setSavedSuccess(true);
    audioService.playSaveSuccess();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Organization & Team Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enterprise company identity, verified email domain restrictions, and hiring team seats.
        </p>
      </div>

      {selectedOrg && (
        <form onSubmit={handleSaveOrg} className="space-y-6">
          {/* Identity */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-lg border border-slate-800">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedOrg.name}</h3>
                    {selectedOrg.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Enterprise</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">slug: {selectedOrg.slug}</p>
                </div>
              </div>

              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Website URL
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Domain Whitelist & SSO Bounds */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs transition-colors text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                <span>Authorized Recruiter Email Domains</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Only users registering with email addresses under these whitelisted domains can claim hiring seats.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. nexuscloud.io or engineering.internal"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddDomain}>
                Add Domain
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selectedOrg.domain_whitelist.map((dom) => (
                <span
                  key={dom}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs border border-slate-200 dark:border-slate-700"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>@{dom}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(dom)}
                    className="hover:text-rose-500 ml-1 text-slate-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Save Organization Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
