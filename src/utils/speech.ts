type SpeechRecognitionOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (result: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
};

type SpeechSynthesisOptions = {
  lang?: string;
  voice?: SpeechSynthesisVoice;
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onPause?: () => void;
  onResume?: () => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
};

export class SpeechManager {
  private static instance: SpeechManager;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;

  private constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
    }
    this.synthesis = window.speechSynthesis;
  }

  static getInstance(): SpeechManager {
    if (!SpeechManager.instance) {
      SpeechManager.instance = new SpeechManager();
    }
    return SpeechManager.instance;
  }

  // Check if speech recognition is supported
  isRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  // Check if speech synthesis is supported
  isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  // Start speech recognition
  startRecognition(options: SpeechRecognitionOptions = {}): void {
    if (!this.isRecognitionSupported()) {
      throw new Error('Speech recognition is not supported');
    }

    if (this.isListening) {
      this.stopRecognition();
    }

    const recognition = this.recognition!;

    recognition.lang = options.lang || 'en-US';
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.maxAlternatives = options.maxAlternatives ?? 1;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      options.onResult?.(transcript, isFinal);
    };

    recognition.onerror = (event) => {
      options.onError?.(new Error(event.error));
    };

    recognition.onstart = () => {
      this.isListening = true;
      options.onStart?.();
    };

    recognition.onend = () => {
      this.isListening = false;
      options.onEnd?.();

      // Restart if continuous is enabled
      if (options.continuous && this.isListening) {
        recognition.start();
      }
    };

    recognition.start();
  }

  // Stop speech recognition
  stopRecognition(): void {
    if (this.isRecognitionSupported() && this.isListening) {
      this.recognition!.stop();
      this.isListening = false;
    }
  }

  // Get available voices
  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.isSynthesisSupported()) {
      throw new Error('Speech synthesis is not supported');
    }

    // If voices are already loaded, return them
    let voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      return voices;
    }

    // Wait for voices to be loaded
    return new Promise((resolve) => {
      const voicesChanged = () => {
        voices = this.synthesis.getVoices();
        resolve(voices);
      };

      this.synthesis.addEventListener('voiceschanged', voicesChanged, { once: true });
    });
  }

  // Speak text
  async speak(text: string, options: SpeechSynthesisOptions = {}): Promise<void> {
    if (!this.isSynthesisSupported()) {
      throw new Error('Speech synthesis is not supported');
    }

    // Cancel any ongoing speech
    this.stop();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure options
      utterance.lang = options.lang || 'en-US';
      utterance.voice = options.voice || null;
      utterance.pitch = options.pitch ?? 1;
      utterance.rate = options.rate ?? 1;
      utterance.volume = options.volume ?? 1;

      // Set event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        options.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        const error = new Error(`Speech synthesis error: ${event.error}`);
        options.onError?.(error);
        reject(error);
      };

      utterance.onpause = () => {
        options.onPause?.();
      };

      utterance.onresume = () => {
        options.onResume?.();
      };

      utterance.onboundary = (event) => {
        options.onBoundary?.(event);
      };

      // Start speaking
      this.synthesis.speak(utterance);
    });
  }

  // Stop speaking
  stop(): void {
    if (this.isSynthesisSupported() && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // Pause speaking
  pause(): void {
    if (this.isSynthesisSupported() && this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  // Resume speaking
  resume(): void {
    if (this.isSynthesisSupported() && this.isSpeaking) {
      this.synthesis.resume();
    }
  }

  // Check if currently listening
  isRecognitionActive(): boolean {
    return this.isListening;
  }

  // Check if currently speaking
  isSpeakingActive(): boolean {
    return this.isSpeaking;
  }
}

// Example usage:
/*
const speech = SpeechManager.getInstance();

// Speech Recognition
if (speech.isRecognitionSupported()) {
  speech.startRecognition({
    lang: 'en-US',
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      console.log(`Recognized text: ${text} (${isFinal ? 'final' : 'interim'})`);
    },
    onError: (error) => {
      console.error('Recognition error:', error);
    },
    onStart: () => {
      console.log('Recognition started');
    },
    onEnd: () => {
      console.log('Recognition ended');
    }
  });
}

// Speech Synthesis
if (speech.isSynthesisSupported()) {
  // Get available voices
  const voices = await speech.getVoices();
  console.log('Available voices:', voices);

  // Speak text
  await speech.speak('Hello, how are you?', {
    lang: 'en-US',
    voice: voices[0], // Use first available voice
    pitch: 1,
    rate: 1,
    volume: 1,
    onStart: () => {
      console.log('Speech started');
    },
    onEnd: () => {
      console.log('Speech ended');
    },
    onError: (error) => {
      console.error('Speech error:', error);
    },
    onBoundary: (event) => {
      console.log('Word boundary:', event);
    }
  });
}

// Control methods
speech.pause();     // Pause speaking
speech.resume();    // Resume speaking
speech.stop();      // Stop speaking
speech.stopRecognition(); // Stop recognition
*/