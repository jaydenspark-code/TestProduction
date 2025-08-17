import { MediaEncodingManager } from './mediaEncoding';
import { MediaDecodingManager } from './mediaDecoding';

type TranscodingConfig = {
  input: {
    video?: {
      codec: string;
    };
    audio?: {
      codec: string;
    };
  };
  output: {
    video?: {
      codec: string;
      width?: number;
      height?: number;
      bitrate?: number;
      framerate?: number;
      keyFrameInterval?: number;
      latencyMode?: 'realtime' | 'quality';
    };
    audio?: {
      codec: string;
      sampleRate?: number;
      bitrate?: number;
      channels?: number;
      sampleSize?: number;
    };
  };
};

type TranscodingProgress = {
  type: 'video' | 'audio';
  stage: 'decoding' | 'encoding';
  timestamp: number;
  progress: number;
};

type TranscodingError = {
  code: string;
  message: string;
  stage?: 'decoding' | 'encoding';
  details?: any;
};

type TranscodingResult = {
  type: 'video' | 'audio';
  data: Blob;
  duration: number;
  size: number;
  inputConfig: {
    video?: { codec: string };
    audio?: { codec: string };
  };
  outputConfig: {
    video?: {
      codec: string;
      width?: number;
      height?: number;
      bitrate?: number;
      framerate?: number;
    };
    audio?: {
      codec: string;
      sampleRate?: number;
      bitrate?: number;
      channels?: number;
    };
  };
};

type TranscodingCallback = (progress: TranscodingProgress) => void;
type ErrorCallback = (error: TranscodingError) => void;
type CompleteCallback = (result: TranscodingResult) => void;

export class MediaTranscodingManager {
  private static instance: MediaTranscodingManager;
  private decoder: MediaDecodingManager;
  private encoder: MediaEncodingManager;
  private onProgressCallbacks: Set<TranscodingCallback>;
  private onErrorCallbacks: Set<ErrorCallback>;
  private onCompleteCallbacks: Set<CompleteCallback>;

  private constructor() {
    this.decoder = MediaDecodingManager.getInstance();
    this.encoder = MediaEncodingManager.getInstance();
    this.onProgressCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.onCompleteCallbacks = new Set();
  }

  static getInstance(): MediaTranscodingManager {
    if (!MediaTranscodingManager.instance) {
      MediaTranscodingManager.instance = new MediaTranscodingManager();
    }
    return MediaTranscodingManager.instance;
  }

  private notifyProgress(progress: TranscodingProgress): void {
    this.onProgressCallbacks.forEach(callback => callback(progress));
  }

  private notifyError(error: TranscodingError): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private notifyComplete(result: TranscodingResult): void {
    this.onCompleteCallbacks.forEach(callback => callback(result));
  }

  async transcodeVideo(data: Uint8Array | ReadableStream<Uint8Array>, config: TranscodingConfig): Promise<void> {
    if (!config.input.video || !config.output.video) {
      throw new Error('Video configuration is required for video transcoding');
    }

    try {
      const frames: VideoFrame[] = [];
      let decodingComplete = false;

      // Set up decoder callbacks
      const decodingProgressCleanup = this.decoder.onProgress(progress => {
        if (progress.type === 'video') {
          this.notifyProgress({
            type: 'video',
            stage: 'decoding',
            timestamp: performance.now(),
            progress: progress.progress
          });
        }
      });

      const decodingFrameCleanup = this.decoder.onFrame(frame => {
        if (frame instanceof VideoFrame) {
          frames.push(frame);
        }
      });

      const decodingCompleteCleanup = this.decoder.onComplete(() => {
        decodingComplete = true;
      });

      // Start decoding
      await this.decoder.decodeVideo(data, {
        codec: config.input.video.codec
      });

      if (!decodingComplete) {
        throw new Error('Video decoding failed');
      }

      // Create a MediaStream from decoded frames
      const stream = new MediaStream();
      const track = new MediaStreamTrack(); // This is a simplified example
      stream.addTrack(track);

      // Set up encoder callbacks
      const encodingProgressCleanup = this.encoder.onProgress(progress => {
        if (progress.type === 'video') {
          this.notifyProgress({
            type: 'video',
            stage: 'encoding',
            timestamp: performance.now(),
            progress: progress.progress
          });
        }
      });

      const encodingCompleteCleanup = this.encoder.onComplete(result => {
        if (result.type === 'video') {
          this.notifyComplete({
            type: 'video',
            data: result.data,
            duration: result.duration,
            size: result.size,
            inputConfig: { video: config.input.video },
            outputConfig: { video: config.output.video }
          });
        }
      });

      // Start encoding
      await this.encoder.encodeVideo(stream, config.output.video);

      // Clean up
      decodingProgressCleanup();
      decodingFrameCleanup();
      decodingCompleteCleanup();
      encodingProgressCleanup();
      encodingCompleteCleanup();
      frames.forEach(frame => frame.close());

    } catch (error) {
      this.notifyError({
        code: 'VIDEO_TRANSCODING_FAILED',
        message: error.message,
        details: error
      });
    }
  }

