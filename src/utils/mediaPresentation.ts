type PresentationConfig = {
  maxPresentations?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultMode?: PresentationMode;
  defaultOrientation?: ScreenOrientation;
};

type PresentationMode = 'fullscreen' | 'picture-in-picture' | 'inline';
type ScreenOrientation = 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';

type PresentationItem = {
  id: string;
  element: HTMLElement;
  mode: PresentationMode;
  width: number;
  height: number;
  orientation: ScreenOrientation;
  timestamp: number;
  metadata: Record<string, any>;
};

type PresentationEvent = {
  type: 'start' | 'stop' | 'change' | 'error' | 'cleanup';
  presentationId?: string;
  timestamp: number;
  details: any;
};

type PresentationEventCallback = (event: PresentationEvent) => void;

export class MediaPresentationManager {
  private static instance: MediaPresentationManager;
  private config: PresentationConfig;
  private presentations: Map<string, PresentationItem>;
  private onPresentationEventCallbacks: Set<PresentationEventCallback>;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.presentations = new Map();
    this.onPresentationEventCallbacks = new Set();
  }

  static getInstance(): MediaPresentationManager {
    if (!MediaPresentationManager.instance) {
      MediaPresentationManager.instance = new MediaPresentationManager();
    }
    return MediaPresentationManager.instance;
  }

  private notifyPresentationEvent(event: PresentationEvent): void {
    this.onPresentationEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): PresentationConfig {
    return {
      maxPresentations: 5,
      autoCleanup: true,
      cleanupThreshold: 0.8,
      defaultWidth: 1280,
      defaultHeight: 720,
      defaultMode: 'inline',
      defaultOrientation: 'any'
    };
  }

  configure(config: Partial<PresentationConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.presentations.size > this.config.maxPresentations! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private async requestFullscreen(element: HTMLElement): Promise<void> {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  }

  private async exitFullscreen(): Promise<void> {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  }

  private async requestPictureInPicture(element: HTMLVideoElement): Promise<void> {
    if (document.pictureInPictureEnabled && !document.pictureInPictureElement) {
      await element.requestPictureInPicture();
    }
  }

  private async exitPictureInPicture(): Promise<void> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
  }

  private async setOrientation(orientation: ScreenOrientation): Promise<void> {
    if ('screen' in window && 'orientation' in screen) {
      const screenOrientation = screen.orientation;
      if (orientation !== 'any') {
        try {
          await screenOrientation.lock(orientation);
        } catch (error) {
          this.notifyPresentationEvent({
            type: 'error',
            timestamp: performance.now(),
            details: { error, message: 'Failed to lock screen orientation' }
          });
        }
      } else {
        await screenOrientation.unlock();
      }
    }
  }

  async startPresentation(
    element: HTMLElement,
    options: {
      mode?: PresentationMode;
      width?: number;
      height?: number;
      orientation?: ScreenOrientation;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const id = crypto.randomUUID();
    const currentTime = performance.now();

    const presentation: PresentationItem = {
      id,
      element,
      mode: options.mode || this.config.defaultMode!,
      width: options.width || this.config.defaultWidth!,
      height: options.height || this.config.defaultHeight!,
      orientation: options.orientation || this.config.defaultOrientation!,
      timestamp: currentTime,
      metadata: options.metadata || {}
    };

    try {
      switch (presentation.mode) {
        case 'fullscreen':
          await this.requestFullscreen(element);
          break;

        case 'picture-in-picture':
          if (element instanceof HTMLVideoElement) {
            await this.requestPictureInPicture(element);
          } else {
            throw new Error('Picture-in-Picture mode is only supported for video elements');
          }
          break;
      }

      await this.setOrientation(presentation.orientation);

      element.style.width = `${presentation.width}px`;
      element.style.height = `${presentation.height}px`;

      this.presentations.set(id, presentation);

      this.notifyPresentationEvent({
        type: 'start',
        presentationId: id,
        timestamp: currentTime,
        details: { presentation }
      });

      if (this.presentations.size > this.config.maxPresentations! && this.config.autoCleanup) {
        this.cleanup();
      }

      return id;
    } catch (error) {
      this.notifyPresentationEvent({
        type: 'error',
        presentationId: id,
        timestamp: performance.now(),
        details: { error, presentation }
      });
      throw error;
    }
  }

  async stopPresentation(id: string): Promise<boolean> {
    const presentation = this.presentations.get(id);

    if (presentation) {
      try {
        switch (presentation.mode) {
          case 'fullscreen':
            await this.exitFullscreen();
            break;

          case 'picture-in-picture':
            if (presentation.element instanceof HTMLVideoElement) {
              await this.exitPictureInPicture();
            }
            break;
        }

        if (presentation.orientation !== 'any') {
          await this.setOrientation('any');
        }

        this.presentations.delete(id);

        this.notifyPresentationEvent({
          type: 'stop',
          presentationId: id,
          timestamp: performance.now(),
          details: { presentation }
        });

        return true;
      } catch (error) {
        this.notifyPresentationEvent({
          type: 'error',
          presentationId: id,
          timestamp: performance.now(),
          details: { error, presentation }
        });
        throw error;
      }
    }

    return false;
  }

  async updatePresentation(
    id: string,
    options: {
      mode?: PresentationMode;
      width?: number;
      height?: number;
      orientation?: ScreenOrientation;
      metadata?: Record<string, any>;
    }
  ): Promise<boolean> {
    const presentation = this.presentations.get(id);

    if (presentation) {
      try {
        const oldMode = presentation.mode;
        const oldOrientation = presentation.orientation;

        if (options.mode && options.mode !== oldMode) {
          if (oldMode === 'fullscreen') {
            await this.exitFullscreen();
          } else if (oldMode === 'picture-in-picture' && presentation.element instanceof HTMLVideoElement) {
            await this.exitPictureInPicture();
          }

          if (options.mode === 'fullscreen') {
            await this.requestFullscreen(presentation.element);
          } else if (options.mode === 'picture-in-picture' && presentation.element instanceof HTMLVideoElement) {
            await this.requestPictureInPicture(presentation.element);
          }

          presentation.mode = options.mode;
        }

        if (options.orientation && options.orientation !== oldOrientation) {
          await this.setOrientation(options.orientation);
          presentation.orientation = options.orientation;
        }

        if (options.width) {
          presentation.width = options.width;
          presentation.element.style.width = `${options.width}px`;
        }

        if (options.height) {
          presentation.height = options.height;
          presentation.element.style.height = `${options.height}px`;
        }

        if (options.metadata) {
          presentation.metadata = { ...presentation.metadata, ...options.metadata };
        }

        this.notifyPresentationEvent({
          type: 'change',
          presentationId: id,
          timestamp: performance.now(),
          details: { presentation, changes: options }
        });

        return true;
      } catch (error) {
        this.notifyPresentationEvent({
          type: 'error',
          presentationId: id,
          timestamp: performance.now(),
          details: { error, presentation }
        });
        throw error;
      }
    }

    return false;
  }

  getPresentation(id: string): PresentationItem | undefined {
    return this.presentations.get(id);
  }

  getAllPresentations(): PresentationItem[] {
    return Array.from(this.presentations.values());
  }

  getPresentationCount(): number {
    return this.presentations.size;
  }

  cleanup(): void {
    if (this.presentations.size <= this.config.maxPresentations! * this.config.cleanupThreshold!) {
      return;
    }

    const presentationsToRemove = Array.from(this.presentations.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, this.presentations.size - this.config.maxPresentations!);

    for (const presentation of presentationsToRemove) {
      this.stopPresentation(presentation.id).catch(error => {
        this.notifyPresentationEvent({
          type: 'error',
          presentationId: presentation.id,
          timestamp: performance.now(),
          details: { error, presentation }
        });
      });
    }

    this.notifyPresentationEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: presentationsToRemove.length }
    });
  }

  onPresentationEvent(callback: PresentationEventCallback): () => void {
    this.onPresentationEventCallbacks.add(callback);
    return () => {
      this.onPresentationEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'HTMLElement' in window &&
      'requestFullscreen' in HTMLElement.prototype &&
      'pictureInPictureEnabled' in document &&
      'screen' in window &&
      'orientation' in screen &&
      'crypto' in window &&
      'performance' in window;
  }
}

