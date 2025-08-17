type MediaKeySystemConfiguration = {
  initDataTypes?: string[];
  audioCapabilities?: MediaKeySystemMediaCapability[];
  videoCapabilities?: MediaKeySystemMediaCapability[];
  distinctiveIdentifier?: 'required' | 'optional' | 'not-allowed';
  persistentState?: 'required' | 'optional' | 'not-allowed';
  sessionTypes?: string[];
};

type MediaKeySystemMediaCapability = {
  contentType?: string;
  robustness?: string;
  encryptionScheme?: 'cenc' | 'cbcs' | null;
};

type MediaKeySessionType = 'temporary' | 'persistent-license' | 'persistent-usage-record';

type MediaKeysState = {
  keySystem: string;
  configuration: MediaKeySystemConfiguration;
  sessions: Map<string, MediaKeySession>;
};

type MediaKeysCallback = (state: MediaKeysState) => void;

export class MediaKeysManager {
  private static instance: MediaKeysManager;
  private mediaKeys: MediaKeys | null;
  private state: MediaKeysState;
  private onKeyStatusChangeCallbacks: Set<MediaKeysCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;

  private constructor() {
    this.mediaKeys = null;
    this.state = {
      keySystem: '',
      configuration: {},
      sessions: new Map()
    };
    this.onKeyStatusChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();
  }

  static getInstance(): MediaKeysManager {
    if (!MediaKeysManager.instance) {
      MediaKeysManager.instance = new MediaKeysManager();
    }
    return MediaKeysManager.instance;
  }