  async transcodeAudio(data: Uint8Array | ReadableStream<Uint8Array>, config: TranscodingConfig): Promise<void> {
    if (!config.input.audio || !config.output.audio) {
      throw new Error('Audio configuration is required for audio transcoding');
    }

    try {
      const audioData: AudioData[] = [];
      let decodingComplete = false;

      // Set up decoder callbacks
      const decodingProgressCleanup = this.decoder.onProgress(progress => {
        if (progress.type === 'audio') {
          this.notifyProgress({
            type: 'audio',
            stage: 'decoding',
            timestamp: performance.now(),
            progress: progress.progress
          });
        }
      });

      const decodingFrameCleanup = this.decoder.onFrame(frame => {
        if (frame instanceof AudioData) {
          audioData.push(frame);
        }
      });

      const decodingCompleteCleanup = this.decoder.onComplete(() => {
        decodingComplete = true;
      });

      // Start decoding
      await this.decoder.decodeAudio(data, {
        codec: config.input.audio.codec
      });

      if (!decodingComplete) {
        throw new Error('Audio decoding failed');
      }

      // Create a MediaStream from decoded audio data
      const stream = new MediaStream();
      const track = new MediaStreamTrack(); // This is a simplified example
      stream.addTrack(track);

      // Set up encoder callbacks
      const encodingProgressCleanup = this.encoder.onProgress(progress => {
        if (progress.type === 'audio') {
          this.notifyProgress({
            type: 'audio',
            stage: 'encoding',
            timestamp: performance.now(),
            progress: progress.progress
          });
        }
      });

      const encodingCompleteCleanup = this.encoder.onComplete(result => {
        if (result.type === 'audio') {
          this.notifyComplete({
            type: 'audio',
            data: result.data,
            duration: result.duration,
            size: result.size,
            inputConfig: { audio: config.input.audio },
            outputConfig: { audio: config.output.audio }
          });
        }
      });

      // Start encoding
      await this.encoder.encodeAudio(stream, config.output.audio);

      // Clean up
      decodingProgressCleanup();
      decodingFrameCleanup();
      decodingCompleteCleanup();
      encodingProgressCleanup();
      encodingCompleteCleanup();
      audioData.forEach(data => data.close());

    } catch (error) {
      this.notifyError({
        code: 'AUDIO_TRANSCODING_FAILED',
        message: error.message,
        details: error
      });
    }
  }

  onProgress(callback: TranscodingCallback): () => void {
    this.onProgressCallbacks.add(callback);
    return () => {
      this.onProgressCallbacks.delete(callback);
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.add(callback);
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  onComplete(callback: CompleteCallback): () => void {
    this.onCompleteCallbacks.add(callback);
    return () => {
      this.onCompleteCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.decoder.cleanup();
    this.encoder.cleanup();
    this.onProgressCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.onCompleteCallbacks.clear();
  }

  static isSupported(): boolean {
    return MediaDecodingManager.isSupported() && MediaEncodingManager.isSupported();
  }
}

// Example usage:
/*
const transcoder = MediaTranscodingManager.getInstance();

// Check if media transcoding is supported
console.log('Media Transcoding supported:', MediaTranscodingManager.isSupported());

// Set up listeners
const progressCleanup = transcoder.onProgress(progress => {
  console.log(`${progress.type} ${progress.stage} progress:`, progress.progress);
});

const errorCleanup = transcoder.onError(error => {
  console.error('Transcoding error:', error);
});

const completeCleanup = transcoder.onComplete(result => {
  console.log(`${result.type} transcoding complete:`, result);
});

// Example: Transcode a video file
fetch('video.webm')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    transcoder.transcodeVideo(new Uint8Array(buffer), {
      input: {
        video: { codec: 'vp8' }
      },
      output: {
        video: {
          codec: 'h264',
          width: 1920,
          height: 1080,
          bitrate: 5_000_000,
          framerate: 30
        }
      }
    });
  })
  .catch(error => {
    console.error('Failed to transcode video:', error);
  });

// Example: Transcode an audio file
fetch('audio.opus')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    transcoder.transcodeAudio(new Uint8Array(buffer), {
      input: {
        audio: { codec: 'opus' }
      },
      output: {
        audio: {
          codec: 'aac',
          sampleRate: 48000,
          channels: 2,
          bitrate: 256000
        }
      }
    });
  })
  .catch(error => {
    console.error('Failed to transcode audio:', error);
  });

// Clean up after 10 seconds
setTimeout(() => {
  progressCleanup();
  errorCleanup();
  completeCleanup();
  transcoder.cleanup();
}, 10000);
*/