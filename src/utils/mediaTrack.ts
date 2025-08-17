type TrackSettings = {
  enabled?: boolean;
  contentHint?: VideoTrackContentHint | AudioTrackContentHint;
  constraints?: MediaTrackConstraints;
};

type TrackCapabilities = {
  width?: number[];
  height?: number[];
  aspectRatio?: number[];
  frameRate?: number[];
  facingMode?: string[];
  resizeMode?: string[];
  sampleRate?: number[];
  sampleSize?: number[];
  echoCancellation?: boolean[];
  autoGainControl?: boolean[];
  noiseSuppression?: boolean[];
  latency?: number[];
  channelCount?: number[];
  deviceId?: string[];
  groupId?: string[];
};

type TrackStats = {
  timestamp: number;
  type: 'video' | 'audio';
  trackIdentifier: string;
  remoteSource: boolean;
  ended: boolean;
  detached: boolean;
  frameWidth?: number;
  frameHeight?: number;
  framesPerSecond?: number;
  framesSent?: number;
  framesReceived?: number;
  framesDropped?: number;
  audioLevel?: number;
  totalAudioEnergy?: number;
  totalSamplesDuration?: number;
  echoReturnLoss?: number;
  echoReturnLossEnhancement?: number;
};

type TrackEvent = {
  type: 'ended' | 'mute' | 'unmute' | 'overconstrained' | 'started';
  timestamp: number;
  trackId: string;
  details?: any;
};

type TrackEventCallback = (event: TrackEvent) => void;
type TrackStatsCallback = (stats: TrackStats) => void;

export class MediaTrackManager {
  private static instance: MediaTrackManager;
  private tracks: Map<string, MediaStreamTrack>;
  private statsIntervals: Map<string, number>;
  private onTrackEventCallbacks: Set<TrackEventCallback>;
  private onTrackStatsCallbacks: Set<TrackStatsCallback>;

  private constructor() {
    this.tracks = new Map();
    this.statsIntervals = new Map();
    this.onTrackEventCallbacks = new Set();
    this.onTrackStatsCallbacks = new Set();
  }

  static getInstance(): MediaTrackManager {
    if (!MediaTrackManager.instance) {
      MediaTrackManager.instance = new MediaTrackManager();
    }
    return MediaTrackManager.instance;
  }

  private notifyTrackEvent(event: TrackEvent): void {
    this.onTrackEventCallbacks.forEach(callback => callback(event));
  }

  private notifyTrackStats(stats: TrackStats): void {
    this.onTrackStatsCallbacks.forEach(callback => callback(stats));
  }

  addTrack(track: MediaStreamTrack, settings?: TrackSettings): void {
    if (this.tracks.has(track.id)) {
      throw new Error(`Track with id ${track.id} already exists`);
    }

    // Apply settings if provided
    if (settings) {
      if (typeof settings.enabled === 'boolean') {
        track.enabled = settings.enabled;
      }

      if (settings.contentHint) {
        if (track instanceof VideoTrack) {
          track.contentHint = settings.contentHint as VideoTrackContentHint;
        } else if (track instanceof AudioTrack) {
          track.contentHint = settings.contentHint as AudioTrackContentHint;
        }
      }

      if (settings.constraints) {
        track.applyConstraints(settings.constraints)
          .catch(error => {
            this.notifyTrackEvent({
              type: 'overconstrained',
              timestamp: performance.now(),
              trackId: track.id,
              details: error
            });
          });
      }
    }

    // Set up event listeners
    track.onended = () => {
      this.notifyTrackEvent({
        type: 'ended',
        timestamp: performance.now(),
        trackId: track.id
      });
    };

    track.onmute = () => {
      this.notifyTrackEvent({
        type: 'mute',
        timestamp: performance.now(),
        trackId: track.id
      });
    };

    track.onunmute = () => {
      this.notifyTrackEvent({
        type: 'unmute',
        timestamp: performance.now(),
        trackId: track.id
      });
    };

    this.tracks.set(track.id, track);

    this.notifyTrackEvent({
      type: 'started',
      timestamp: performance.now(),
      trackId: track.id
    });
  }

  removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    track.stop();
    this.stopStatsMonitoring(trackId);
    this.tracks.delete(trackId);
  }

  getTrack(trackId: string): MediaStreamTrack | undefined {
    return this.tracks.get(trackId);
  }

  getAllTracks(): MediaStreamTrack[] {
    return Array.from(this.tracks.values());
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.getAllTracks().filter(track => track.kind === 'video');
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.getAllTracks().filter(track => track.kind === 'audio');
  }

  async getTrackCapabilities(trackId: string): Promise<TrackCapabilities> {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    return track.getCapabilities();
  }

  async getTrackSettings(trackId: string): Promise<MediaTrackSettings> {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    return track.getSettings();
  }

  async getTrackConstraints(trackId: string): Promise<MediaTrackConstraints> {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    return track.getConstraints();
  }

  async applyTrackConstraints(trackId: string, constraints: MediaTrackConstraints): Promise<void> {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    try {
      await track.applyConstraints(constraints);
    } catch (error) {
      this.notifyTrackEvent({
        type: 'overconstrained',
        timestamp: performance.now(),
        trackId,
        details: error
      });
      throw error;
    }
  }

  setTrackEnabled(trackId: string, enabled: boolean): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    track.enabled = enabled;
  }

  setTrackContentHint(trackId: string, hint: VideoTrackContentHint | AudioTrackContentHint): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    if (track instanceof VideoTrack) {
      track.contentHint = hint as VideoTrackContentHint;
    } else if (track instanceof AudioTrack) {
      track.contentHint = hint as AudioTrackContentHint;
    }
  }

  async getTrackStats(trackId: string): Promise<TrackStats> {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    const stats = await track.getStats();
    const trackStats: TrackStats = {
      timestamp: performance.now(),
      type: track.kind as 'video' | 'audio',
      trackIdentifier: track.id,
      remoteSource: track.remote || false,
      ended: track.readyState === 'ended',
      detached: track.readyState === 'ended' && !this.tracks.has(track.id)
    };

    stats.forEach(stat => {
      if (stat.type === 'track') {
        Object.assign(trackStats, {
          frameWidth: stat.frameWidth,
          frameHeight: stat.frameHeight,
          framesPerSecond: stat.framesPerSecond,
          framesSent: stat.framesSent,
          framesReceived: stat.framesReceived,
          framesDropped: stat.framesDropped,
          audioLevel: stat.audioLevel,
          totalAudioEnergy: stat.totalAudioEnergy,
          totalSamplesDuration: stat.totalSamplesDuration,
          echoReturnLoss: stat.echoReturnLoss,
          echoReturnLossEnhancement: stat.echoReturnLossEnhancement
        });
      }
    });

    return trackStats;
  }

  startStatsMonitoring(trackId: string, interval: number = 1000): void {
    if (this.statsIntervals.has(trackId)) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const stats = await this.getTrackStats(trackId);
        this.notifyTrackStats(stats);
      } catch (error) {
        this.stopStatsMonitoring(trackId);
      }
    }, interval);

    this.statsIntervals.set(trackId, intervalId);
  }

  stopStatsMonitoring(trackId: string): void {
    const intervalId = this.statsIntervals.get(trackId);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.statsIntervals.delete(trackId);
    }
  }

  onTrackEvent(callback: TrackEventCallback): () => void {
    this.onTrackEventCallbacks.add(callback);
    return () => {
      this.onTrackEventCallbacks.delete(callback);
    };
  }

  onTrackStats(callback: TrackStatsCallback): () => void {
    this.onTrackStatsCallbacks.add(callback);
    return () => {
      this.onTrackStatsCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.tracks.forEach((track, trackId) => {
      track.stop();
      this.stopStatsMonitoring(trackId);
    });
    this.tracks.clear();
    this.statsIntervals.clear();
    this.onTrackEventCallbacks.clear();
    this.onTrackStatsCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'MediaStreamTrack' in window &&
      'getCapabilities' in MediaStreamTrack.prototype;
  }
}

// Example usage:
/*
const trackManager = MediaTrackManager.getInstance();

// Check if media track management is supported
console.log('Media Track Management supported:', MediaTrackManager.isSupported());

// Set up event listeners
const eventCleanup = trackManager.onTrackEvent(event => {
  console.log('Track event:', event);
});

const statsCleanup = trackManager.onTrackStats(stats => {
  console.log('Track stats:', stats);
});

// Get user media and manage tracks
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    // Add video track with settings
    const videoTrack = stream.getVideoTracks()[0];
    trackManager.addTrack(videoTrack, {
      enabled: true,
      contentHint: 'motion',
      constraints: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { max: 30 }
      }
    });

    // Start monitoring video track stats
    trackManager.startStatsMonitoring(videoTrack.id);

    // Add audio track
    const audioTrack = stream.getAudioTracks()[0];
    trackManager.addTrack(audioTrack, {
      enabled: true,
      contentHint: 'speech',
      constraints: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // Get track capabilities
    trackManager.getTrackCapabilities(videoTrack.id)
      .then(capabilities => {
        console.log('Video track capabilities:', capabilities);
      });

    // Get track settings
    trackManager.getTrackSettings(audioTrack.id)
      .then(settings => {
        console.log('Audio track settings:', settings);
      });

    // Clean up after 10 seconds
    setTimeout(() => {
      eventCleanup();
      statsCleanup();
      trackManager.cleanup();
    }, 10000);
  })
  .catch(error => {
    console.error('Failed to get user media:', error);
  });
*/