// Example usage:
/*
const presentationManager = MediaPresentationManager.getInstance();

// Check if media presentation is supported
console.log('Media Presentation supported:', MediaPresentationManager.isSupported());

// Configure presentation manager
presentationManager.configure({
  maxPresentations: 3,
  autoCleanup: true,
  cleanupThreshold: 0.8,
  defaultWidth: 1920,
  defaultHeight: 1080,
  defaultMode: 'inline',
  defaultOrientation: 'landscape'
});

// Set up event listener
const eventCleanup = presentationManager.onPresentationEvent(event => {
  console.log('Presentation event:', event);
});

// Create video element
const video = document.createElement('video');
video.src = 'example.mp4';
video.controls = true;
document.body.appendChild(video);

// Start presentation
const presentationId = await presentationManager.startPresentation(video, {
  mode: 'fullscreen',
  width: 1920,
  height: 1080,
  orientation: 'landscape',
  metadata: { name: 'Example Video' }
});

// Update presentation after 5 seconds
setTimeout(async () => {
  await presentationManager.updatePresentation(presentationId, {
    mode: 'picture-in-picture',
    width: 480,
    height: 270,
    metadata: { updated: true }
  });
}, 5000);

// Stop presentation after 10 seconds
setTimeout(async () => {
  await presentationManager.stopPresentation(presentationId);
  video.remove();
}, 10000);

// Remove event listener
eventCleanup();
*/