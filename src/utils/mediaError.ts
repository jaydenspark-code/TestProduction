type MediaErrorState = {
  errors: Map<string, MediaError>;
  lastError: MediaError | null;
};

type MediaErrorCallback = (state: MediaErrorState) => void;

export class MediaErrorManager {
  private static instance: MediaErrorManager;
  private state: MediaErrorState;
  private onErrorCallbacks: Set<MediaErrorCallback>;

  private constructor() {
    this.state = {
      errors: new Map(),
      lastError: null
    };
    this.onErrorCallbacks = new Set();
  }

  static getInstance(): MediaErrorManager {
    if (!MediaErrorManager.instance) {
      MediaErrorManager.instance = new MediaErrorManager();
    }
    return MediaErrorManager.instance;
  }

  private notifyError(): void {
    this.onErrorCallbacks.forEach(callback => callback(this.state));
  }

  handleError(error: MediaError, source: string): void {
    this.state.errors.set(source, error);
    this.state.lastError = error;
    this.notifyError();
  }

  getError(source: string): MediaError | undefined {
    return this.state.errors.get(source);
  }

  getLastError(): MediaError | null {
    return this.state.lastError;
  }

  getAllErrors(): Map<string, MediaError> {
    return new Map(this.state.errors);
  }

  clearError(source: string): void {
    this.state.errors.delete(source);
    this.state.lastError = null;
    this.notifyError();
  }

  clearAllErrors(): void {
    this.state.errors.clear();
    this.state.lastError = null;
    this.notifyError();
  }

  getErrorDescription(error: MediaError): string {
    let description = '';

    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        description = 'The fetching of the associated resource was aborted by the user\'s request.';
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        description = 'A network error occurred while fetching the associated resource.';
        break;
      case MediaError.MEDIA_ERR_DECODE:
        description = 'An error occurred while decoding the associated resource.';
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        description = 'The associated resource or media type is not supported.';
        break;
      default:
        description = 'An unknown error occurred.';
    }

    if (error.message) {
      description += ` Additional information: ${error.message}`;
    }

    return description;
  }

  getErrorSeverity(error: MediaError): 'low' | 'medium' | 'high' {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'low';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'medium';
      case MediaError.MEDIA_ERR_DECODE:
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'high';
      default:
        return 'medium';
    }
  }

  isRecoverable(error: MediaError): boolean {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
      case MediaError.MEDIA_ERR_NETWORK:
        return true;
      case MediaError.MEDIA_ERR_DECODE:
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return false;
      default:
        return false;
    }
  }

  getSuggestedAction(error: MediaError): string {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Try playing the media again.';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Check your internet connection and try again.';
      case MediaError.MEDIA_ERR_DECODE:
        return 'The media file might be corrupted. Try with a different file.';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'The media format is not supported by your browser. Try converting to a different format.';
      default:
        return 'Try refreshing the page or using a different browser.';
    }
  }

  onError(callback: MediaErrorCallback): () => void {
    this.onErrorCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.state.errors.clear();
    this.state.lastError = null;
    this.onErrorCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'MediaError' in window;
  }
}

// Example usage:
/*
const errorManager = MediaErrorManager.getInstance();

// Check if MediaError is supported
console.log('MediaError supported:', MediaErrorManager.isSupported());

// Set up error listener
const errorCleanup = errorManager.onError(state => {
  console.log('Media error state changed:', state);
});

// Create a video element
const video = document.createElement('video');

// Handle video error
video.addEventListener('error', () => {
  if (video.error) {
    errorManager.handleError(video.error, 'video-player');

    const error = errorManager.getLastError();
    if (error) {
      console.log('Error description:', errorManager.getErrorDescription(error));
      console.log('Error severity:', errorManager.getErrorSeverity(error));
      console.log('Is recoverable:', errorManager.isRecoverable(error));
      console.log('Suggested action:', errorManager.getSuggestedAction(error));
    }
  }
});

// Set an invalid source to trigger an error
video.src = 'invalid-url';

// Clean up after 10 seconds
setTimeout(() => {
  errorCleanup();
  errorManager.cleanup();
}, 10000);
*/