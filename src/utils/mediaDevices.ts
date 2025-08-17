type MediaDeviceInfo = {
  deviceId: string;
  groupId: string;
  kind: MediaDeviceKind;
  label: string;
};

type MediaDevicesState = {
  devices: MediaDeviceInfo[];
  permissions: {
    video: PermissionState;
    audio: PermissionState;
  };
};

type MediaDevicesCallback = (state: MediaDevicesState) => void;

export class MediaDevicesManager {
  private static instance: MediaDevicesManager;
  private state: MediaDevicesState;
  private onDeviceChangeCallbacks: Set<MediaDevicesCallback>;
  private onPermissionChangeCallbacks: Set<MediaDevicesCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;

  private constructor() {
    this.state = {
      devices: [],
      permissions: {
        video: 'prompt',
        audio: 'prompt'
      }
    };

    this.onDeviceChangeCallbacks = new Set();
    this.onPermissionChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();

    if (typeof window !== 'undefined') {
      this.setupDeviceChangeListener();
      this.initializeState();
    }
  }

  static getInstance(): MediaDevicesManager {
    if (!MediaDevicesManager.instance) {
      MediaDevicesManager.instance = new MediaDevicesManager();
    }
    return MediaDevicesManager.instance;
  }

  private async initializeState(): Promise<void> {
    try {
      await this.updateDevices();
      await this.updatePermissions();
    } catch (error) {
      this.notifyError(error as Error);
    }
  }

  private setupDeviceChangeListener(): void {
    navigator.mediaDevices?.addEventListener('devicechange', async () => {
      try {
        await this.updateDevices();
      } catch (error) {
        this.notifyError(error as Error);
      }
    });
  }

  private async updateDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.state.devices = devices;
      this.notifyDeviceChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  private async updatePermissions(): Promise<void> {
    try {
      const videoPermission = await navigator.permissions.query({ name: 'camera' });
      const audioPermission = await navigator.permissions.query({ name: 'microphone' });

      this.state.permissions = {
        video: videoPermission.state,
        audio: audioPermission.state
      };

      videoPermission.addEventListener('change', () => {
        this.state.permissions.video = videoPermission.state;
        this.notifyPermissionChange();
      });

      audioPermission.addEventListener('change', () => {
        this.state.permissions.audio = audioPermission.state;
        this.notifyPermissionChange();
      });

      this.notifyPermissionChange();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  private notifyDeviceChange(): void {
    this.onDeviceChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyPermissionChange(): void {
    this.onPermissionChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  async requestPermissions(options: { video?: boolean; audio?: boolean } = {}): Promise<void> {
    try {
      // Request permissions by attempting to access the devices
      await navigator.mediaDevices.getUserMedia({
        video: options.video ?? false,
        audio: options.audio ?? false
      });

      await this.updatePermissions();
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }

  getDevices(): MediaDeviceInfo[] {
    return this.state.devices;
  }

  getVideoDevices(): MediaDeviceInfo[] {
    return this.state.devices.filter(device => device.kind === 'videoinput');
  }

  getAudioInputDevices(): MediaDeviceInfo[] {
    return this.state.devices.filter(device => device.kind === 'audioinput');
  }

  getAudioOutputDevices(): MediaDeviceInfo[] {
    return this.state.devices.filter(device => device.kind === 'audiooutput');
  }

  getPermissions(): { video: PermissionState; audio: PermissionState } {
    return this.state.permissions;
  }

  hasVideoPermission(): boolean {
    return this.state.permissions.video === 'granted';
  }

  hasAudioPermission(): boolean {
    return this.state.permissions.audio === 'granted';
  }

  onDeviceChange(callback: MediaDevicesCallback): () => void {
    this.onDeviceChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onDeviceChangeCallbacks.delete(callback);
    };
  }

  onPermissionChange(callback: MediaDevicesCallback): () => void {
    this.onPermissionChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onPermissionChangeCallbacks.delete(callback);
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
    this.onDeviceChangeCallbacks.clear();
    this.onPermissionChangeCallbacks.clear();
    this.onErrorCallbacks.clear();

    if (typeof window !== 'undefined') {
      navigator.mediaDevices?.removeEventListener('devicechange', this.updateDevices);
    }
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'mediaDevices' in navigator &&
      'enumerateDevices' in navigator.mediaDevices &&
      'permissions' in navigator;
  }

  static async checkDeviceSupport(): Promise<{
    video: boolean;
    audio: boolean;
    audioOutput: boolean;
  }> {
    if (!MediaDevicesManager.isSupported()) {
      return {
        video: false,
        audio: false,
        audioOutput: false
      };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        video: devices.some(device => device.kind === 'videoinput'),
        audio: devices.some(device => device.kind === 'audioinput'),
        audioOutput: devices.some(device => device.kind === 'audiooutput')
      };
    } catch (error) {
      console.error('Failed to check device support:', error);
      return {
        video: false,
        audio: false,
        audioOutput: false
      };
    }
  }
}

// Example usage:
/*
const mediaDevices = MediaDevicesManager.getInstance();

// Check if MediaDevices API is supported
console.log('MediaDevices API supported:', MediaDevicesManager.isSupported());

// Check device support
MediaDevicesManager.checkDeviceSupport().then(support => {
  console.log('Device support:', support);
});

// Set up device change listener
const deviceCleanup = mediaDevices.onDeviceChange(state => {
  console.log('Devices changed:', state.devices);
});

// Set up permission change listener
const permissionCleanup = mediaDevices.onPermissionChange(state => {
  console.log('Permissions changed:', state.permissions);
});

// Set up error listener
const errorCleanup = mediaDevices.onError(error => {
  console.error('Media devices error:', error);
});

// Request permissions
mediaDevices.requestPermissions({ video: true, audio: true })
  .then(() => {
    console.log('Permissions granted');

    // Get available devices
    console.log('All devices:', mediaDevices.getDevices());
    console.log('Video devices:', mediaDevices.getVideoDevices());
    console.log('Audio input devices:', mediaDevices.getAudioInputDevices());
    console.log('Audio output devices:', mediaDevices.getAudioOutputDevices());

    // Check permissions
    console.log('Has video permission:', mediaDevices.hasVideoPermission());
    console.log('Has audio permission:', mediaDevices.hasAudioPermission());

    // Clean up after 10 seconds
    setTimeout(() => {
      deviceCleanup();
      permissionCleanup();
      errorCleanup();
      mediaDevices.cleanup();
    }, 10000);
  })
  .catch(error => {
    console.error('Failed to request permissions:', error);
  });
*/