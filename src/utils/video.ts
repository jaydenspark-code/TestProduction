type VideoOptions = {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  poster?: string;
  playbackRate?: number;
  volume?: number;
};

type VideoFilter = {
  brightness?: number; // -1 to 1
  contrast?: number; // -1 to 1
  saturate?: number; // 0 to 2
  hueRotate?: number; // 0 to 360
  blur?: number; // px
};

type VideoEvent = {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onError?: (error: Error) => void;
  onLoadedMetadata?: (duration: number, videoWidth: number, videoHeight: number) => void;
  onProgress?: (buffered: TimeRanges) => void;
  onRateChange?: (playbackRate: number) => void;
  onSeeking?: () => void;
  onSeeked?: () => void;
};

export class VideoManager {
  private static instance: VideoManager;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private filters: VideoFilter = {};
  private events: VideoEvent = {};
  private frameRequestId: number | null = null;

  private constructor() {}

  static getInstance(): VideoManager {
    if (!VideoManager.instance) {
      VideoManager.instance = new VideoManager();
    }
    return VideoManager.instance;
  }

  // Initialize video element with options
  initialize(videoElement: HTMLVideoElement, options: VideoOptions = {}): void {
    this.video = videoElement;
    this.setupVideoOptions(options);
    this.setupCanvas();
    this.applyFilters();
  }

  // Setup video options
  private setupVideoOptions(options: VideoOptions): void {
    if (!this.video) return;

    Object.entries(options).forEach(([key, value]) => {
      if (key === 'volume') {
        this.setVolume(value as number);
      } else if (key === 'playbackRate') {
        this.setPlaybackRate(value as number);
      } else {
        (this.video as any)[key] = value;
      }
    });
  }

  // Setup canvas for video filters
  private setupCanvas(): void {
    if (!this.video) return;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // Match canvas size to video
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
  }

  // Set event handlers
  setEvents(events: VideoEvent): void {
    if (!this.video) return;

    this.events = events;

    // Remove existing listeners
    this.removeEventListeners();

    // Add new listeners
    if (events.onPlay) this.video.addEventListener('play', events.onPlay);
    if (events.onPause) this.video.addEventListener('pause', events.onPause);
    if (events.onEnded) this.video.addEventListener('ended', events.onEnded);
    if (events.onTimeUpdate) {
      this.video.addEventListener('timeupdate', () => {
        events.onTimeUpdate?.(this.video!.currentTime);
      });
    }
    if (events.onVolumeChange) {
      this.video.addEventListener('volumechange', () => {
        events.onVolumeChange?.(this.video!.volume, this.video!.muted);
      });
    }
    if (events.onError) {
      this.video.addEventListener('error', () => {
        events.onError?.(new Error('Video playback error'));
      });
    }
    if (events.onLoadedMetadata) {
      this.video.addEventListener('loadedmetadata', () => {
        events.onLoadedMetadata?.(
          this.video!.duration,
          this.video!.videoWidth,
          this.video!.videoHeight
        );
      });
    }
    if (events.onProgress) {
      this.video.addEventListener('progress', () => {
        events.onProgress?.(this.video!.buffered);
      });
    }
    if (events.onRateChange) {
      this.video.addEventListener('ratechange', () => {
        events.onRateChange?.(this.video!.playbackRate);
      });
    }
    if (events.onSeeking) this.video.addEventListener('seeking', events.onSeeking);
    if (events.onSeeked) this.video.addEventListener('seeked', events.onSeeked);
  }

  // Remove event listeners
  private removeEventListeners(): void {
    if (!this.video) return;

    const events = this.events;
    if (events.onPlay) this.video.removeEventListener('play', events.onPlay);
    if (events.onPause) this.video.removeEventListener('pause', events.onPause);
    if (events.onEnded) this.video.removeEventListener('ended', events.onEnded);
    // ... remove other listeners similarly
  }

  // Set video source
  setSource(src: string): void {
    if (!this.video) return;
    this.video.src = src;
  }

  // Play video
  play(): Promise<void> | void {
    if (!this.video) return;
    return this.video.play();
  }

  // Pause video
  pause(): void {
    if (!this.video) return;
    this.video.pause();
  }

  // Seek to specific time
  seek(time: number): void {
    if (!this.video) return;
    this.video.currentTime = Math.max(0, Math.min(time, this.video.duration));
  }

  // Set volume (0 to 1)
  setVolume(volume: number): void {
    if (!this.video) return;
    this.video.volume = Math.max(0, Math.min(volume, 1));
  }

