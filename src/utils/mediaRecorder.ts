type RecorderConfig = {
  maxRecorders?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  defaultMimeType?: string;
  defaultBitsPerSecond?: number;
  defaultTimeSlice?: number;
  defaultAudioBitsPerSecond?: number;
  defaultVideoBitsPerSecond?: number;
};

type RecorderItem = {
  id: string;
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
  duration: number;
  size: number;
  startTime: number;
  status: 'inactive' | 'recording' | 'paused' | 'error';
  metadata: Record<string, any>;
};

type RecorderEvent = {
  type: 'start' | 'resume' | 'pause' | 'stop' | 'dataavailable' | 'error' | 'cleanup';
  recorderId?: string;
  timestamp: number;
  details: any;
};

type RecorderEventCallback = (event: RecorderEvent) => void;

export class MediaRecorderManager {
  private static instance: MediaRecorderManager;
  private config: RecorderConfig;
  private recorders: Map<string, RecorderItem>;
  private onRecorderEventCallbacks: Set<RecorderEventCallback>;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.recorders = new Map();
    this.onRecorderEventCallbacks = new Set();
  }

  static getInstance(): MediaRecorderManager {
    if (!MediaRecorderManager.instance) {
      MediaRecorderManager.instance = new MediaRecorderManager();
    }
    return MediaRecorderManager.instance;
  }

  private notifyRecorderEvent(event: RecorderEvent): void {
    this.onRecorderEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): RecorderConfig {
    return {
      maxRecorders: 5,
      autoCleanup: true,
      cleanupThreshold: 0.8,
      defaultMimeType: 'video/webm;codecs=vp9,opus',
      defaultBitsPerSecond: 2500000,
      defaultTimeSlice: 1000,
      defaultAudioBitsPerSecond: 128000,
      defaultVideoBitsPerSecond: 2500000
    };
  }

  configure(config: Partial<RecorderConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.recorders.size > this.config.maxRecorders! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private setupEventListeners(recorder: MediaRecorder, id: string): void {
    recorder.addEventListener('start', () => {
      const recorderItem = this.recorders.get(id);
      if (recorderItem) {
        recorderItem.status = 'recording';
        this.notifyRecorderEvent({
          type: 'start',
          recorderId: id,
          timestamp: performance.now(),
          details: { recorder: recorderItem }
        });
      }
    });

    recorder.addEventListener('resume', () => {
      const recorderItem = this.recorders.get(id);
      if (recorderItem) {
        recorderItem.status = 'recording';
        this.notifyRecorderEvent({
          type: 'resume',
          recorderId: id,
          timestamp: performance.now(),
          details: { recorder: recorderItem }
        });
      }
    });

    recorder.addEventListener('pause', () => {
      const recorderItem = this.recorders.get(id);
      if (recorderItem) {
        recorderItem.status = 'paused';
        this.notifyRecorderEvent({
          type: 'pause',
          recorderId: id,
          timestamp: performance.now(),
          details: { recorder: recorderItem }
        });
      }
    });

    recorder.addEventListener('stop', () => {
      const recorderItem = this.recorders.get(id);
      if (recorderItem) {
        recorderItem.status = 'inactive';
        recorderItem.duration = performance.now() - recorderItem.startTime;
        this.notifyRecorderEvent({
          type: 'stop',
          recorderId: id,
          timestamp: performance.now(),
          details: { recorder: recorderItem }
        });
      }
    });

    recorder.addEventListener('dataavailable', (event: BlobEvent) => {
      const recorderItem = this.recorders.get(id);
      if (recorderItem) {
        recorderItem.chunks.push(event.data);
        recorderItem.size += event.data.size;
        this.notifyRecorderEvent({
          type: 'dataavailable',
          recorderId: id,
          timestamp: performance.now(),
          details: { data: event.data, recorder: recorderItem }
        });
      }
    });

    recorder.addEventListener('error', (event: Event) => {
      const recorderItem = this.recorders.get(id);
      if (recorderItem) {
        recorderItem.status = 'error';
        this.notifyRecorderEvent({
          type: 'error',
          recorderId: id,
          timestamp: performance.now(),
          details: { error: event, recorder: recorderItem }
        });
      }
    });
  }

  startRecording(
    stream: MediaStream,
    options: {
      mimeType?: string;
      bitsPerSecond?: number;
      timeSlice?: number;
      audioBitsPerSecond?: number;
      videoBitsPerSecond?: number;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    const id = crypto.randomUUID();
    const currentTime = performance.now();

    const recorder = new MediaRecorder(stream, {
      mimeType: options.mimeType ?? this.config.defaultMimeType!,
      bitsPerSecond: options.bitsPerSecond ?? this.config.defaultBitsPerSecond!,
      audioBitsPerSecond: options.audioBitsPerSecond ?? this.config.defaultAudioBitsPerSecond!,
      videoBitsPerSecond: options.videoBitsPerSecond ?? this.config.defaultVideoBitsPerSecond!
    });

    const recorderItem: RecorderItem = {
      id,
      recorder,
      stream,
      chunks: [],
      duration: 0,
      size: 0,
      startTime: currentTime,
      status: 'inactive',
      metadata: options.metadata || {}
    };

    this.setupEventListeners(recorder, id);
    this.recorders.set(id, recorderItem);

    recorder.start(options.timeSlice ?? this.config.defaultTimeSlice!);

    if (this.recorders.size > this.config.maxRecorders! && this.config.autoCleanup) {
      this.cleanup();
    }

    return id;
  }

  stopRecording(id: string): boolean {
    const recorderItem = this.recorders.get(id);

    if (recorderItem && recorderItem.status === 'recording') {
      recorderItem.recorder.stop();
      return true;
    }

    return false;
  }

  pauseRecording(id: string): boolean {
    const recorderItem = this.recorders.get(id);

    if (recorderItem && recorderItem.status === 'recording') {
      recorderItem.recorder.pause();
      return true;
    }

    return false;
  }

  resumeRecording(id: string): boolean {
    const recorderItem = this.recorders.get(id);

    if (recorderItem && recorderItem.status === 'paused') {
      recorderItem.recorder.resume();
      return true;
    }

    return false;
  }

  getRecordedData(id: string): Blob | undefined {
    const recorderItem = this.recorders.get(id);

    if (recorderItem && recorderItem.chunks.length > 0) {
      return new Blob(recorderItem.chunks, { type: recorderItem.recorder.mimeType });
    }

    return undefined;
  }

  getRecorder(id: string): RecorderItem | undefined {
    return this.recorders.get(id);
  }

  getAllRecorders(): RecorderItem[] {
    return Array.from(this.recorders.values());
  }

  getRecorderCount(): number {
    return this.recorders.size;
  }

  removeRecorder(id: string): boolean {
    const recorderItem = this.recorders.get(id);

    if (recorderItem) {
      if (recorderItem.status === 'recording') {
        recorderItem.recorder.stop();
      }

      recorderItem.stream.getTracks().forEach(track => track.stop());
      this.recorders.delete(id);
      return true;
    }

    return false;
  }

  cleanup(): void {
    if (this.recorders.size <= this.config.maxRecorders! * this.config.cleanupThreshold!) {
      return;
    }

    const recordersToRemove = Array.from(this.recorders.values())
      .filter(recorder => recorder.status === 'inactive')
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, this.recorders.size - this.config.maxRecorders!);

    for (const recorder of recordersToRemove) {
      this.removeRecorder(recorder.id);
    }

    this.notifyRecorderEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: recordersToRemove.length }
    });
  }

  onRecorderEvent(callback: RecorderEventCallback): () => void {
    this.onRecorderEventCallbacks.add(callback);
    return () => {
      this.onRecorderEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'MediaRecorder' in window &&
      'MediaStream' in window &&
      'Blob' in window &&
      'crypto' in window &&
      'performance' in window;
  }

  static getSupportedMimeTypes(): string[] {
    const commonTypes = [
      'video/webm',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
      'video/webm;codecs=h264',
      'video/webm;codecs=opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4',
      'video/mp4;codecs=avc1',
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp3',
      'audio/aac',
      'audio/ogg'
    ];

    return commonTypes.filter(type => MediaRecorder.isTypeSupported(type));
  }
}

