import React, { useState, useEffect } from 'react';
import {
  Send,
  Bot,
  Webhook,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Code,
  Bell,
  Download,
  Key,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { integrationService } from '../../services/integrationService';
import { useAuth } from '../../contexts/AuthContext';
import { CandidateIntegration } from '../../types/database';

export const IntegrationsSettingsView: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<CandidateIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Telegram state
  const [telegramPairCode, setTelegramPairCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState(true);
  const [notifyJobs, setNotifyJobs] = useState(true);

  // n8n state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [n8nEnabled, setN8nEnabled] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'application.status_changed',
    'job.high_match',
  ]);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    message: string;
    payload?: any;
  } | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await integrationService.getIntegrations(user.id);
      setIntegrations(data);
      setTelegramPairCode(data.telegram_pairing_code);
      setTelegramEnabled(data.telegram_enabled);
      setNotifyStatus(data.telegram_notify_status);
      setNotifyJobs(data.telegram_notify_jobs);
      setWebhookUrl(data.n8n_webhook_url || '');
      setWebhookSecret(data.n8n_webhook_secret || '');
      setN8nEnabled(data.n8n_enabled);
      setSelectedEvents(data.n8n_events || ['application.status_changed', 'job.high_match']);
    } catch (e: any) {
      console.error('Error loading integrations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePairCode = async () => {
    if (!user) return;
    setIsGeneratingCode(true);
    try {
      const code = await integrationService.generateTelegramPairingCode(user.id);
      setTelegramPairCode(code);
      setFeedback({ type: 'success', message: 'New Telegram pairing code generated.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // Ignore
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSaveTelegram = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await integrationService.updateTelegramSettings(user.id, {
        telegram_enabled: telegramEnabled,
        telegram_notify_status: notifyStatus,
        telegram_notify_jobs: notifyJobs,
      });
      setFeedback({ type: 'success', message: 'Telegram alert settings updated.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to save Telegram settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSecret = () => {
    const sec = integrationService.generateWebhookSecret();
    setWebhookSecret(sec);
  };

  const handleSaveN8n = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await integrationService.updateN8nSettings(user.id, {
        n8n_webhook_url: webhookUrl.trim() || null,
        n8n_webhook_secret: webhookSecret.trim() || null,
        n8n_events: selectedEvents,
        n8n_enabled: n8nEnabled,
      });
      setFeedback({ type: 'success', message: 'n8n automation webhook preferences saved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to save n8n settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a valid webhook URL first.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await integrationService.testN8nWebhook(
        webhookUrl.trim(),
        webhookSecret.trim() || null,
        'application.status_changed'
      );
      setWebhookTestResult(res);
    } catch (e: any) {
      setWebhookTestResult({
        success: false,
        message: e?.message || 'Webhook request failed.',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadN8nTemplate = () => {
    const jsonStr = integrationService.getSampleN8nWorkflowTemplate();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ryvolt-career-n8n-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          <span>Workflow Automation</span>
          <span>·</span>
          <span>External Pipeline Triggers</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Telegram Bot & n8n Workflow Integrations
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Receive real-time push alerts on Telegram and trigger custom n8n automation pipelines when applications progress or new matching roles emerge.
        </p>
      </div>

      {/* Global Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 shadow-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================== */}
        {/* TELEGRAM NOTIFICATION BOT CARD */}
        {/* ================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Telegram Career Bot
                  </h3>
                  <p className="text-xs text-slate-500">
                    @RyvoltCareerBot · Instant candidate notifications
                  </p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  telegramEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {telegramEnabled ? 'Active' : 'Unpaired'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pair your Telegram account to receive instant push alerts whenever a recruiter reviews your profile, schedules an interview round, or extends an offer.
            </p>

            {/* Pairing Code Generator Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Pairing Verification Code</span>
                <button
                  onClick={handleGeneratePairCode}
                  disabled={isGeneratingCode}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                  Generate New Code
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white font-mono text-base font-bold tracking-widest text-slate-900 px-3 py-2 rounded-lg border border-slate-200 text-center">
                  {telegramPairCode || 'RYV-7K9A'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(telegramPairCode || 'RYV-7K9A', 'pairCode')}
                  leftIcon={
                    copiedKey === 'pairCode' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedKey === 'pairCode' ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <ol className="text-[11px] text-slate-500 space-y-1 pl-4 list-decimal">
                <li>
                  Open Telegram and search for <strong>@RyvoltCareerBot</strong>
                </li>
                <li>
                  Send message: <code className="bg-white px-1 rounded text-slate-800">/pair {telegramPairCode || 'RYV-7K9A'}</code>
                </li>
                <li>Your account will be connected securely with zero token sharing.</li>
              </ol>
            </div>

            {/* Notification Checkboxes */}
            <div className="space-y-2 pt-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                Notification Subscriptions
              </span>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyStatus}
                  onChange={(e) => setNotifyStatus(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Application stage transitions (Interview scheduled, review, offers)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyJobs}
                  onChange={(e) => setNotifyJobs(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>New high-match job postings (&gt;80% Twin match)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-900">Enable Telegram Alerts</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Telegram Bot API v7.2</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveTelegram}
              disabled={isSaving}
            >
              Save Telegram Settings
            </Button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* n8n AUTOMATION WEBHOOK CARD */}
        {/* ================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    n8n Workflow Automation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Custom Webhook triggers & event payloads
                  </p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  n8nEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {n8nEnabled ? 'Webhook Active' : 'Disabled'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Dispatch structured JSON events to your self-hosted or cloud n8n workflows. Automate logging to Notion, Google Sheets, Discord channels, or custom webhook endpoints.
            </p>

            {/* Webhook Endpoint Input */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">
                Target n8n Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.yourdomain.com/webhook/ryvolt-career-events"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Webhook Secret Signature */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Secret Signing Key (HMAC SHA-256)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSecret}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  Generate Secret
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Auto-generated cryptographic signing secret"
                  className="w-full p-2.5 font-mono text-[11px] rounded-xl border border-slate-200 text-slate-800 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {webhookSecret && (
                  <button
                    onClick={() => handleCopy(webhookSecret, 'secret')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 rounded cursor-pointer"
                  >
                    {copiedKey === 'secret' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* Subscribed Events */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                Dispatched Event Triggers
              </span>

              {[
                { id: 'application.status_changed', label: 'application.status_changed (Lifecycle transitions)' },
                { id: 'job.high_match', label: 'job.high_match (New opportunity scored >80%)' },
                { id: 'twin.verified_evidence', label: 'twin.verified_evidence (BuildLab project certified)' },
              ].map((ev) => (
                <label key={ev.id} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{ev.label}</span>
                </label>
              ))}

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={n8nEnabled}
                  onChange={(e) => setN8nEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-900">Enable n8n Dispatcher</span>
              </label>
            </div>

            {/* Webhook Test Action & Result */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !webhookUrl.trim()}
                  isLoading={isTestingWebhook}
                  leftIcon={<Send className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  Send Test Ping
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadN8nTemplate}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download n8n JSON
                </Button>
              </div>

              {webhookTestResult && (
                <div
                  className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                    webhookTestResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {webhookTestResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{webhookTestResult.message}</span>
                  </div>
                  {webhookTestResult.payload && (
                    <pre className="text-[10px] bg-white/80 p-2 rounded border border-emerald-200 font-mono overflow-x-auto mt-1">
                      {JSON.stringify(webhookTestResult.payload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Header: X-Ryvolt-Signature</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveN8n}
              disabled={isSaving}
            >
              Save n8n Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
