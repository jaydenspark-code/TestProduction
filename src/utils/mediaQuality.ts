type QualityConfig = {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minFrameRate?: number;
  maxFrameRate?: number;
  minBitrate?: number;
  maxBitrate?: number;
  minQuality?: number;
  maxQuality?: number;
  preferredCodecs?: string[];
  adaptiveMode?: 'quality' | 'performance' | 'balanced';
};

type QualityState = {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  quality: number;
  codec: string;
  timestamp: number;
};

type QualityEvent = {
  type: 'quality_change' | 'codec_change' | 'adaptation' | 'error';
  timestamp: number;
  details: any;
};

type QualityEventCallback = (event: QualityEvent) => void;

export class MediaQualityManager {
  private static instance: MediaQualityManager;
  private tracks: Map<string, MediaStreamTrack>;
  private configs: Map<string, QualityConfig>;
  private states: Map<string, QualityState>;
  private monitorIntervals: Map<string, number>;
  private onQualityEventCallbacks: Set<QualityEventCallback>;

  private constructor() {
    this.tracks = new Map();
    this.configs = new Map();
    this.states = new Map();
    this.monitorIntervals = new Map();
    this.onQualityEventCallbacks = new Set();
  }

  static getInstance(): MediaQualityManager {
    if (!MediaQualityManager.instance) {
      MediaQualityManager.instance = new MediaQualityManager();
    }
    return MediaQualityManager.instance;
  }

  private notifyQualityEvent(event: QualityEvent): void {
    this.onQualityEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): QualityConfig {
    return {
      minWidth: 640,
      maxWidth: 1920,
      minHeight: 360,
      maxHeight: 1080,
      minFrameRate: 24,
      maxFrameRate: 60,
      minBitrate: 500000,  // 500 kbps
      maxBitrate: 8000000, // 8 Mbps
      minQuality: 0.5,     // 50%
      maxQuality: 1.0,     // 100%
      preferredCodecs: ['VP9', 'H264', 'VP8'],
      adaptiveMode: 'balanced'
    };
  }

  private async getCurrentState(trackId: string): Promise<QualityState> {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    const settings = track.getSettings();
    const stats = await this.getTrackStats(track);

    return {
      width: settings.width || 0,
      height: settings.height || 0,
      frameRate: settings.frameRate || 0,
      bitrate: stats.bitrate || 0,
      quality: stats.quality || 1.0,
      codec: stats.codec || '',
      timestamp: performance.now()
    };
  }

  private async getTrackStats(track: MediaStreamTrack): Promise<{
    bitrate: number;
    quality: number;
    codec: string;
  }> {
    // This would typically use WebRTC statistics API
    // For now, return placeholder values
    return {
      bitrate: 1000000, // 1 Mbps
      quality: 1.0,     // 100%
      codec: 'VP8'
    };
  }

  async addTrack(track: MediaStreamTrack, config?: QualityConfig): Promise<string> {
    const trackId = crypto.randomUUID();
    this.tracks.set(trackId, track);
    this.configs.set(trackId, { ...this.getDefaultConfig(), ...config });
    this.states.set(trackId, await this.getCurrentState(trackId));

    return trackId;
  }

  removeTrack(trackId: string): void {
    if (!this.tracks.has(trackId)) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    this.stopMonitoring(trackId);
    this.tracks.delete(trackId);
    this.configs.delete(trackId);
    this.states.delete(trackId);
  }

  updateConfig(trackId: string, config: Partial<QualityConfig>): void {
    const currentConfig = this.configs.get(trackId);
    if (!currentConfig) {
      throw new Error(`Config for track ${trackId} not found`);
    }

    this.configs.set(trackId, { ...currentConfig, ...config });
    this.applyConfig(trackId).catch(error => {
      this.notifyQualityEvent({
        type: 'error',
        timestamp: performance.now(),
        details: error
      });
    });
  }

