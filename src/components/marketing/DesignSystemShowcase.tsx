import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tabs } from '../ui/Tabs';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { Skeleton } from '../ui/Skeleton';
import { Toast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Search, Mail, Sparkles, CheckCircle2 } from 'lucide-react';

export const DesignSystemShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('buttons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [selectValue, setSelectValue] = useState('fullstack');

  const tabs = [
    { id: 'buttons', label: 'Buttons & Actions' },
    { id: 'forms', label: 'Inputs & Form Controls' },
    { id: 'surfaces', label: 'Surfaces & Overlays' },
    { id: 'tokens', label: 'Tokens & Typography' },
  ];

  return (
    <section id="design-system" className="py-16 sm:py-20 border-t border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              Component Foundation
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Phase 1 Design System & UI Primitives
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Strictly accessible, zero-pill discipline, WCAG AA contrast, and single-elevation depth tokens.
            </p>
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="sm" />
        </div>

        {/* Tab 1: Buttons & Actions */}
        {activeTab === 'buttons' && (
          <div className="p-6 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Button Hierarchy & States
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Action</Button>
                <Button variant="ghost">Ghost Action</Button>
                <Button variant="danger">Destructive Action</Button>
                <Button variant="primary" isLoading>
                  Loading State
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/70">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Sizes & Icon Integration
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="outline" leftIcon={<Search className="w-3.5 h-3.5" />}>
                  Small Action
                </Button>
                <Button size="md" variant="primary" rightIcon={<Sparkles className="w-4 h-4" />}>
                  Medium Action
                </Button>
                <Button size="lg" variant="secondary" leftIcon={<Mail className="w-4 h-4" />}>
                  Large Primary
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Forms */}
        {activeTab === 'forms' && (
          <div className="p-6 rounded-xl border border-slate-200/90 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Repository URL"
                placeholder="https://github.com/username/project"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value && !e.target.value.includes('github.com')) {
                    setInputError('Must be a valid GitHub repository URI.');
                  } else {
                    setInputError('');
                  }
                }}
                error={inputError}
                helperText="Only verified repositories will be submitted to the test runner in Phase 5."
                leftIcon={<Search className="w-4 h-4" />}
              />

              <Input
                label="Disabled Field Example"
                placeholder="Protected system value"
                disabled
                helperText="Demonstrates disabled styling with correct contrast."
              />
            </div>

            <div className="space-y-4">
              <Select
                label="Target Engineering Track"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                options={[
                  { value: 'fullstack', label: 'Full-Stack Software Engineer' },
                  { value: 'distributed', label: 'Distributed Systems & Platform' },
                  { value: 'frontend', label: 'Frontend & UX Architect' },
                  { value: 'data', label: 'Data Infrastructure & ML Systems' },
                ]}
                helperText="Selects default ontology nodes for Career Twin mapping."
              />

              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowToast(true)}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Trigger Feedback Toast
                </Button>
                {showToast && (
                  <Toast
                    type="success"
                    title="Form State Tested"
                    message="Design system feedback primitive verified."
                    onClose={() => setShowToast(false)}
                    className="max-w-xs"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Surfaces & Overlays */}
        {activeTab === 'surfaces' && (
          <div className="p-6 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-semibold text-slate-900 mb-2">Avatars & Fallbacks</h4>
                <div className="flex items-center gap-3">
                  <Avatar name="Sarah Lin" size="sm" />
                  <Avatar name="Alex Chen" size="md" roleTag="Candidate" />
                  <Avatar name="Marcus Vance" size="lg" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-semibold text-slate-900 mb-2">Accessible Tooltips</h4>
                <div className="flex items-center gap-4 pt-2">
                  <Tooltip content="Verified by automated test runner">
                    <span className="text-xs font-semibold text-indigo-600 underline decoration-dotted cursor-help">
                      Hover for Verification Info
                    </span>
                  </Tooltip>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-semibold text-slate-900 mb-2">Modal Dialog Trigger</h4>
                <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
                  Open Sample Modal
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/70">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Loading Skeleton Primitives
              </h4>
              <div className="space-y-2 max-w-md">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Tokens */}
        {activeTab === 'tokens' && (
          <div className="p-6 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Color Distribution (60-30-10 Disciplined Palette)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="w-full h-8 rounded bg-slate-50 border mb-2" />
                  <div className="font-semibold text-slate-900">Canvas 60%</div>
                  <div className="text-slate-500 font-mono text-[11px]">#f8fafc (Slate 50)</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="w-full h-8 rounded bg-white border mb-2" />
                  <div className="font-semibold text-slate-900">Surfaces 30%</div>
                  <div className="text-slate-500 font-mono text-[11px]">#ffffff / Hairline</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="w-full h-8 rounded bg-indigo-600 mb-2" />
                  <div className="font-semibold text-slate-900">Accent 10%</div>
                  <div className="text-slate-500 font-mono text-[11px]">#4f46e5 (Indigo)</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="w-full h-8 rounded bg-slate-900 mb-2" />
                  <div className="font-semibold text-slate-900">Deep Navy</div>
                  <div className="text-slate-500 font-mono text-[11px]">#090d16 / 900</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/70 text-xs text-slate-600">
              <h4 className="font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Typography Rules
              </h4>
              <p className="leading-relaxed">
                Plus Jakarta Sans (Display & Body) paired with JetBrains Mono for tabular metrics and hash values.
                Zero unboxed pill badges for static metadata; clean inline separators (<code className="font-mono">·</code>) strictly enforced.
              </p>
            </div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="RYVOLT Modal Dialog Primitive"
          description="Accessible dialog container with focus trap, Escape key dismiss, and backdrop blur."
        >
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            This modal primitive is fully reusable across all 9 phases of development for candidate verification submission, job application reviews, and organization administration settings.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Close Dialog
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Acknowledge
            </Button>
          </div>
        </Modal>
      </div>
    </section>
  );
};
