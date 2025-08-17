type RecognitionOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  grammars?: SpeechGrammarList;
};

type RecognitionState = {
  listening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  confidence: number;
};

type RecognitionCallback = (state: RecognitionState) => void;

export class SpeechRecognitionManager {
  private static instance: SpeechRecognitionManager;
  private recognition: any;
  private state: RecognitionState;
  private options: Required<RecognitionOptions>;
  private onStateChangeCallbacks: Set<RecognitionCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;

  private constructor() {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.state = {
      listening: false,
      finalTranscript: '',
      interimTranscript: '',
      confidence: 0
    };

    this.options = {
      lang: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      grammars: null as unknown as SpeechGrammarList
    };

    this.onStateChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();

    this.setupRecognition();
  }

  static getInstance(): SpeechRecognitionManager {
    if (!SpeechRecognitionManager.instance) {
      SpeechRecognitionManager.instance = new SpeechRecognitionManager();
    }
    return SpeechRecognitionManager.instance;
  }

  private updateState(newState: Partial<RecognitionState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private setupRecognition(): void {
    this.recognition.lang = this.options.lang;
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.maxAlternatives = this.options.maxAlternatives;

    if (this.options.grammars) {
      this.recognition.grammars = this.options.grammars;
    }

    this.recognition.onstart = () => {
      this.updateState({ listening: true });
    };

    this.recognition.onend = () => {
      this.updateState({ listening: false });
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = this.state.finalTranscript;
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      this.updateState({
        finalTranscript,
        interimTranscript,
        confidence
      });
    };

    this.recognition.onerror = (event: any) => {
      const error = new Error(`Speech recognition error: ${event.error}`);
      this.notifyError(error);
      this.stop();
    };
  }

  start(options: RecognitionOptions = {}): void {
    if (!this.isSupported()) {
      throw new Error('Speech Recognition API is not supported');
    }

    // Update options
    this.options = { ...this.options, ...options };
    this.setupRecognition();

    // Reset state
    this.updateState({
      finalTranscript: '',
      interimTranscript: '',
      confidence: 0
    });

    // Start recognition
    this.recognition.start();
  }

  stop(): void {
    if (this.state.listening) {
      this.recognition.stop();
    }
  }

  abort(): void {
    if (this.state.listening) {
      this.recognition.abort();
    }
  }

  isListening(): boolean {
    return this.state.listening;
  }

  getFinalTranscript(): string {
    return this.state.finalTranscript;
  }

  getInterimTranscript(): string {
    return this.state.interimTranscript;
  }

  getConfidence(): number {
    return this.state.confidence;
  }

  getCurrentOptions(): Required<RecognitionOptions> {
    return { ...this.options };
  }

  onStateChange(callback: RecognitionCallback): () => void {
    this.onStateChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onStateChangeCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.onErrorCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.abort();
    this.onStateChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
  }
}

// Example usage:
/*
const recognition = SpeechRecognitionManager.getInstance();

// Check if Speech Recognition API is supported
console.log('Speech Recognition supported:', SpeechRecognitionManager.isSupported());

// Set up state change listener
const stateCleanup = recognition.onStateChange(state => {
  console.log('Recognition state changed:', state);
  console.log('Final transcript:', state.finalTranscript);
  console.log('Interim transcript:', state.interimTranscript);
  console.log('Confidence:', state.confidence);
});

// Set up error listener
const errorCleanup = recognition.onError(error => {
  console.error('Recognition error:', error);
});

// Start recognition with options
recognition.start({
  lang: 'en-US',
  continuous: true,
  interimResults: true,
  maxAlternatives: 1
});

// Get current state
console.log('Is listening:', recognition.isListening());
console.log('Final transcript:', recognition.getFinalTranscript());
console.log('Interim transcript:', recognition.getInterimTranscript());
console.log('Confidence:', recognition.getConfidence());
console.log('Current options:', recognition.getCurrentOptions());

// Stop after 10 seconds
setTimeout(() => {
  recognition.stop();
  console.log('Recognition stopped');
}, 10000);

// Clean up
stateCleanup(); // Remove state change listener
errorCleanup(); // Remove error listener
recognition.cleanup(); // Full cleanup
*/