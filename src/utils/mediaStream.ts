type MediaStreamOptions = {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  displayMedia?: boolean;
};

type MediaStreamState = {
  active: boolean;
  stream: MediaStream | null;
  videoTracks: MediaStreamTrack[];
  audioTracks: MediaStreamTrack[];
  constraints: MediaStreamConstraints;
};

type MediaStreamCallback = (state: MediaStreamState) => void;

export class MediaStreamManager {
  private static instance: MediaStreamManager;
  private state: MediaStreamState;
  private onStateChangeCallbacks: Set<MediaStreamCallback>;
  private onTrackEndedCallbacks: Set<(track: MediaStreamTrack) => void>;
  private onErrorCallbacks: Set<(error: Error) => void>;

  private constructor() {
    this.state = {
      active: false,
      stream: null,
      videoTracks: [],
      audioTracks: [],
      constraints: {}
    };

    this.onStateChangeCallbacks = new Set();
    this.onTrackEndedCallbacks = new Set();
    this.onErrorCallbacks = new Set();
  }

  static getInstance(): MediaStreamManager {
    if (!MediaStreamManager.instance) {
      MediaStreamManager.instance = new MediaStreamManager();
    }
    return MediaStreamManager.instance;
  }

  private updateState(newState: Partial<MediaStreamState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyTrackEnded(track: MediaStreamTrack): void {
    this.onTrackEndedCallbacks.forEach(callback => callback(track));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private setupTrackListeners(track: MediaStreamTrack): void {
    track.onended = () => {
      this.notifyTrackEnded(track);
      this.updateTracksState();
    };
  }

  private updateTracksState(): void {
    if (!this.state.stream) return;

    this.updateState({
      videoTracks: this.state.stream.getVideoTracks(),
      audioTracks: this.state.stream.getAudioTracks(),
      active: this.state.stream.active
    });
  }

  async initializeStream(options: MediaStreamOptions = {}): Promise<MediaStream> {
    try {
      let stream: MediaStream;

      if (options.displayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: options.video || true,
          audio: options.audio || false
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: options.video || false,
          audio: options.audio || false
        });
      }

      this.state.stream = stream;
      this.state.constraints = {
        video: options.video || false,
        audio: options.audio || false
      };

      stream.getTracks().forEach(track => {
        this.setupTrackListeners(track);
      });

      this.updateTracksState();
      return stream;
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  async addTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.state.stream) return;

    try {
      this.state.stream.addTrack(track);
      this.setupTrackListeners(track);
      this.updateTracksState();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  removeTrack(track: MediaStreamTrack): void {
    if (!this.state.stream) return;

    try {
      this.state.stream.removeTrack(track);
      this.updateTracksState();
    } catch (error) {
      this.notifyError(error as Error);
    }
  }

  async applyConstraints(trackType: 'video' | 'audio', constraints: MediaTrackConstraints): Promise<void> {
    if (!this.state.stream) return;

    const tracks = trackType === 'video' ?
      this.state.stream.getVideoTracks() :
      this.state.stream.getAudioTracks();

    try {
      await Promise.all(
        tracks.map(track => track.applyConstraints(constraints))
      );

      this.state.constraints[trackType] = {
        ...(this.state.constraints[trackType] || {}),
        ...constraints
      };

      this.notifyStateChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  enableTrack(trackType: 'video' | 'audio', enabled: boolean): void {
    if (!this.state.stream) return;

    const tracks = trackType === 'video' ?
      this.state.stream.getVideoTracks() :
      this.state.stream.getAudioTracks();

    tracks.forEach(track => {
      track.enabled = enabled;
    });

    this.notifyStateChange();
  }

  async switchCamera(): Promise<void> {
    if (!this.state.stream || !this.state.constraints.video) return;

    const currentVideo = this.state.stream.getVideoTracks()[0];
    if (!currentVideo) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    if (videoDevices.length < 2) return;

    const currentDeviceId = currentVideo.getSettings().deviceId;
    const nextDevice = videoDevices.find(device => device.deviceId !== currentDeviceId) ||
      videoDevices[0];

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        const sender = this.state.stream.getVideoTracks()[0];
        if (sender) {
          this.state.stream.removeTrack(sender);
          sender.stop();
        }

        this.state.stream.addTrack(newVideoTrack);
        this.setupTrackListeners(newVideoTrack);
        this.updateTracksState();
      }
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  getStream(): MediaStream | null {
    return this.state.stream;
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.state.videoTracks;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.state.audioTracks;
  }

  getConstraints(): MediaStreamConstraints {
    return this.state.constraints;
  }

  isActive(): boolean {
    return this.state.active;
  }

  onStateChange(callback: MediaStreamCallback): () => void {
    this.onStateChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onStateChangeCallbacks.delete(callback);
    };
  }

  onTrackEnded(callback: (track: MediaStreamTrack) => void): () => void {
    this.onTrackEndedCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onTrackEndedCallbacks.delete(callback);
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
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
    }

    this.state = {
      active: false,
      stream: null,
      videoTracks: [],
      audioTracks: [],
      constraints: {}
    };

    this.onStateChangeCallbacks.clear();
    this.onTrackEndedCallbacks.clear();
    this.onErrorCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices;
  }

  static async getDevices(): Promise<MediaDeviceInfo[]> {
    if (!MediaStreamManager.isSupported()) return [];

    try {
      return await navigator.mediaDevices.enumerateDevices();
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }
}

// Example usage:
/*
const mediaStream = MediaStreamManager.getInstance();

// Check if MediaStream API is supported
console.log('MediaStream API supported:', MediaStreamManager.isSupported());

// Get available devices
MediaStreamManager.getDevices().then(devices => {
  console.log('Available devices:', devices);
});

// Set up state change listener
const stateCleanup = mediaStream.onStateChange(state => {
  console.log('Stream state changed:', state);
});

// Set up track ended listener
const trackCleanup = mediaStream.onTrackEnded(track => {
  console.log('Track ended:', track);
});

// Set up error listener
const errorCleanup = mediaStream.onError(error => {
  console.error('Stream error:', error);
});

// Initialize stream with both video and audio
mediaStream.initializeStream({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  audio: true
})
.then(stream => {
  console.log('Stream initialized:', stream);

  // Apply new constraints to video track
  return mediaStream.applyConstraints('video', {
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  });
})
.then(() => {
  // Disable video track
  mediaStream.enableTrack('video', false);

  // Switch camera after 5 seconds
  setTimeout(() => {
    mediaStream.switchCamera()
      .then(() => console.log('Camera switched'));
  }, 5000);

  // Clean up after 10 seconds
  setTimeout(() => {
    stateCleanup();
    trackCleanup();
    errorCleanup();
    mediaStream.cleanup();
  }, 10000);
})
.catch(error => {
  console.error('Failed to initialize stream:', error);
});
*/