type MediaType = 'audio' | 'video' | 'screen';

type MediaConstraints = {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
};

type RecordingOptions = {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
  timeslice?: number;
  onDataAvailable?: (blob: Blob) => void;
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  onPause?: () => void;
  onResume?: () => void;
};

export class MediaManager {
  private static instance: MediaManager;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  private constructor() {}

  static getInstance(): MediaManager {
    if (!MediaManager.instance) {
      MediaManager.instance = new MediaManager();
    }
    return MediaManager.instance;
  }

  // Check if media devices are supported
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Get available media devices
  async getDevices(): Promise<MediaDeviceInfo[]> {
    if (!this.isSupported()) {
      throw new Error('Media devices not supported');
    }

    return navigator.mediaDevices.enumerateDevices();
  }

  // Get media stream
  async getStream(
    type: MediaType,
    constraints: MediaConstraints = {}
  ): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Media devices not supported');
    }

    try {
      if (type === 'screen') {
        this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      return this.stream;
    } catch (error) {
      throw new Error(`Failed to get ${type} stream: ${error}`);
    }
  }

  // Stop media stream
  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  // Start recording
  async startRecording(
    stream: MediaStream,
    options: RecordingOptions = {}
  ): Promise<void> {
    if (this.recorder) {
      throw new Error('Recording already in progress');
    }

    try {
      const mimeType = this.getSupportedMimeType(options.mimeType);
      this.chunks = [];

      this.recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond,
        videoBitsPerSecond: options.videoBitsPerSecond,
        bitsPerSecond: options.bitsPerSecond
      });

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          options.onDataAvailable?.(event.data);
        }
      };

      this.recorder.onstart = () => {
        options.onStart?.();
      };

      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mimeType });
        options.onStop?.(blob);
      };

      this.recorder.onerror = (event) => {
        options.onError?.(event.error);
      };

      this.recorder.onpause = () => {
        options.onPause?.();
      };

      this.recorder.onresume = () => {
        options.onResume?.();
      };

      this.recorder.start(options.timeslice);
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  // Stop recording
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      const handleStop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder!.mimeType });
        this.recorder = null;
        this.chunks = [];
        resolve(blob);
      };

      if (this.recorder.state === 'recording') {
        this.recorder.addEventListener('stop', handleStop, { once: true });
        this.recorder.stop();
      } else {
        handleStop();
      }
    });
  }

  // Pause recording
  pauseRecording(): void {
    if (this.recorder?.state === 'recording') {
      this.recorder.pause();
    }
  }

  // Resume recording
  resumeRecording(): void {
    if (this.recorder?.state === 'paused') {
      this.recorder.resume();
    }
  }

  // Take photo from video stream
  takePhoto(
    videoElement: HTMLVideoElement,
    options: { width?: number; height?: number } = {}
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        const width = options.width || videoElement.videoWidth;
        const height = options.height || videoElement.videoHeight;

        canvas.width = width;
        canvas.height = height;

        context.drawImage(videoElement, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.95
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Apply audio effects
  async applyAudioEffects(
    stream: MediaStream,
    effects: {
      gain?: number;
      echo?: { delay: number; decay: number };
      filter?: BiquadFilterType;
    }
  ): Promise<MediaStream> {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    let node: AudioNode = source;

    if (effects.gain !== undefined) {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = effects.gain;
      node.connect(gainNode);
      node = gainNode;
    }

    if (effects.echo) {
      const delay = audioContext.createDelay();
      const feedback = audioContext.createGain();
      delay.delayTime.value = effects.echo.delay;
      feedback.gain.value = effects.echo.decay;

      node.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      node = delay;
    }

    if (effects.filter) {
      const filter = audioContext.createBiquadFilter();
      filter.type = effects.filter;
      node.connect(filter);
      node = filter;
    }

    const destination = audioContext.createMediaStreamDestination();
    node.connect(destination);

    return destination.stream;
  }

  // Apply video effects
  applyVideoEffects(
    videoElement: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    effects: {
      brightness?: number;
      contrast?: number;
      grayscale?: boolean;
      blur?: number;
    }
  ): void {
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const draw = () => {
      context.drawImage(videoElement, 0, 0);

      let filters = [];
      if (effects.brightness !== undefined) {
        filters.push(`brightness(${effects.brightness}%)`);
      }
      if (effects.contrast !== undefined) {
        filters.push(`contrast(${effects.contrast}%)`);
      }
      if (effects.grayscale) {
        filters.push('grayscale(1)');
      }
      if (effects.blur !== undefined) {
        filters.push(`blur(${effects.blur}px)`);
      }

      if (filters.length > 0) {
        context.filter = filters.join(' ');
      }

      requestAnimationFrame(draw);
    };

    draw();
  }

  // Private methods
  private getSupportedMimeType(preferredType?: string): string {
    const types = [
      preferredType,
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'audio/webm',
      'audio/mp4'
    ].filter(Boolean);

    for (const type of types) {
      if (type && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    throw new Error('No supported mime type found');
  }
}

// Example usage:
/*
const media = MediaManager.getInstance();

// Get available devices
const devices = await media.getDevices();

// Start video stream
const videoStream = await media.getStream('video', {
  video: { facingMode: 'user' },
  audio: true
});

// Start screen sharing
const screenStream = await media.getStream('screen');

// Start recording
await media.startRecording(videoStream, {
  mimeType: 'video/webm',
  onDataAvailable: (blob) => console.log('Data available:', blob.size),
  onStop: (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
  }
});

// Take photo
const video = document.querySelector('video');
if (video) {
  const photo = await media.takePhoto(video, {
    width: 1280,
    height: 720
  });
}

// Apply audio effects
const processedStream = await media.applyAudioEffects(videoStream, {
  gain: 1.5,
  echo: { delay: 0.5, decay: 0.5 },
  filter: 'lowpass'
});

// Apply video effects
const canvas = document.querySelector('canvas');
if (video && canvas) {
  media.applyVideoEffects(video, canvas, {
    brightness: 110,
    contrast: 120,
    grayscale: true,
    blur: 2
  });
}

// Stop everything
media.stopStream();
await media.stopRecording();
*/