// Example usage:
/*
const recorderManager = MediaRecorderManager.getInstance();

// Check if media recorder is supported
console.log('Media Recorder supported:', MediaRecorderManager.isSupported());

// Get supported MIME types
console.log('Supported MIME types:', MediaRecorderManager.getSupportedMimeTypes());

// Configure recorder manager
recorderManager.configure({
  maxRecorders: 3,
  autoCleanup: true,
  cleanupThreshold: 0.8,
  defaultMimeType: 'video/webm;codecs=vp9,opus',
  defaultBitsPerSecond: 2500000,
  defaultTimeSlice: 1000,
  defaultAudioBitsPerSecond: 128000,
  defaultVideoBitsPerSecond: 2500000
});

// Set up event listener
const eventCleanup = recorderManager.onRecorderEvent(event => {
  console.log('Recorder event:', event);
});

// Get user media stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    // Start recording
    const recorderId = recorderManager.startRecording(stream, {
      mimeType: 'video/webm;codecs=vp9,opus',
      bitsPerSecond: 2500000,
      timeSlice: 1000,
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000,
      metadata: { name: 'Example Recording' }
    });

    // Pause recording after 5 seconds
    setTimeout(() => {
      recorderManager.pauseRecording(recorderId);
    }, 5000);

    // Resume recording after 7 seconds
    setTimeout(() => {
      recorderManager.resumeRecording(recorderId);
    }, 7000);

    // Stop recording after 10 seconds
    setTimeout(() => {
      recorderManager.stopRecording(recorderId);

      // Get recorded data
      const blob = recorderManager.getRecordedData(recorderId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        document.body.appendChild(video);
      }

      // Remove recorder
      recorderManager.removeRecorder(recorderId);
    }, 10000);
  })
  .catch(error => {
    console.error('Error accessing media devices:', error);
  });

// Remove event listener
eventCleanup();
*/