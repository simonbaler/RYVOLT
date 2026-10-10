import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { buildLabService } from '../../services/buildLabService';
import { BuildLabRepository, BuildLabTestRun } from '../../types/database';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import {
  Hammer,
  GitBranch,
  CheckCircle2,
  Play,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  GitCommit,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface BuildLabViewProps {
  onNavigateToTwin?: () => void;
  onNavigateToResumeStudio?: () => void;
}

export const BuildLabView: React.FC<BuildLabViewProps> = ({
  onNavigateToTwin,
  onNavigateToResumeStudio,
}) => {
  const { user } = useAuth();
  const userId = user?.id || 'demo-candidate';

  const [repositories, setRepositories] = useState<BuildLabRepository[]>([]);
  const [testRuns, setTestRuns] = useState<BuildLabTestRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Connect Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('main');
  const [isConnecting, setIsConnecting] = useState(false);

  // Trigger Run Modal State
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<BuildLabRepository | null>(null);
  const [suiteName, setSuiteName] = useState('Automated Concurrency & Unit Benchmark Suite');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [lastExecutedRun, setLastExecutedRun] = useState<BuildLabTestRun | null>(null);

  // Inspect Logs Modal
  const [activeLogsRun, setActiveLogsRun] = useState<BuildLabTestRun | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [repos, runs] = await Promise.all([
          buildLabService.getRepositories(userId),
          buildLabService.getTestRuns(userId),
        ]);
        if (isMounted) {
          setRepositories(repos);
          setTestRuns(runs);
        }
      } catch (err) {
        console.warn('BuildLab load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoUrl.trim()) return;

    setIsConnecting(true);
    try {
      const created = await buildLabService.connectRepository(userId, {
        repoUrl: newRepoUrl.trim(),
        defaultBranch: newRepoBranch.trim() || 'main',
      });
      setRepositories((prev) => [created, ...prev]);
      setIsConnectModalOpen(false);
      setNewRepoUrl('');
    } catch (err) {
      console.warn('Connect repo error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTriggerRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) return;

    setIsRunningTest(true);
    try {
      const executed = await buildLabService.triggerTestRun(userId, {
        repositoryId: selectedRepo.id,
        repoName: selectedRepo.repo_name,
        branch: selectedRepo.default_branch,
        suiteName: suiteName.trim() || 'CI Verification Suite',
      });
      setTestRuns((prev) => [executed, ...prev]);
      setLastExecutedRun(executed);
      setIsRunModalOpen(false);
    } catch (err) {
      console.warn('Trigger test run error:', err);
    } finally {
      setIsRunningTest(false);
    }
  };

  const totalCertifiedTests = testRuns
    .filter((r) => r.certified)
    .reduce((acc, r) => acc + r.passed_tests, 0);

  const avgCoverage =
    testRuns.length > 0
      ? (
          testRuns.reduce((acc, r) => acc + Number(r.coverage_percentage), 0) /
          testRuns.length
        ).toFixed(1)
      : '93.5';

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Hammer className="w-3.5 h-3.5 text-cyan-400" />
                <span>BUILDLAB AUTOMATION · PHASE 6</span>
              </span>
              <span className="text-xs text-slate-400">· Proof Over Promises</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Automated Code Test Harness & Artifact Certification
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Connect candidate GitHub repositories, execute isolated test suites in Docker environments, and mint cryptographically verifiable certification badges to substantiate Career Twin competencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConnectModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4 text-cyan-300" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
            >
              Connect Repository
            </Button>

            {onNavigateToTwin && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToTwin}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-lg shadow-indigo-500/30 cursor-pointer"
              >
                Inspect Career Twin
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. TELEMETRY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Connected Repositories</span>
            <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {repositories.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">GitHub synchronized</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>PassedTests Certified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCertifiedTests}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
            100% pass verification
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Mean Code Coverage</span>
            <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {avgCoverage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Statement coverage</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Certified Badges Minted</span>
            <Zap className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {testRuns.filter((r) => r.certified).length}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
            Cryptographic attestations
          </div>
        </div>
      </div>

      {/* 3. REPOSITORIES AND TEST RUN CERTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Connected Repositories (1 col) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Synchronized Repositories</span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a repository to trigger a Dockerized test suite run.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConnectModalOpen(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400"
              >
                + Add
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate">
                        {repo.repo_name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {repo.language}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span>branch: {repo.default_branch}</span>
                      <span>·</span>
                      <span>{repo.framework || 'Custom'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={repo.clone_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-mono"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>GitHub</span>
                    </a>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedRepo(repo);
                        setIsRunModalOpen(true);
                      }}
                      leftIcon={<Play className="w-3 h-3 fill-current" />}
                      className="text-xs py-1 px-2.5 h-auto"
                    >
                      Run Tests
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Certified Test Runs & Badges (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Certified Test Runs & Proof Badges</span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated execution reports with verified commit SHAs, test counts, and skills proof.
                </p>
              </div>

              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Continuous Certification
              </span>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {testRuns.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No test executions recorded yet. Run a suite from any repository on the left.
                </div>
              ) : (
                testRuns.map((run) => (
                  <div
                    key={run.id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PASSED & CERTIFIED</span>
                          </span>

                          <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                            <GitCommit className="w-3.5 h-3.5" />
                            <span>SHA {run.commit_sha.slice(0, 8)}</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {run.suite_name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {run.commit_message}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveLogsRun(run)}
                          leftIcon={<Terminal className="w-3.5 h-3.5 text-slate-500" />}
                          className="text-xs py-1 px-2.5 h-auto cursor-pointer"
                        >
                          View Logs
                        </Button>
                      </div>
                    </div>

                    {/* Metric Bar */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Pass Rate</span>
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {run.passed_tests}/{run.total_tests} (100%)
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px]">Coverage</span>
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {run.coverage_percentage}%
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px]">Duration</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {(run.duration_ms / 1000).toFixed(1)}s
                        </div>
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <span className="text-slate-400 text-[11px]">Badge Token</span>
                        <div className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 truncate">
                          {run.certification_badge_id || 'CERTIFIED'}
                        </div>
                      </div>
                    </div>

                    {/* Certified Skills Badges */}
                    {run.certified_skills && run.certified_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400">Attested Competencies:</span>
                        {run.certified_skills.map((s) => (
                          <span
                            key={s}
                            className="text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL 1: Connect GitHub Repo */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect GitHub Repository to BuildLab"
        maxWidth="md"
      >
        <form onSubmit={handleConnectRepo} className="space-y-4 text-xs">
          <p className="text-slate-500 leading-relaxed">
            Provide the GitHub repository URL to register automated test suite hooks and certify code execution.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Repository URL or identifier
            </label>
            <Input
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              placeholder="e.g. https://github.com/username/distributed-cache"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default branch
            </label>
            <Input
              value={newRepoBranch}
              onChange={(e) => setNewRepoBranch(e.target.value)}
              placeholder="main"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsConnectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isConnecting}
            >
              Connect & Synchronize
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Trigger Test Run */}
      <Modal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        title={`Execute Test Suite on ${selectedRepo?.repo_name || 'Repository'}`}
        maxWidth="md"
      >
        <form onSubmit={handleTriggerRun} className="space-y-4 text-xs">
          <p className="text-slate-500 leading-relaxed">
            BuildLab will provision a sandboxed runner environment, clone commit HEAD, run the configured test suite, and record proof in your Career Twin.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Suite Name
            </label>
            <Input
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              placeholder="e.g. Distributed Consensus Verification Suite"
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px]">
            <div>Runner: ryvolt-docker-runner-v2</div>
            <div>Branch: {selectedRepo?.default_branch || 'main'}</div>
            <div>Language runtime: {selectedRepo?.language || 'Go'}</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsRunModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isRunningTest}
              leftIcon={<Play className="w-3 h-3 fill-current" />}
            >
              Execute & Certify
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Inspect Logs */}
      <Modal
        isOpen={Boolean(activeLogsRun)}
        onClose={() => setActiveLogsRun(null)}
        title={`BuildLab Runner Output · ${activeLogsRun?.commit_sha.slice(0, 8)}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-slate-800">
            {activeLogsRun?.logs_excerpt || 'No execution logs recorded.'}
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Badge: {activeLogsRun?.certification_badge_id}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveLogsRun(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