  private notifyKeyStatusChange(): void {
    this.onKeyStatusChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  async initialize(keySystem: string, configuration: MediaKeySystemConfiguration): Promise<void> {
    try {
      const access = await navigator.requestMediaKeySystemAccess(keySystem, [configuration]);
      this.mediaKeys = await access.createMediaKeys();
      this.state.keySystem = keySystem;
      this.state.configuration = configuration;
      this.notifyKeyStatusChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  async createSession(type: MediaKeySessionType = 'temporary'): Promise<MediaKeySession> {
    if (!this.mediaKeys) {
      const error = new Error('MediaKeys not initialized');
      this.notifyError(error);
      throw error;
    }

    try {
      const session = this.mediaKeys.createSession(type);

      session.addEventListener('keystatuseschange', () => {
        this.notifyKeyStatusChange();
      });

      session.addEventListener('message', async event => {
        try {
          // Handle license request
          const response = await this.requestLicense(event.message);
          await session.update(response);
        } catch (error) {
          this.notifyError(error as Error);
        }
      });

      this.state.sessions.set(session.sessionId, session);
      this.notifyKeyStatusChange();

      return session;
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  async loadSession(sessionId: string): Promise<MediaKeySession | null> {
    if (!this.mediaKeys) {
      const error = new Error('MediaKeys not initialized');
      this.notifyError(error);
      throw error;
    }

    try {
      const session = this.mediaKeys.createSession('persistent-license');
      const loaded = await session.load(sessionId);

      if (loaded) {
        this.state.sessions.set(sessionId, session);
        this.notifyKeyStatusChange();
        return session;
      }

      return null;
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  async removeSession(sessionId: string): Promise<void> {
    const session = this.state.sessions.get(sessionId);
    if (!session) return;

    try {
      await session.remove();
      this.state.sessions.delete(sessionId);
      this.notifyKeyStatusChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.state.sessions.get(sessionId);
    if (!session) return;

    try {
      await session.close();
      this.state.sessions.delete(sessionId);
      this.notifyKeyStatusChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  async generateRequest(sessionId: string, initDataType: string, initData: BufferSource): Promise<void> {
    const session = this.state.sessions.get(sessionId);
    if (!session) {
      const error = new Error(`Session not found: ${sessionId}`);
      this.notifyError(error);
      throw error;
    }

    try {
      await session.generateRequest(initDataType, initData);
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  private async requestLicense(message: ArrayBuffer): Promise<ArrayBuffer> {
    // This method should be implemented by the application to handle license requests
    // It typically involves sending the message to a license server and receiving a response
    throw new Error('License request handler not implemented');
  }

  async setServerCertificate(serverCertificate: BufferSource): Promise<void> {
    if (!this.mediaKeys) {
      const error = new Error('MediaKeys not initialized');
      this.notifyError(error);
      throw error;
    }

    try {
      await this.mediaKeys.setServerCertificate(serverCertificate);
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  getKeySystem(): string {
    return this.state.keySystem;
  }

  getConfiguration(): MediaKeySystemConfiguration {
    return this.state.configuration;
  }

  getSessions(): Map<string, MediaKeySession> {
    return this.state.sessions;
  }

  getSession(sessionId: string): MediaKeySession | undefined {
    return this.state.sessions.get(sessionId);
  }

  onKeyStatusChange(callback: MediaKeysCallback): () => void {
    this.onKeyStatusChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onKeyStatusChangeCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.onErrorCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  async cleanup(): Promise<void> {
    const sessions = Array.from(this.state.sessions.values());
    await Promise.all(sessions.map(session => session.close()));

    this.state.sessions.clear();
    this.onKeyStatusChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.mediaKeys = null;
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'requestMediaKeySystemAccess' in navigator &&
      'MediaKeys' in window;
  }

  static async getSupportedKeySystems(): Promise<string[]> {
    const commonKeySystems = [
      'com.widevine.alpha',
      'com.microsoft.playready',
      'com.apple.fps.1_0',
      'org.w3.clearkey'
    ];

    const supportedSystems: string[] = [];

    const config: MediaKeySystemConfiguration = {
      initDataTypes: ['cenc'],
      audioCapabilities: [{
        contentType: 'audio/mp4;codecs="mp4a.40.2"',
        robustness: ''
      }],
      videoCapabilities: [{
        contentType: 'video/mp4;codecs="avc1.42E01E"',
        robustness: ''
      }]
    };

    for (const system of commonKeySystems) {
      try {
        await navigator.requestMediaKeySystemAccess(system, [config]);
        supportedSystems.push(system);
      } catch {
        // System not supported
      }
    }

    return supportedSystems;
  }
}

// Example usage:
/*
const mediaKeys = MediaKeysManager.getInstance();

// Check if EME is supported
console.log('EME supported:', MediaKeysManager.isSupported());

// Get supported key systems
MediaKeysManager.getSupportedKeySystems()
  .then(systems => {
    console.log('Supported key systems:', systems);
  });

// Set up key status change listener
const statusCleanup = mediaKeys.onKeyStatusChange(state => {
  console.log('Key status changed:', state);
});

// Set up error listener
const errorCleanup = mediaKeys.onError(error => {
  console.error('MediaKeys error:', error);
});

// Initialize with Widevine
mediaKeys.initialize('com.widevine.alpha', {
  initDataTypes: ['cenc'],
  audioCapabilities: [{
    contentType: 'audio/mp4;codecs="mp4a.40.2"',
    robustness: 'SW_SECURE_CRYPTO'
  }],
  videoCapabilities: [{
    contentType: 'video/mp4;codecs="avc1.42E01E"',
    robustness: 'SW_SECURE_CRYPTO'
  }]
})
.then(async () => {
  // Create a new session
  const session = await mediaKeys.createSession();

  // Generate a license request
  const initData = new Uint8Array([/* PSSH data */]);
  await mediaKeys.generateRequest(session.sessionId, 'cenc', initData);

  // Clean up after 10 seconds
  setTimeout(async () => {
    statusCleanup();
    errorCleanup();
    await mediaKeys.cleanup();
  }, 10000);
})
.catch(error => {
  console.error('Failed to initialize MediaKeys:', error);
});
*/