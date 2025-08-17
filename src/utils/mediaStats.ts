type StatsConfig = {
  interval?: number;
  maxHistory?: number;
  enableAudio?: boolean;
  enableVideo?: boolean;
  enableNetwork?: boolean;
  enableQuality?: boolean;
  customMetrics?: string[];
};

type StatsData = {
  timestamp: number;
  audio?: AudioStats;
  video?: VideoStats;
  network?: NetworkStats;
  quality?: QualityStats;
  custom?: Record<string, any>;
};

type AudioStats = {
  bitrate: number;
  packetsLost: number;
  packetsReceived: number;
  bytesReceived: number;
  jitter: number;
  level: number;
  sampleRate: number;
  channelCount: number;
};

type VideoStats = {
  bitrate: number;
  packetsLost: number;
  packetsReceived: number;
  bytesReceived: number;
  frameRate: number;
  framesDropped: number;
  framesReceived: number;
  framesDecoded: number;
  width: number;
  height: number;
  qualityIndex: number;
};

type NetworkStats = {
  roundTripTime: number;
  availableOutgoingBitrate: number;
  availableIncomingBitrate: number;
  currentRoundTripTime: number;
  totalRoundTripTime: number;
  localCandidateType: string;
  remoteCandidateType: string;
  transportType: string;
  congestionWindow: number;
  receiverSideBwe: number;
};

type QualityStats = {
  qualityIndex: number;
  estimatedPlayoutTimestamp: number;
  jitterBufferDelay: number;
  jitterBufferEmittedCount: number;
  keyFramesDecoded: number;
  frameWidth: number;
  frameHeight: number;
  framesPerSecond: number;
  qpSum: number;
  totalDecodeTime: number;
  totalProcessingDelay: number;
};

type StatsEvent = {
  type: 'stats_update' | 'error' | 'warning';
  timestamp: number;
  details: any;
};

type StatsEventCallback = (event: StatsEvent) => void;

export class MediaStatsManager {
  private static instance: MediaStatsManager;
  private peerConnections: Map<string, RTCPeerConnection>;
  private configs: Map<string, StatsConfig>;
  private statsHistory: Map<string, StatsData[]>;
  private intervals: Map<string, number>;
  private onStatsEventCallbacks: Set<StatsEventCallback>;

  private constructor() {
    this.peerConnections = new Map();
    this.configs = new Map();
    this.statsHistory = new Map();
    this.intervals = new Map();
    this.onStatsEventCallbacks = new Set();
  }

  static getInstance(): MediaStatsManager {
    if (!MediaStatsManager.instance) {
      MediaStatsManager.instance = new MediaStatsManager();
    }
    return MediaStatsManager.instance;
  }

  private notifyStatsEvent(event: StatsEvent): void {
    this.onStatsEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): StatsConfig {
    return {
      interval: 1000,     // 1 second
      maxHistory: 60,     // 1 minute of history
      enableAudio: true,
      enableVideo: true,
      enableNetwork: true,
      enableQuality: true,
      customMetrics: []
    };
  }

  addPeerConnection(pc: RTCPeerConnection, config?: StatsConfig): string {
    const pcId = crypto.randomUUID();
    this.peerConnections.set(pcId, pc);
    this.configs.set(pcId, { ...this.getDefaultConfig(), ...config });
    this.statsHistory.set(pcId, []);

    // Start collecting stats
    this.startStatsCollection(pcId);

    return pcId;
  }

  private async startStatsCollection(pcId: string): Promise<void> {
    const pc = this.peerConnections.get(pcId);
    const config = this.configs.get(pcId);
    if (!pc || !config) return;

    const collectStats = async () => {
      try {
        const stats = await this.collectStats(pcId);
        const history = this.statsHistory.get(pcId) || [];
        history.push(stats);

        // Limit history size
        while (history.length > (config.maxHistory || 60)) {
          history.shift();
        }

        this.statsHistory.set(pcId, history);

        this.notifyStatsEvent({
          type: 'stats_update',
          timestamp: performance.now(),
          details: { pcId, stats }
        });

        // Analyze stats for warnings
        this.analyzeStats(pcId, stats);
      } catch (error) {
        this.notifyStatsEvent({
          type: 'error',
          timestamp: performance.now(),
          details: { pcId, error }
        });
      }
    };

    // Initial collection
    await collectStats();

    // Set up interval for continuous collection
    const intervalId = window.setInterval(collectStats, config.interval || 1000);
    this.intervals.set(pcId, intervalId);
  }

