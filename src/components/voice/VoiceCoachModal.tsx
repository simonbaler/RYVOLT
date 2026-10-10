import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  X,
  Send,
  HelpCircle,
  Briefcase,
  Layers,
  FileText,
  Play,
  Square,
  Radio,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  voiceCoachService,
  VoiceCoachMode,
  VoiceChatMessage,
  VoiceCoachContext,
} from '../../services/voiceCoachService';
import { Job } from '../../types/database';

export interface VoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: VoiceCoachContext;
  initialMode?: VoiceCoachMode;
  initialJob?: Job | null;
}

export const VoiceCoachModal: React.FC<VoiceCoachModalProps> = ({
  isOpen,
  onClose,
  context: initialContext,
  initialMode = 'mock_interview',
  initialJob,
}) => {
  const [mode, setMode] = useState<VoiceCoachMode>(initialMode);
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>('Ready to talk. Tap microphone or type below.');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context: VoiceCoachContext = {
    targetRole: initialContext?.targetRole || 'Senior Distributed Systems Engineer',
    candidateSkills: initialContext?.candidateSkills || ['Go', 'Rust', 'Distributed Systems', 'PostgreSQL'],
    jobTitle: initialJob?.title || initialContext?.jobTitle,
    companyName: initialJob?.company || initialContext?.companyName,
    jobRequirements: initialJob?.requirements || initialContext?.jobRequirements,
  };

  // Sync mode when prop changes
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  // Initial welcome message per mode
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendWelcomeMessage(mode);
    }
  }, [isOpen, mode]);

  // Scroll to bottom on message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Clean up speech on close
  useEffect(() => {
    if (!isOpen) {
      voiceCoachService.stopListening();
      voiceCoachService.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const sendWelcomeMessage = (selectedMode: VoiceCoachMode) => {
    let welcome = '';
    if (selectedMode === 'mock_interview') {
      welcome = `Hello! I'm your RYVOLT technical interview coach. I'm ready to run a mock interview for ${
        context.jobTitle ? `${context.jobTitle} at ${context.companyName}` : context.targetRole
      }. Tell me about a complex distributed system or backend architecture you designed recently.`;
    } else if (selectedMode === 'twin_audit') {
      welcome = `Welcome to your Career Twin audit. I see your background in ${
        context.candidateSkills?.slice(0, 3).join(', ') || 'software engineering'
      }. What target role are you aiming for next, and what is your strongest verifiable project?`;
    } else if (selectedMode === 'job_pitch') {
      welcome = `Let's rehearse your pitch for ${context.jobTitle || 'your target position'}. Why are you uniquely suited for this role compared to other candidates?`;
    } else {
      welcome = `Welcome to Resume Bullet Coaching. Paste or speak any bullet point from your resume, and I'll help you sharpen the impact and metrics.`;
    }

    const initialMsg: VoiceChatMessage = {
      id: `coach-init-${Date.now()}`,
      sender: 'coach',
      text: welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([initialMsg]);

    if (!audioMuted) {
      speakMessage(welcome);
    }
  };

  const speakMessage = (text: string) => {
    if (audioMuted) return;
    setIsSpeaking(true);
    voiceCoachService.speak(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleToggleListening = () => {
    if (isListening) {
      voiceCoachService.stopListening();
      setIsListening(false);
      setStatusText('Listening paused.');
    } else {
      if (isSpeaking) {
        voiceCoachService.stopSpeaking();
        setIsSpeaking(false);
      }
      setStatusText('Listening... speak naturally into your microphone.');
      voiceCoachService.startListening(
        (interim) => setInterimTranscript(interim),
        (final) => {
          setIsListening(false);
          setInterimTranscript('');
          handleSendMessage(final);
        },
        (err) => {
          setIsListening(false);
          setStatusText(err);
        }
      );
      setIsListening(true);
    }
  };

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setInterimTranscript('');

    const userMsg: VoiceChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'candidate',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);
    setStatusText('Thinking and synthesizing advice...');

    try {
      const historyPayload = newHistory.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const coachResult = await voiceCoachService.getCoachResponse(
        mode,
        text,
        context,
        historyPayload
      );

      const coachMsg: VoiceChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: `${coachResult.text}${
          coachResult.followUpQuestion ? `\n\n${coachResult.followUpQuestion}` : ''
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMsg]);
      setStatusText('Voice response ready.');

      if (!audioMuted) {
        speakMessage(coachMsg.text);
      }
    } catch {
      setStatusText('Could not process speech. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: VoiceCoachMode) => {
    setMode(newMode);
    voiceCoachService.stopSpeaking();
    setIsSpeaking(false);
    setMessages([]);
    sendWelcomeMessage(newMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-cyan-500/20 via-indigo-500/10 to-transparent pointer-events-none -z-0" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  RYVOLT Voice Career Coach
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80 uppercase tracking-wider">
                  Live Audio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive verbal rehearsal powered by career intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isSpeaking) {
                  voiceCoachService.stopSpeaking();
                  setIsSpeaking(false);
                }
                setAudioMuted(!audioMuted);
              }}
              title={audioMuted ? 'Unmute voice' : 'Mute voice'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {audioMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Strip */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'mock_interview', label: 'Mock Interview', icon: HelpCircle },
            { id: 'twin_audit', label: 'Career Twin Audit', icon: Layers },
            { id: 'job_pitch', label: 'Job Match Pitch', icon: Briefcase },
            { id: 'resume_coach', label: 'Bullet Polisher', icon: FileText },
          ].map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id as VoiceCoachMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Animated Soundwave Visualizer Area */}
        <div className="relative py-4 px-6 bg-slate-950/40 border-b border-slate-800/80 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-xs">
            {[4, 8, 14, 24, 18, 30, 22, 12, 6, 16, 26, 14, 8].map((h, i) => {
              const active = isSpeaking || isListening;
              const dynamicHeight = active
                ? Math.min(44, Math.max(6, Math.sin(Date.now() / 200 + i) * 20 + h))
                : 6;

              return (
                <div
                  key={i}
                  style={{ height: `${dynamicHeight}px` }}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isListening
                      ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                      : isSpeaking
                      ? 'bg-gradient-to-t from-cyan-400 to-indigo-400 shadow-sm shadow-cyan-500/50'
                      : 'bg-slate-700/60'
                  }`}
                />
              );
            })}
          </div>

          <div className="mt-2 text-[11px] font-medium text-slate-400 flex items-center gap-2">
            {isListening && (
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Listening to your voice...
              </span>
            )}
            {isSpeaking && (
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Coach speaking...
              </span>
            )}
            {!isListening && !isSpeaking && <span>{statusText}</span>}
          </div>
        </div>

        {/* Conversation Transcript Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-[220px] max-h-[360px]">
          {messages.map((msg) => {
            const isCoach = msg.sender === 'coach';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isCoach ? 'justify-start' : 'justify-end'
                }`}
              >
                {isCoach && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-[10px]">
                    RY
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 ${
                    isCoach
                      ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-sm'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>{msg.timestamp}</span>
                    {isCoach && (
                      <button
                        onClick={() => speakMessage(msg.text)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" /> Replay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {interimTranscript && (
            <div className="flex justify-end text-xs">
              <div className="max-w-[82%] bg-indigo-900/40 text-indigo-200 border border-indigo-500/40 rounded-2xl p-3 italic">
                {interimTranscript}...
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-[10px]">
                RY
              </div>
              <div className="bg-slate-800/70 text-slate-400 border border-slate-700/60 rounded-2xl p-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-200" />
                <span>Synthesizing response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Microphone Action Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            {/* Big Tactile Microphone Toggle */}
            <button
              onClick={handleToggleListening}
              className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:opacity-90 shadow-md shadow-indigo-900/20'
              }`}
              title={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Text Input Fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 focus-within:border-cyan-500"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening to speech...' : 'Type or speak your answer...'}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Clear Transcript Button */}
            <button
              onClick={() => {
                voiceCoachService.stopSpeaking();
                setIsSpeaking(false);
                setMessages([]);
                sendWelcomeMessage(mode);
              }}
              title="Reset session"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Powered by Web Speech API & RYVOLT Intelligence</span>
            <span>Target: {context.jobTitle || context.targetRole}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
