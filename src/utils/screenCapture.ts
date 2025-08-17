type CaptureOptions = {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  preferCurrentTab?: boolean;
  displaySurface?: 'browser' | 'monitor' | 'window';
  selfBrowserSurface?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  cursorCapture?: 'always' | 'motion' | 'never';
};

type CaptureState = {
  isCapturing: boolean;
  stream: MediaStream | null;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
};

type CaptureCallback = (state: CaptureState) => void;

export class ScreenCaptureManager {
  private static instance: ScreenCaptureManager;
  private state: CaptureState;
  private onStateChangeCallbacks: Set<CaptureCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;
  private defaultOptions: CaptureOptions;

  private constructor() {
    this.state = {
      isCapturing: false,
      stream: null,
      videoTrack: null,
      audioTrack: null
    };
    this.onStateChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.defaultOptions = {
      video: true,
      audio: false,
      preferCurrentTab: true,
      displaySurface: 'monitor',
      selfBrowserSurface: 'exclude',
      systemAudio: 'exclude',
      surfaceSwitching: 'include',
      cursorCapture: 'motion'
    };
  }

  static getInstance(): ScreenCaptureManager {
    if (!ScreenCaptureManager.instance) {
      ScreenCaptureManager.instance = new ScreenCaptureManager();
    }
    return ScreenCaptureManager.instance;
  }

  private updateState(newState: Partial<CaptureState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private getDisplayMediaOptions(options: CaptureOptions): any {
    const displayMediaOptions: any = {
      video: options.video === false ? false : {
        displaySurface: options.displaySurface,
        selfBrowserSurface: options.selfBrowserSurface,
        surfaceSwitching: options.surfaceSwitching,
        cursorCapture: options.cursorCapture,
        ...(typeof options.video === 'object' ? options.video : {})
      },
      audio: options.audio === false ? false : {
        suppressLocalAudioPlayback: false,
        systemAudio: options.systemAudio,
        ...(typeof options.audio === 'object' ? options.audio : {})
      },
      preferCurrentTab: options.preferCurrentTab
    };

    // Remove undefined properties
    Object.keys(displayMediaOptions).forEach(key => {
      if (displayMediaOptions[key] === undefined) {
        delete displayMediaOptions[key];
      }
    });

    return displayMediaOptions;
  }

  async startCapture(options: CaptureOptions = {}): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Screen Capture API is not supported');
    }

    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const displayMediaOptions = this.getDisplayMediaOptions(mergedOptions);

      const stream = await (navigator.mediaDevices as any).getDisplayMedia(displayMediaOptions);

      const videoTrack = stream.getVideoTracks()[0] || null;
      const audioTrack = stream.getAudioTracks()[0] || null;

      // Set up track ended listeners
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => this.stopCapture());
      }
      if (audioTrack) {
        audioTrack.addEventListener('ended', () => this.stopCapture());
      }

      this.updateState({
        isCapturing: true,
        stream,
        videoTrack,
        audioTrack
      });

      return true;
    } catch (error) {
      this.notifyError(error as Error);
      return false;
    }
  }

  stopCapture(): void {
    const { stream, videoTrack, audioTrack } = this.state;

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (videoTrack) {
      videoTrack.stop();
    }

    if (audioTrack) {
      audioTrack.stop();
    }

    this.updateState({
      isCapturing: false,
      stream: null,
      videoTrack: null,
      audioTrack: null
    });
  }

  async takeScreenshot(): Promise<string | null> {
    if (!this.state.videoTrack) {
      return null;
    }

    try {
      const imageCapture = new ImageCapture(this.state.videoTrack);
      const bitmap = await imageCapture.grabFrame();

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const context = canvas.getContext('2d');
      if (!context) return null;

      context.drawImage(bitmap, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      this.notifyError(error as Error);
      return null;
    }
  }

  async startRecording(options: MediaRecorderOptions = {}): Promise<MediaRecorder | null> {
    if (!this.state.stream) {
      return null;
    }

    try {
      const mediaRecorder = new MediaRecorder(this.state.stream, options);
      return mediaRecorder;
    } catch (error) {
      this.notifyError(error as Error);
      return null;
    }
  }

  getStream(): MediaStream | null {
    return this.state.stream;
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.state.videoTrack;
  }

  getAudioTrack(): MediaStreamTrack | null {
    return this.state.audioTrack;
  }

  isCapturing(): boolean {
    return this.state.isCapturing;
  }

  onStateChange(callback: CaptureCallback): () => void {
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

  setDefaultOptions(options: CaptureOptions): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  getDefaultOptions(): CaptureOptions {
    return { ...this.defaultOptions };
  }

  cleanup(): void {
    this.stopCapture();
    this.onStateChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
  }

  static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getDisplayMedia' in (navigator.mediaDevices as any)
    );
  }
}

// Example usage:
/*
const screenCapture = ScreenCaptureManager.getInstance();

// Check if Screen Capture API is supported
console.log('Screen Capture supported:', ScreenCaptureManager.isSupported());

// Set up state change listener
const stateCleanup = screenCapture.onStateChange(state => {
  console.log('Capture state changed:', state);
});

// Set up error listener
const errorCleanup = screenCapture.onError(error => {
  console.error('Capture error:', error);
});

// Start screen capture with custom options
screenCapture.startCapture({
  video: {
    cursor: 'always',
    displaySurface: 'monitor'
  },
  audio: true,
  systemAudio: 'include'
}).then(success => {
  if (success) {
    console.log('Screen capture started');

    // Get capture information
    console.log('Stream:', screenCapture.getStream());
    console.log('Video track:', screenCapture.getVideoTrack());
    console.log('Audio track:', screenCapture.getAudioTrack());
    console.log('Is capturing:', screenCapture.isCapturing());

    // Take a screenshot
    screenCapture.takeScreenshot().then(dataUrl => {
      if (dataUrl) {
        console.log('Screenshot taken:', dataUrl);
      }
    });

    // Start recording
    screenCapture.startRecording({
      mimeType: 'video/webm;codecs=vp9'
    }).then(mediaRecorder => {
      if (mediaRecorder) {
        console.log('Recording started');
        // Handle recording...
      }
    });

    // Stop capture after 5 seconds
    setTimeout(() => {
      screenCapture.stopCapture();
      console.log('Screen capture stopped');
    }, 5000);
  }
});

// Clean up
stateCleanup(); // Remove state change listener
errorCleanup(); // Remove error listener
screenCapture.cleanup(); // Full cleanup
*/