  private async collectStats(pcId: string): Promise<StatsData> {
    const pc = this.peerConnections.get(pcId);
    const config = this.configs.get(pcId);
    if (!pc || !config) {
      throw new Error(`PeerConnection or config with id ${pcId} not found`);
    }

    const stats: StatsData = {
      timestamp: performance.now()
    };

    const rawStats = await pc.getStats();

    rawStats.forEach(stat => {
      switch (stat.type) {
        case 'inbound-rtp':
          if (stat.kind === 'audio' && config.enableAudio) {
            stats.audio = this.processAudioStats(stat);
          } else if (stat.kind === 'video' && config.enableVideo) {
            stats.video = this.processVideoStats(stat);
          }
          break;

        case 'candidate-pair':
          if (config.enableNetwork && stat.nominated) {
            stats.network = this.processNetworkStats(stat);
          }
          break;

        case 'media-source':
          if (config.enableQuality) {
            stats.quality = this.processQualityStats(stat);
          }
          break;

        default:
          if (config.customMetrics?.includes(stat.type)) {
            if (!stats.custom) stats.custom = {};
            stats.custom[stat.type] = stat;
          }
          break;
      }
    });

    return stats;
  }

  private processAudioStats(stat: any): AudioStats {
    return {
      bitrate: this.calculateBitrate(stat.bytesReceived, stat.timestamp),
      packetsLost: stat.packetsLost || 0,
      packetsReceived: stat.packetsReceived || 0,
      bytesReceived: stat.bytesReceived || 0,
      jitter: stat.jitter || 0,
      level: stat.audioLevel || 0,
      sampleRate: stat.sampleRate || 0,
      channelCount: stat.channelCount || 0
    };
  }

  private processVideoStats(stat: any): VideoStats {
    return {
      bitrate: this.calculateBitrate(stat.bytesReceived, stat.timestamp),
      packetsLost: stat.packetsLost || 0,
      packetsReceived: stat.packetsReceived || 0,
      bytesReceived: stat.bytesReceived || 0,
      frameRate: stat.framesPerSecond || 0,
      framesDropped: stat.framesDropped || 0,
      framesReceived: stat.framesReceived || 0,
      framesDecoded: stat.framesDecoded || 0,
      width: stat.frameWidth || 0,
      height: stat.frameHeight || 0,
      qualityIndex: this.calculateQualityIndex(stat)
    };
  }

  private processNetworkStats(stat: any): NetworkStats {
    return {
      roundTripTime: stat.roundTripTime || 0,
      availableOutgoingBitrate: stat.availableOutgoingBitrate || 0,
      availableIncomingBitrate: stat.availableIncomingBitrate || 0,
      currentRoundTripTime: stat.currentRoundTripTime || 0,
      totalRoundTripTime: stat.totalRoundTripTime || 0,
      localCandidateType: stat.localCandidateType || '',
      remoteCandidateType: stat.remoteCandidateType || '',
      transportType: stat.transportType || '',
      congestionWindow: stat.congestionWindow || 0,
      receiverSideBwe: stat.receiverSideBwe || 0
    };
  }

  private processQualityStats(stat: any): QualityStats {
    return {
      qualityIndex: this.calculateQualityIndex(stat),
      estimatedPlayoutTimestamp: stat.estimatedPlayoutTimestamp || 0,
      jitterBufferDelay: stat.jitterBufferDelay || 0,
      jitterBufferEmittedCount: stat.jitterBufferEmittedCount || 0,
      keyFramesDecoded: stat.keyFramesDecoded || 0,
      frameWidth: stat.frameWidth || 0,
      frameHeight: stat.frameHeight || 0,
      framesPerSecond: stat.framesPerSecond || 0,
      qpSum: stat.qpSum || 0,
      totalDecodeTime: stat.totalDecodeTime || 0,
      totalProcessingDelay: stat.totalProcessingDelay || 0
    };
  }

  private calculateBitrate(bytes: number, timestamp: number): number {
    // Implementation would track previous values and calculate rate
    return bytes * 8; // Simplified implementation
  }

