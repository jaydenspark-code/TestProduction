type MediaConfiguration = {
  type: 'file' | 'media-source' | 'webrtc';
  video?: MediaDecodingConfiguration | MediaEncodingConfiguration;
  audio?: MediaDecodingConfiguration | MediaEncodingConfiguration;
};

type MediaDecodingConfiguration = {
  contentType: string;
  width?: number;
  height?: number;
  bitrate?: number;
  framerate?: number;
  channels?: number;
  samplerate?: number;
  spatialRendering?: boolean;
};

type MediaEncodingConfiguration = {
  contentType: string;
  width?: number;
  height?: number;
  bitrate?: number;
  framerate?: number;
  channels?: number;
  samplerate?: number;
  spatialRendering?: boolean;
};

type MediaCapabilitiesInfo = {
  supported: boolean;
  smooth: boolean;
  powerEfficient: boolean;
};

type MediaCapabilitiesState = {
  decodingInfo: Map<string, MediaCapabilitiesInfo>;
  encodingInfo: Map<string, MediaCapabilitiesInfo>;
};

type MediaCapabilitiesCallback = (state: MediaCapabilitiesState) => void;

export class MediaCapabilitiesManager {
  private static instance: MediaCapabilitiesManager;
  private state: MediaCapabilitiesState;
  private onCapabilitiesChangeCallbacks: Set<MediaCapabilitiesCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;

  private constructor() {
    this.state = {
      decodingInfo: new Map(),
      encodingInfo: new Map()
    };
    this.onCapabilitiesChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();
  }

  static getInstance(): MediaCapabilitiesManager {
    if (!MediaCapabilitiesManager.instance) {
      MediaCapabilitiesManager.instance = new MediaCapabilitiesManager();
    }
    return MediaCapabilitiesManager.instance;
  }

  private notifyCapabilitiesChange(): void {
    this.onCapabilitiesChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private generateConfigKey(config: MediaConfiguration): string {
    return JSON.stringify(config);
  }

  async queryDecodingInfo(config: MediaConfiguration): Promise<MediaCapabilitiesInfo> {
    try {
      const info = await navigator.mediaCapabilities.decodingInfo(config);
      const key = this.generateConfigKey(config);
      this.state.decodingInfo.set(key, info);
      this.notifyCapabilitiesChange();
      return info;
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  async queryEncodingInfo(config: MediaConfiguration): Promise<MediaCapabilitiesInfo> {
    try {
      const info = await navigator.mediaCapabilities.encodingInfo(config);
      const key = this.generateConfigKey(config);
      this.state.encodingInfo.set(key, info);
      this.notifyCapabilitiesChange();
      return info;
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  getDecodingInfo(config: MediaConfiguration): MediaCapabilitiesInfo | undefined {
    const key = this.generateConfigKey(config);
    return this.state.decodingInfo.get(key);
  }

  getEncodingInfo(config: MediaConfiguration): MediaCapabilitiesInfo | undefined {
    const key = this.generateConfigKey(config);
    return this.state.encodingInfo.get(key);
  }

  getAllDecodingInfo(): Map<string, MediaCapabilitiesInfo> {
    return new Map(this.state.decodingInfo);
  }

  getAllEncodingInfo(): Map<string, MediaCapabilitiesInfo> {
    return new Map(this.state.encodingInfo);
  }

  clearDecodingInfo(): void {
    this.state.decodingInfo.clear();
    this.notifyCapabilitiesChange();
  }

  clearEncodingInfo(): void {
    this.state.encodingInfo.clear();
    this.notifyCapabilitiesChange();
  }

  createVideoDecodingConfig({
    type = 'file',
    codec = 'vp9',
    width = 1920,
    height = 1080,
    bitrate = 2000000,
    framerate = 30,
    profile = '',
    level = ''
  }: {
    type?: 'file' | 'media-source' | 'webrtc';
    codec?: string;
    width?: number;
    height?: number;
    bitrate?: number;
    framerate?: number;
    profile?: string;
    level?: string;
  } = {}): MediaConfiguration {
    const contentType = `video/${codec}${profile ? `;profile=${profile}` : ''}${level ? `;level=${level}` : ''}`;

    return {
      type,
      video: {
        contentType,
        width,
        height,
        bitrate,
        framerate
      }
    };
  }

  createAudioDecodingConfig({
    type = 'file',
    codec = 'opus',
    channels = 2,
    samplerate = 48000,
    bitrate = 128000,
    spatialRendering = false
  }: {
    type?: 'file' | 'media-source' | 'webrtc';
    codec?: string;
    channels?: number;
    samplerate?: number;
    bitrate?: number;
    spatialRendering?: boolean;
  } = {}): MediaConfiguration {
    return {
      type,
      audio: {
        contentType: `audio/${codec}`,
        channels,
        samplerate,
        bitrate,
        spatialRendering
      }
    };
  }

  onCapabilitiesChange(callback: MediaCapabilitiesCallback): () => void {
    this.onCapabilitiesChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onCapabilitiesChangeCallbacks.delete(callback);
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
    this.state.decodingInfo.clear();
    this.state.encodingInfo.clear();
    this.onCapabilitiesChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'mediaCapabilities' in navigator &&
      'decodingInfo' in navigator.mediaCapabilities &&
      'encodingInfo' in navigator.mediaCapabilities;
  }
}

// Example usage:
/*
const capabilities = MediaCapabilitiesManager.getInstance();

// Check if media capabilities are supported
console.log('Media Capabilities supported:', MediaCapabilitiesManager.isSupported());

// Set up capabilities change listener
const capabilitiesCleanup = capabilities.onCapabilitiesChange(state => {
  console.log('Capabilities changed:', state);
});

// Set up error listener
const errorCleanup = capabilities.onError(error => {
  console.error('Media Capabilities error:', error);
});

// Create video configuration
const videoConfig = capabilities.createVideoDecodingConfig({
  codec: 'vp9',
  width: 1920,
  height: 1080,
  bitrate: 2000000,
  framerate: 30
});

// Create audio configuration
const audioConfig = capabilities.createAudioDecodingConfig({
  codec: 'opus',
  channels: 2,
  samplerate: 48000,
  bitrate: 128000
});

// Query decoding capabilities
Promise.all([
  capabilities.queryDecodingInfo(videoConfig),
  capabilities.queryDecodingInfo(audioConfig)
])
.then(([videoInfo, audioInfo]) => {
  console.log('Video decoding capabilities:', videoInfo);
  console.log('Audio decoding capabilities:', audioInfo);

  // Get all decoding info
  console.log('All decoding info:', capabilities.getAllDecodingInfo());

  // Clean up after 10 seconds
  setTimeout(() => {
    capabilitiesCleanup();
    errorCleanup();
    capabilities.cleanup();
  }, 10000);
})
.catch(error => {
  console.error('Failed to query capabilities:', error);
});
*/