type VibrationPattern = number | number[];

export class VibrationManager {
  private static instance: VibrationManager;
  private isVibrating: boolean;
  private currentPattern: VibrationPattern | null;
  private intervalId: number | null;

  private constructor() {
    this.isVibrating = false;
    this.currentPattern = null;
    this.intervalId = null;
  }

  static getInstance(): VibrationManager {
    if (!VibrationManager.instance) {
      VibrationManager.instance = new VibrationManager();
    }
    return VibrationManager.instance;
  }

  private validatePattern(pattern: VibrationPattern): boolean {
    if (typeof pattern === 'number') {
      return pattern >= 0;
    }
    return pattern.length > 0 && pattern.every(duration => duration >= 0);
  }

  private normalizePattern(pattern: VibrationPattern): number[] {
    return typeof pattern === 'number' ? [pattern] : pattern;
  }

  private calculatePatternDuration(pattern: number[]): number {
    return pattern.reduce((sum, duration) => sum + duration, 0);
  }

  vibrate(pattern: VibrationPattern): boolean {
    if (!this.isSupported()) {
      console.warn('Vibration API is not supported');
      return false;
    }

    if (!this.validatePattern(pattern)) {
      console.error('Invalid vibration pattern');
      return false;
    }

    try {
      const normalizedPattern = this.normalizePattern(pattern);
      navigator.vibrate(normalizedPattern);
      this.isVibrating = true;
      this.currentPattern = pattern;

      // Clear any existing timeout
      if (this.intervalId !== null) {
        window.clearTimeout(this.intervalId);
      }

      // Set timeout to update state when vibration ends
      const duration = this.calculatePatternDuration(normalizedPattern);
      this.intervalId = window.setTimeout(() => {
        this.isVibrating = false;
        this.currentPattern = null;
        this.intervalId = null;
      }, duration);

      return true;
    } catch (error) {
      console.error('Failed to vibrate:', error);
      return false;
    }
  }

  stop(): boolean {
    if (!this.isSupported()) {
      console.warn('Vibration API is not supported');
      return false;
    }

    try {
      navigator.vibrate(0);
      this.isVibrating = false;
      this.currentPattern = null;

      if (this.intervalId !== null) {
        window.clearTimeout(this.intervalId);
        this.intervalId = null;
      }

      return true;
    } catch (error) {
      console.error('Failed to stop vibration:', error);
      return false;
    }
  }

  // Predefined vibration patterns
  vibrateSuccess(): boolean {
    return this.vibrate([100]);
  }

  vibrateError(): boolean {
    return this.vibrate([100, 100, 100]);
  }

  vibrateWarning(): boolean {
    return this.vibrate([200, 100, 200]);
  }

  vibrateNotification(): boolean {
    return this.vibrate([200, 100, 50, 100]);
  }

  vibratePulse(duration: number = 50, count: number = 3, interval: number = 100): boolean {
    if (duration < 0 || count <= 0 || interval < 0) {
      console.error('Invalid pulse parameters');
      return false;
    }

    const pattern: number[] = [];
    for (let i = 0; i < count; i++) {
      pattern.push(duration);
      if (i < count - 1) {
        pattern.push(interval);
      }
    }

    return this.vibrate(pattern);
  }

  vibrateCustom(onDuration: number, offDuration: number, repetitions: number): boolean {
    if (onDuration < 0 || offDuration < 0 || repetitions <= 0) {
      console.error('Invalid custom vibration parameters');
      return false;
    }

    const pattern: number[] = [];
    for (let i = 0; i < repetitions; i++) {
      pattern.push(onDuration);
      if (i < repetitions - 1) {
        pattern.push(offDuration);
      }
    }

    return this.vibrate(pattern);
  }

  vibrateMorse(text: string): boolean {
    const morse: { [key: string]: string } = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
      'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
      'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
      'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
      'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
      '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
      '8': '---..', '9': '----.', ' ': ' '
    };

    const dotDuration = 100;
    const dashDuration = dotDuration * 3;
    const symbolGap = dotDuration;
    const letterGap = dotDuration * 3;
    const wordGap = dotDuration * 7;

    const pattern: number[] = [];
    const upperText = text.toUpperCase();

    for (let i = 0; i < upperText.length; i++) {
      const char = upperText[i];
      if (!(char in morse)) continue;

      if (char === ' ') {
        pattern.push(wordGap);
        continue;
      }

      const morseChar = morse[char];
      for (let j = 0; j < morseChar.length; j++) {
        // Add dot or dash duration
        pattern.push(morseChar[j] === '.' ? dotDuration : dashDuration);
        // Add gap between symbols if not last symbol
        if (j < morseChar.length - 1) {
          pattern.push(symbolGap);
        }
      }

      // Add gap between letters if not last letter
      if (i < upperText.length - 1 && upperText[i + 1] !== ' ') {
        pattern.push(letterGap);
      }
    }

    return this.vibrate(pattern);
  }

  getCurrentPattern(): VibrationPattern | null {
    return this.currentPattern;
  }

  isCurrentlyVibrating(): boolean {
    return this.isVibrating;
  }

  cleanup(): void {
    this.stop();
    if (this.intervalId !== null) {
      window.clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }
}

// Example usage:
/*
const vibration = VibrationManager.getInstance();

// Check if vibration is supported
console.log('Vibration supported:', VibrationManager.isSupported());

// Simple vibration
vibration.vibrate(200); // Vibrate for 200ms

// Pattern vibration
vibration.vibrate([100, 50, 100]); // Vibrate 100ms, pause 50ms, vibrate 100ms

// Predefined patterns
vibration.vibrateSuccess();
vibration.vibrateError();
vibration.vibrateWarning();
vibration.vibrateNotification();

// Pulse vibration
vibration.vibratePulse(50, 3, 100); // 3 pulses of 50ms with 100ms gaps

// Custom pattern
vibration.vibrateCustom(100, 50, 3); // 3 vibrations of 100ms with 50ms gaps

// Morse code vibration
vibration.vibrateMorse('SOS'); // ... --- ...

// Stop vibration
vibration.stop();

// Get current status
console.log('Currently vibrating:', vibration.isCurrentlyVibrating());
console.log('Current pattern:', vibration.getCurrentPattern());

// Cleanup
vibration.cleanup();
*/