  private calculateQualityIndex(stat: any): number {
    // Simplified quality index calculation
    // Real implementation would consider multiple factors
    const fps = stat.framesPerSecond || 0;
    const width = stat.frameWidth || 0;
    const height = stat.frameHeight || 0;
    const packetsLost = stat.packetsLost || 0;
    const totalPackets = (stat.packetsReceived || 0) + packetsLost;
    const packetLossRate = totalPackets > 0 ? packetsLost / totalPackets : 0;

    // Normalize each metric to 0-1 range and combine
    const fpsScore = Math.min(fps / 30, 1);
    const resolutionScore = Math.min((width * height) / (1920 * 1080), 1);
    const reliabilityScore = 1 - packetLossRate;

    // Weighted average
    return (fpsScore * 0.3 + resolutionScore * 0.4 + reliabilityScore * 0.3);
  }

  private analyzeStats(pcId: string, stats: StatsData): void {
    const warnings: string[] = [];

    // Check video quality
    if (stats.video) {
      if (stats.video.qualityIndex < 0.5) {
        warnings.push('Low video quality detected');
      }
      if (stats.video.framesDropped > stats.video.framesReceived * 0.1) {
        warnings.push('High frame drop rate detected');
      }
    }

    // Check network conditions
    if (stats.network) {
      if (stats.network.roundTripTime > 300) {
        warnings.push('High network latency detected');
      }
      if (stats.network.availableIncomingBitrate < 500000) { // 500 kbps
        warnings.push('Low available bandwidth detected');
      }
    }

    // Notify warnings
    if (warnings.length > 0) {
      this.notifyStatsEvent({
        type: 'warning',
        timestamp: performance.now(),
        details: { pcId, warnings }
      });
    }
  }

  removePeerConnection(pcId: string): void {
    const intervalId = this.intervals.get(pcId);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.intervals.delete(pcId);
    }

    this.peerConnections.delete(pcId);
    this.configs.delete(pcId);
    this.statsHistory.delete(pcId);
  }

  getStats(pcId: string): StatsData[] {
    return this.statsHistory.get(pcId) || [];
  }

  getLatestStats(pcId: string): StatsData | undefined {
    const history = this.statsHistory.get(pcId);
    return history ? history[history.length - 1] : undefined;
  }

  updateConfig(pcId: string, config: Partial<StatsConfig>): void {
    const currentConfig = this.configs.get(pcId);
    if (!currentConfig) {
      throw new Error(`Config for peer connection ${pcId} not found`);
    }

    this.configs.set(pcId, { ...currentConfig, ...config });

    // Restart stats collection with new config
    const intervalId = this.intervals.get(pcId);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.intervals.delete(pcId);
    }

    this.startStatsCollection(pcId);
  }

  onStatsEvent(callback: StatsEventCallback): () => void {
    this.onStatsEventCallbacks.add(callback);
    return () => {
      this.onStatsEventCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    // Clear all intervals
    this.intervals.forEach(intervalId => {
      window.clearInterval(intervalId);
    });

    // Clear all data
    this.peerConnections.clear();
    this.configs.clear();
    this.statsHistory.clear();
    this.intervals.clear();
    this.onStatsEventCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'RTCPeerConnection' in window &&
      'getStats' in RTCPeerConnection.prototype;
  }
}

// Example usage:
/*
const statsManager = MediaStatsManager.getInstance();

// Check if media stats collection is supported
console.log('Media Stats Collection supported:', MediaStatsManager.isSupported());

// Set up event listener
const eventCleanup = statsManager.onStatsEvent(event => {
  console.log('Stats event:', event);
});

// Create a peer connection
const pc = new RTCPeerConnection();

// Add peer connection with custom config
const pcId = statsManager.addPeerConnection(pc, {
  interval: 2000,      // 2 seconds
  maxHistory: 30,      // 30 samples
  enableAudio: true,
  enableVideo: true,
  enableNetwork: true,
  enableQuality: true,
  customMetrics: ['remote-inbound-rtp', 'transport']
});

// After 10 seconds, update config to collect more frequently
setTimeout(() => {
  statsManager.updateConfig(pcId, {
    interval: 1000,    // 1 second
    maxHistory: 60     // 60 samples
  });
}, 10000);

// After 20 seconds, get latest stats
setTimeout(() => {
  const latestStats = statsManager.getLatestStats(pcId);
  console.log('Latest stats:', latestStats);
}, 20000);

// Clean up after 30 seconds
setTimeout(() => {
  eventCleanup();
  statsManager.cleanup();
}, 30000);
*/