  private async applyConfig(trackId: string): Promise<void> {
    const track = this.tracks.get(trackId);
    const config = this.configs.get(trackId);
    if (!track || !config) {
      throw new Error(`Track or config with id ${trackId} not found`);
    }

    const constraints: MediaTrackConstraints = {
      width: { min: config.minWidth, max: config.maxWidth },
      height: { min: config.minHeight, max: config.maxHeight },
      frameRate: { min: config.minFrameRate, max: config.maxFrameRate }
    };

    try {
      await track.applyConstraints(constraints);
      const newState = await this.getCurrentState(trackId);
      this.states.set(trackId, newState);

      this.notifyQualityEvent({
        type: 'quality_change',
        timestamp: performance.now(),
        details: { trackId, state: newState }
      });
    } catch (error) {
      this.notifyQualityEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { trackId, error }
      });
      throw error;
    }
  }

  startMonitoring(trackId: string, interval: number = 1000): void {
    if (this.monitorIntervals.has(trackId)) {
      return;
    }

    const monitorId = window.setInterval(async () => {
      try {
        await this.monitor(trackId);
      } catch (error) {
        this.notifyQualityEvent({
          type: 'error',
          timestamp: performance.now(),
          details: { trackId, error }
        });
        this.stopMonitoring(trackId);
      }
    }, interval);

    this.monitorIntervals.set(trackId, monitorId);
  }

  stopMonitoring(trackId: string): void {
    const intervalId = this.monitorIntervals.get(trackId);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.monitorIntervals.delete(trackId);
    }
  }

  private async monitor(trackId: string): Promise<void> {
    const track = this.tracks.get(trackId);
    const config = this.configs.get(trackId);
    const previousState = this.states.get(trackId);
    if (!track || !config || !previousState) {
      throw new Error(`Track, config, or state with id ${trackId} not found`);
    }

    const currentState = await this.getCurrentState(trackId);
    this.states.set(trackId, currentState);

    // Check for significant changes
    const qualityChanged = Math.abs(currentState.quality - previousState.quality) > 0.1;
    const codecChanged = currentState.codec !== previousState.codec;
    const bitrateChanged = Math.abs(currentState.bitrate - previousState.bitrate) > 500000; // 500 kbps

    if (qualityChanged || codecChanged || bitrateChanged) {
      this.notifyQualityEvent({
        type: qualityChanged ? 'quality_change' : (codecChanged ? 'codec_change' : 'adaptation'),
        timestamp: performance.now(),
        details: { trackId, previousState, currentState }
      });

      // Adapt quality based on current state and config
      await this.adapt(trackId, currentState);
    }
  }

  private async adapt(trackId: string, state: QualityState): Promise<void> {
    const config = this.configs.get(trackId);
    if (!config) {
      throw new Error(`Config for track ${trackId} not found`);
    }

    let newConfig: Partial<QualityConfig> = {};

    switch (config.adaptiveMode) {
      case 'quality':
        // Prioritize quality over performance
        if (state.quality < config.minQuality!) {
          newConfig = {
            minWidth: Math.max(config.minWidth!, state.width * 0.8),
            minHeight: Math.max(config.minHeight!, state.height * 0.8),
            minFrameRate: config.minFrameRate
          };
        }
        break;

      case 'performance':
        // Prioritize performance over quality
        if (state.bitrate > config.maxBitrate!) {
          newConfig = {
            maxWidth: Math.min(config.maxWidth!, state.width * 0.8),
            maxHeight: Math.min(config.maxHeight!, state.height * 0.8),
            maxFrameRate: Math.min(config.maxFrameRate!, state.frameRate * 0.8)
          };
        }
        break;

      case 'balanced':
      default:
        // Balance quality and performance
        if (state.quality < config.minQuality! && state.bitrate < config.maxBitrate!) {
          newConfig = {
            minWidth: Math.max(config.minWidth!, state.width * 0.9),
            minHeight: Math.max(config.minHeight!, state.height * 0.9),
            minFrameRate: Math.max(config.minFrameRate!, state.frameRate * 0.9)
          };
        } else if (state.quality > config.maxQuality! || state.bitrate > config.maxBitrate!) {
          newConfig = {
            maxWidth: Math.min(config.maxWidth!, state.width * 0.9),
            maxHeight: Math.min(config.maxHeight!, state.height * 0.9),
            maxFrameRate: Math.min(config.maxFrameRate!, state.frameRate * 0.9)
          };
        }
        break;
    }

    if (Object.keys(newConfig).length > 0) {
      this.updateConfig(trackId, newConfig);
      this.notifyQualityEvent({
        type: 'adaptation',
        timestamp: performance.now(),
        details: { trackId, newConfig }
      });
    }
  }

  getState(trackId: string): QualityState {
    const state = this.states.get(trackId);
    if (!state) {
      throw new Error(`State for track ${trackId} not found`);
    }
    return { ...state };
  }

  getConfig(trackId: string): QualityConfig {
    const config = this.configs.get(trackId);
    if (!config) {
      throw new Error(`Config for track ${trackId} not found`);
    }
    return { ...config };
  }

  onQualityEvent(callback: QualityEventCallback): () => void {
    this.onQualityEventCallbacks.add(callback);
    return () => {
      this.onQualityEventCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.tracks.forEach((_, trackId) => {
      this.stopMonitoring(trackId);
    });
    this.tracks.clear();
    this.configs.clear();
    this.states.clear();
    this.monitorIntervals.clear();
    this.onQualityEventCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'MediaStreamTrack' in window &&
      'getSettings' in MediaStreamTrack.prototype &&
      'applyConstraints' in MediaStreamTrack.prototype;
  }
}

// Example usage:
/*
const qualityManager = MediaQualityManager.getInstance();

// Check if media quality management is supported
console.log('Media Quality Management supported:', MediaQualityManager.isSupported());

// Set up event listener
const eventCleanup = qualityManager.onQualityEvent(event => {
  console.log('Quality event:', event);
});

// Get user media and manage quality
navigator.mediaDevices.getUserMedia({
  video: {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 360, ideal: 720, max: 1080 },
    frameRate: { min: 24, ideal: 30, max: 60 }
  }
}).then(stream => {
  const videoTrack = stream.getVideoTracks()[0];

  // Add track with custom config
  qualityManager.addTrack(videoTrack, {
    minWidth: 640,
    maxWidth: 1920,
    minHeight: 360,
    maxHeight: 1080,
    minFrameRate: 24,
    maxFrameRate: 60,
    minBitrate: 1000000,  // 1 Mbps
    maxBitrate: 4000000,  // 4 Mbps
    minQuality: 0.7,      // 70%
    maxQuality: 1.0,      // 100%
    preferredCodecs: ['VP9', 'H264'],
    adaptiveMode: 'balanced'
  }).then(trackId => {
    // Start quality monitoring
    qualityManager.startMonitoring(trackId, 2000); // Monitor every 2 seconds

    // After 10 seconds, update config to prefer performance
    setTimeout(() => {
      qualityManager.updateConfig(trackId, {
        adaptiveMode: 'performance',
        maxBitrate: 2000000 // 2 Mbps
      });
    }, 10000);

    // After 20 seconds, update config to prefer quality
    setTimeout(() => {
      qualityManager.updateConfig(trackId, {
        adaptiveMode: 'quality',
        minQuality: 0.8 // 80%
      });
    }, 20000);
  });
}).catch(error => {
  console.error('Failed to get user media:', error);
});

// Clean up after 30 seconds
setTimeout(() => {
  eventCleanup();
  qualityManager.cleanup();
}, 30000);
*/