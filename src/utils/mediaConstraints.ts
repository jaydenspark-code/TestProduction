type MediaConstraintsOptions = {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
};

type MediaConstraintsState = {
  video: MediaTrackConstraints | false;
  audio: MediaTrackConstraints | false;
  activeConstraints: MediaTrackConstraints[];
};

type MediaConstraintsCallback = (state: MediaConstraintsState) => void;

export class MediaConstraintsManager {
  private static instance: MediaConstraintsManager;
  private state: MediaConstraintsState;
  private onConstraintsChangeCallbacks: Set<MediaConstraintsCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;

  private constructor() {
    this.state = {
      video: false,
      audio: false,
      activeConstraints: []
    };
    this.onConstraintsChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();
  }

  static getInstance(): MediaConstraintsManager {
    if (!MediaConstraintsManager.instance) {
      MediaConstraintsManager.instance = new MediaConstraintsManager();
    }
    return MediaConstraintsManager.instance;
  }

  private notifyConstraintsChange(): void {
    this.onConstraintsChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  setConstraints(options: MediaConstraintsOptions): void {
    try {
      if (typeof options.video === 'object') {
        this.state.video = this.normalizeConstraints(options.video);
      } else {
        this.state.video = options.video || false;
      }

      if (typeof options.audio === 'object') {
        this.state.audio = this.normalizeConstraints(options.audio);
      } else {
        this.state.audio = options.audio || false;
      }

      this.updateActiveConstraints();
      this.notifyConstraintsChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  private normalizeConstraints(constraints: MediaTrackConstraints): MediaTrackConstraints {
    const normalized: MediaTrackConstraints = {};

    // Handle common constraints
    if (constraints.deviceId) normalized.deviceId = constraints.deviceId;
    if (constraints.groupId) normalized.groupId = constraints.groupId;

    // Handle video-specific constraints
    if ('aspectRatio' in constraints) normalized.aspectRatio = constraints.aspectRatio;
    if ('facingMode' in constraints) normalized.facingMode = constraints.facingMode;
    if ('frameRate' in constraints) normalized.frameRate = constraints.frameRate;
    if ('height' in constraints) normalized.height = constraints.height;
    if ('width' in constraints) normalized.width = constraints.width;
    if ('resizeMode' in constraints) normalized.resizeMode = constraints.resizeMode;

    // Handle audio-specific constraints
    if ('autoGainControl' in constraints) normalized.autoGainControl = constraints.autoGainControl;
    if ('channelCount' in constraints) normalized.channelCount = constraints.channelCount;
    if ('echoCancellation' in constraints) normalized.echoCancellation = constraints.echoCancellation;
    if ('latency' in constraints) normalized.latency = constraints.latency;
    if ('noiseSuppression' in constraints) normalized.noiseSuppression = constraints.noiseSuppression;
    if ('sampleRate' in constraints) normalized.sampleRate = constraints.sampleRate;
    if ('sampleSize' in constraints) normalized.sampleSize = constraints.sampleSize;
    if ('volume' in constraints) normalized.volume = constraints.volume;

    // Handle advanced constraints
    if (constraints.advanced) {
      normalized.advanced = constraints.advanced.map(advanced => {
        return this.normalizeConstraints(advanced);
      });
    }

    return normalized;
  }

  private updateActiveConstraints(): void {
    this.state.activeConstraints = [];

    if (typeof this.state.video === 'object') {
      this.state.activeConstraints.push(this.state.video);
    }

    if (typeof this.state.audio === 'object') {
      this.state.activeConstraints.push(this.state.audio);
    }
  }

  async applyConstraints(track: MediaStreamTrack, constraints: MediaTrackConstraints): Promise<void> {
    try {
      await track.applyConstraints(this.normalizeConstraints(constraints));
      this.updateActiveConstraints();
      this.notifyConstraintsChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  getVideoConstraints(): MediaTrackConstraints | false {
    return this.state.video;
  }

  getAudioConstraints(): MediaTrackConstraints | false {
    return this.state.audio;
  }

  getActiveConstraints(): MediaTrackConstraints[] {
    return this.state.activeConstraints;
  }

  async getSupportedConstraints(): Promise<MediaTrackSupportedConstraints> {
    return navigator.mediaDevices.getSupportedConstraints();
  }

  async getCapabilities(track: MediaStreamTrack): Promise<MediaTrackCapabilities> {
    return track.getCapabilities();
  }

  async getSettings(track: MediaStreamTrack): Promise<MediaTrackSettings> {
    return track.getSettings();
  }

  createOptimalVideoConstraints(preferences: {
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    facingMode?: 'user' | 'environment';
    aspectRatio?: number;
  } = {}): MediaTrackConstraints {
    const constraints: MediaTrackConstraints = {};

    // Set resolution based on quality preference
    switch (preferences.quality) {
      case 'low':
        constraints.width = { ideal: 640 };
        constraints.height = { ideal: 480 };
        constraints.frameRate = { ideal: 15 };
        break;
      case 'medium':
        constraints.width = { ideal: 1280 };
        constraints.height = { ideal: 720 };
        constraints.frameRate = { ideal: 30 };
        break;
      case 'high':
        constraints.width = { ideal: 1920 };
        constraints.height = { ideal: 1080 };
        constraints.frameRate = { ideal: 30 };
        break;
      case 'ultra':
        constraints.width = { ideal: 3840 };
        constraints.height = { ideal: 2160 };
        constraints.frameRate = { ideal: 60 };
        break;
      default:
        constraints.width = { ideal: 1280 };
        constraints.height = { ideal: 720 };
        constraints.frameRate = { ideal: 30 };
    }

    // Set facing mode if specified
    if (preferences.facingMode) {
      constraints.facingMode = { ideal: preferences.facingMode };
    }

    // Set aspect ratio if specified
    if (preferences.aspectRatio) {
      constraints.aspectRatio = { ideal: preferences.aspectRatio };
    }

    return constraints;
  }

  createOptimalAudioConstraints(preferences: {
    quality?: 'low' | 'medium' | 'high';
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  } = {}): MediaTrackConstraints {
    const constraints: MediaTrackConstraints = {};

    // Set audio quality based on preference
    switch (preferences.quality) {
      case 'low':
        constraints.sampleRate = { ideal: 8000 };
        constraints.channelCount = { ideal: 1 };
        break;
      case 'medium':
        constraints.sampleRate = { ideal: 44100 };
        constraints.channelCount = { ideal: 1 };
        break;
      case 'high':
        constraints.sampleRate = { ideal: 48000 };
        constraints.channelCount = { ideal: 2 };
        break;
      default:
        constraints.sampleRate = { ideal: 44100 };
        constraints.channelCount = { ideal: 1 };
    }

    // Set audio processing preferences
    if (typeof preferences.echoCancellation === 'boolean') {
      constraints.echoCancellation = { ideal: preferences.echoCancellation };
    }

    if (typeof preferences.noiseSuppression === 'boolean') {
      constraints.noiseSuppression = { ideal: preferences.noiseSuppression };
    }

    if (typeof preferences.autoGainControl === 'boolean') {
      constraints.autoGainControl = { ideal: preferences.autoGainControl };
    }

    return constraints;
  }

  onConstraintsChange(callback: MediaConstraintsCallback): () => void {
    this.onConstraintsChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onConstraintsChangeCallbacks.delete(callback);
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
    this.state = {
      video: false,
      audio: false,
      activeConstraints: []
    };
    this.onConstraintsChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getSupportedConstraints' in navigator.mediaDevices;
  }
}

// Example usage:
/*
const constraints = MediaConstraintsManager.getInstance();

// Check if constraints are supported
console.log('Constraints supported:', MediaConstraintsManager.isSupported());

// Set up constraints change listener
const constraintsCleanup = constraints.onConstraintsChange(state => {
  console.log('Constraints changed:', state);
});

// Set up error listener
const errorCleanup = constraints.onError(error => {
  console.error('Constraints error:', error);
});

// Get supported constraints
constraints.getSupportedConstraints()
  .then(supported => {
    console.log('Supported constraints:', supported);

    // Set optimal video and audio constraints
    constraints.setConstraints({
      video: constraints.createOptimalVideoConstraints({
        quality: 'high',
        facingMode: 'user',
        aspectRatio: 16/9
      }),
      audio: constraints.createOptimalAudioConstraints({
        quality: 'high',
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      })
    });

    // Get active constraints
    console.log('Active constraints:', constraints.getActiveConstraints());

    // Get media stream with current constraints
    navigator.mediaDevices.getUserMedia({
      video: constraints.getVideoConstraints(),
      audio: constraints.getAudioConstraints()
    })
    .then(stream => {
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      // Get capabilities and settings
      return Promise.all([
        constraints.getCapabilities(videoTrack),
        constraints.getSettings(videoTrack),
        constraints.getCapabilities(audioTrack),
        constraints.getSettings(audioTrack)
      ]);
    })
    .then(([videoCapabilities, videoSettings, audioCapabilities, audioSettings]) => {
      console.log('Video capabilities:', videoCapabilities);
      console.log('Video settings:', videoSettings);
      console.log('Audio capabilities:', audioCapabilities);
      console.log('Audio settings:', audioSettings);

      // Clean up after 10 seconds
      setTimeout(() => {
        constraintsCleanup();
        errorCleanup();
        constraints.cleanup();
      }, 10000);
    })
    .catch(error => {
      console.error('Failed to get media stream:', error);
    });
  });
*/