  // Set playback rate
  setPlaybackRate(rate: number): void {
    if (!this.video) return;
    this.video.playbackRate = rate;
  }

  // Toggle mute
  toggleMute(): void {
    if (!this.video) return;
    this.video.muted = !this.video.muted;
  }

  // Get current time
  getCurrentTime(): number {
    return this.video?.currentTime || 0;
  }

  // Get duration
  getDuration(): number {
    return this.video?.duration || 0;
  }

  // Get buffered ranges
  getBuffered(): TimeRanges | null {
    return this.video?.buffered || null;
  }

  // Check if video is playing
  isPlaying(): boolean {
    return this.video ? !this.video.paused : false;
  }

  // Set video filters
  setFilters(filters: VideoFilter): void {
    this.filters = filters;
    this.applyFilters();
  }

  // Apply video filters
  private applyFilters(): void {
    if (!this.video || !this.canvas || !this.context) return;

    // Stop existing animation frame
    if (this.frameRequestId !== null) {
      cancelAnimationFrame(this.frameRequestId);
    }

    const renderFrame = () => {
      if (!this.video || !this.canvas || !this.context) return;

      // Draw video frame to canvas
      this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Apply filters
      const filters: string[] = [];
      if (this.filters.brightness !== undefined) {
        filters.push(`brightness(${100 + this.filters.brightness * 100}%)`);
      }
      if (this.filters.contrast !== undefined) {
        filters.push(`contrast(${100 + this.filters.contrast * 100}%)`);
      }
      if (this.filters.saturate !== undefined) {
        filters.push(`saturate(${this.filters.saturate * 100}%)`);
      }
      if (this.filters.hueRotate !== undefined) {
        filters.push(`hue-rotate(${this.filters.hueRotate}deg)`);
      }
      if (this.filters.blur !== undefined) {
        filters.push(`blur(${this.filters.blur}px)`);
      }

      this.context.filter = filters.join(' ');

      // Request next frame
      this.frameRequestId = requestAnimationFrame(renderFrame);
    };

    // Start rendering
    renderFrame();
  }

  // Take screenshot
  takeScreenshot(): string {
    if (!this.video || !this.canvas || !this.context) return '';

    // Draw current frame
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Get data URL
    return this.canvas.toDataURL('image/png');
  }

  // Extract frame at specific time
  async extractFrame(time: number): Promise<string> {
    if (!this.video) return '';

    // Save current time
    const currentTime = this.video.currentTime;

    // Seek to desired time
    this.video.currentTime = time;

    // Wait for seek to complete
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        this.video?.removeEventListener('seeked', onSeeked);
        resolve();
      };
      this.video?.addEventListener('seeked', onSeeked);
    });

    // Take screenshot
    const screenshot = this.takeScreenshot();

    // Restore original time
    this.video.currentTime = currentTime;

    return screenshot;
  }

  // Clean up resources
  cleanup(): void {
    if (this.frameRequestId !== null) {
      cancelAnimationFrame(this.frameRequestId);
    }
    this.removeEventListeners();
    this.video = null;
    this.canvas = null;
    this.context = null;
    this.filters = {};
    this.events = {};
  }

  // Check if video is supported
  static isSupported(): boolean {
    const video = document.createElement('video');
    return !!video.canPlayType;
  }
}

// Example usage:
/*
// Create video manager instance
const videoManager = VideoManager.getInstance();

// Check if video is supported
if (VideoManager.isSupported()) {
  // Initialize with video element and options
  const videoElement = document.getElementById('video') as HTMLVideoElement;
  videoManager.initialize(videoElement, {
    autoplay: true,
    muted: true,
    loop: true,
    controls: false,
    volume: 0.5
  });

  // Set event handlers
  videoManager.setEvents({
    onPlay: () => console.log('Video started playing'),
    onPause: () => console.log('Video paused'),
    onTimeUpdate: (currentTime) => console.log('Current time:', currentTime),
    onError: (error) => console.error('Video error:', error)
  });

  // Set video source
  videoManager.setSource('video.mp4');

  // Apply filters
  videoManager.setFilters({
    brightness: 0.2,
    contrast: 0.1,
    saturate: 1.2
  });

  // Take screenshot
  const screenshot = videoManager.takeScreenshot();

  // Extract frame at 5 seconds
  videoManager.extractFrame(5).then(frame => {
    console.log('Frame at 5s:', frame);
  });

  // Clean up when done
  videoManager.cleanup();
}
*/