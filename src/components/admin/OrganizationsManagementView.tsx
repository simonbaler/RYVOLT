import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Search,
  Plus,
  ExternalLink,
  CheckCircle2,
  Globe,
  Mail,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService } from '../../services/recruiterService';
import { Organization } from '../../types/database';

export const OrganizationsManagementView: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');

  useEffect(() => {
    async function load() {
      const orgs = await recruiterService.getOrganizations();
      setOrganizations(orgs);
    }
    load();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const created = await recruiterService.upsertOrganization({
      name: newOrgName.trim(),
      verified: true,
      domain_whitelist: newOrgDomain ? [newOrgDomain.trim().toLowerCase()] : [],
    });

    setOrganizations([created, ...organizations]);
    setShowAddModal(false);
    setNewOrgName('');
    setNewOrgDomain('');
  };

  const filtered = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Employer Organizations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise employer accounts, verified company credentials, and corporate email domain bounds.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Verify New Employer
        </Button>
      </div>

      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter organizations by name..."
          className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((org) => (
          <div
            key={org.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{org.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">/{org.slug}</p>
                </div>
              </div>

              {org.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Whitelisted Domains:{' '}
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {org.domain_whitelist.join(', ') || 'None assigned'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Provision & Verify Enterprise</span>
            </h3>

            <form onSubmit={handleCreateOrg} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Apex Distributed Labs"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Email Domain
                </label>
                <input
                  type="text"
                  value={newOrgDomain}
                  onChange={(e) => setNewOrgDomain(e.target.value)}
                  placeholder="e.g. apexdl.ai"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Provision Enterprise
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
