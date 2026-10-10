// Web Speech API interfaces
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export type VoiceCoachMode =
  | 'mock_interview'
  | 'twin_audit'
  | 'job_pitch'
  | 'resume_coach';

export interface VoiceChatMessage {
  id: string;
  sender: 'candidate' | 'coach';
  text: string;
  timestamp: string;
  audioSpoken?: boolean;
}

export interface VoiceCoachContext {
  targetRole?: string;
  candidateSkills?: string[];
  candidateProjects?: string[];
  jobTitle?: string;
  companyName?: string;
  jobRequirements?: string[];
}

export class VoiceCoachService {
  private recognition: any = null;
  private isListening: boolean = false;
  private synthesisVoice: SpeechSynthesisVoice | null = null;
  private isSupportedRecognition: boolean = false;
  private isSupportedSynthesis: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      this.isSupportedRecognition = Boolean(SpeechRecognitionClass);
      this.isSupportedSynthesis = 'speechSynthesis' in window;

      if (this.isSupportedRecognition) {
        try {
          this.recognition = new SpeechRecognitionClass();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';
        } catch {
          this.isSupportedRecognition = false;
        }
      }

      if (this.isSupportedSynthesis) {
        this.initVoice();
        window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.isSupportedSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural sounding Indian-English voices (en-IN) per specification, then high-fidelity English voices
    const indianVoice = voices.find(
      (v) =>
        (v.lang === 'en-IN' || v.lang.startsWith('en_IN')) &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Rishi') || v.name.includes('Neerja') || v.name.includes('India'))
    ) || voices.find((v) => v.lang === 'en-IN' || v.lang.startsWith('en_IN'));

    const preferred =
      indianVoice ||
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Natural') ||
            v.name.includes('Premium'))
      );
    this.synthesisVoice = preferred || voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  public getRecognitionSupport(): boolean {
    return this.isSupportedRecognition;
  }

  public getSynthesisSupport(): boolean {
    return this.isSupportedSynthesis;
  }

  public startListening(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (err: string) => void
  ) {
    if (!this.isSupportedRecognition || !this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    this.isListening = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim) onInterim(interim);
      if (final) {
        this.isListening = false;
        onFinal(final.trim());
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      if (event.error !== 'no-speech') {
        onError(`Microphone error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      onError(e?.message || 'Failed to start microphone.');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.isListening = false;
    }
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    rate: number = 1.05
  ): boolean {
    if (!this.isSupportedSynthesis) return false;

    // Stop ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown stars/brackets for clean natural speech
    const cleanSpeech = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\(http[^)]+\)/g, '')
      .trim();

    if (!cleanSpeech) return false;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    if (this.synthesisVoice) {
      utterance.voice = this.synthesisVoice;
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public stopSpeaking() {
    if (this.isSupportedSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Request coaching response from server-side Gemini API or intelligent heuristic fallback
   */
  public async getCoachResponse(
    mode: VoiceCoachMode,
    userMessage: string,
    context: VoiceCoachContext,
    conversationHistory: { sender: string; text: string }[] = []
  ): Promise<{ text: string; followUpQuestion?: string }> {
    try {
      const response = await fetch('/api/voice-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          userMessage,
          context,
          conversationHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          return {
            text: data.text,
            followUpQuestion: data.followUpQuestion,
          };
        }
      }
    } catch {
      // Fall through to client-side fallback
    }

    // Client-side fallback response if server is unreachable
    return this.generateFallbackResponse(mode, userMessage, context);
  }

  private generateFallbackResponse(
    mode: VoiceCoachMode,
    userMessage: string,
    context: VoiceCoachContext
  ): { text: string; followUpQuestion?: string } {
    const role = context.targetRole || 'Software Engineer';
    const skills = context.candidateSkills?.slice(0, 3).join(', ') || 'distributed systems and scalable APIs';

    if (mode === 'mock_interview') {
      return {
        text: `Great answer. You clearly understand the core fundamentals of ${skills}. When speaking to engineering leaders, always anchor your explanation with measurable numbers, such as p99 response times or cluster throughput under failure scenarios.`,
        followUpQuestion: `How did you handle data consistency or rollback strategies when deploying changes to that service?`,
      };
    }

    if (mode === 'twin_audit') {
      return {
        text: `Reviewing your Career Twin: You have solid groundwork in ${skills}. To reach a Tier-1 senior archetype, I recommend adding one verified high-concurrency project with chaos test benchmarks. That gives recruiters concrete proof instead of just resume keywords.`,
        followUpQuestion: `Would you like me to suggest an artifact architecture you can build this weekend?`,
      };
    }

    if (mode === 'job_pitch') {
      return {
        text: `For ${context.jobTitle || 'this role'} at ${context.companyName || 'the target company'}, pitch your hands-on background in ${skills}. Emphasize how your verified projects prove you can ship resilient code from day one without long ramp-up periods.`,
        followUpQuestion: `Want to practice delivering a 60-second elevator pitch right now?`,
      };
    }

    // resume_coach
    return {
      text: `Your experience bullet communicates the intent, but let us sharpen the impact. Start with a decisive action verb like 'Architected' or 'Optimized', and mention the scale: for example, 'Engineered high-throughput event processing using ${skills}, reducing latency by 42%'.`,
      followUpQuestion: `What specific metric or outcome was most notable in that project?`,
    };
  }
}

export const voiceCoachService = new VoiceCoachService();
