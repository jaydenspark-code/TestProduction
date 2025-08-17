type MediaDecodingConfig = {
  video?: VideoDecodingConfig;
  audio?: AudioDecodingConfig;
};

type VideoDecodingConfig = {
  codec: string;
  codedWidth?: number;
  codedHeight?: number;
  displayWidth?: number;
  displayHeight?: number;
  description?: Uint8Array;
};

type AudioDecodingConfig = {
  codec: string;
  sampleRate?: number;
  numberOfChannels?: number;
  description?: Uint8Array;
};

type DecodingProgress = {
  type: 'video' | 'audio';
  timestamp: number;
  totalChunks?: number;
  processedChunks?: number;
  totalFrames?: number;
  processedFrames?: number;
  totalSamples?: number;
  processedSamples?: number;
  progress: number;
};

type DecodingError = {
  code: string;
  message: string;
  details?: any;
};

type DecodingResult = {
  type: 'video' | 'audio';
  frames: VideoFrame[] | AudioData[];
  duration: number;
  config: VideoDecodingConfig | AudioDecodingConfig;
};

type DecodingCallback = (progress: DecodingProgress) => void;
type ErrorCallback = (error: DecodingError) => void;
type CompleteCallback = (result: DecodingResult) => void;
type FrameCallback = (frame: VideoFrame | AudioData) => void;

export class MediaDecodingManager {
  private static instance: MediaDecodingManager;
  private videoDecoder: VideoDecoder | null;
  private audioDecoder: AudioDecoder | null;
  private onProgressCallbacks: Set<DecodingCallback>;
  private onErrorCallbacks: Set<ErrorCallback>;
  private onCompleteCallbacks: Set<CompleteCallback>;
  private onFrameCallbacks: Set<FrameCallback>;

  private constructor() {
    this.videoDecoder = null;
    this.audioDecoder = null;
    this.onProgressCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.onCompleteCallbacks = new Set();
    this.onFrameCallbacks = new Set();
  }

  static getInstance(): MediaDecodingManager {
    if (!MediaDecodingManager.instance) {
      MediaDecodingManager.instance = new MediaDecodingManager();
    }
    return MediaDecodingManager.instance;
  }

  private notifyProgress(progress: DecodingProgress): void {
    this.onProgressCallbacks.forEach(callback => callback(progress));
  }

  private notifyError(error: DecodingError): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private notifyComplete(result: DecodingResult): void {
    this.onCompleteCallbacks.forEach(callback => callback(result));
  }

  private notifyFrame(frame: VideoFrame | AudioData): void {
    this.onFrameCallbacks.forEach(callback => callback(frame));
  }

  async decodeVideo(data: Uint8Array | ReadableStream<Uint8Array>, config: VideoDecodingConfig): Promise<void> {
    if (!this.isVideoDecodingSupported(config.codec)) {
      throw new Error(`Video codec ${config.codec} is not supported`);
    }

    try {
      const frames: VideoFrame[] = [];
      let totalChunks = 0;
      let processedChunks = 0;
      let processedFrames = 0;

      this.videoDecoder = new VideoDecoder({
        output: frame => {
          frames.push(frame);
          processedFrames++;
          this.notifyFrame(frame);

          this.notifyProgress({
            type: 'video',
            timestamp: performance.now(),
            totalChunks,
            processedChunks,
            totalFrames: totalChunks,
            processedFrames,
            progress: processedChunks / totalChunks
          });
        },
        error: e => {
          this.notifyError({
            code: 'VIDEO_DECODING_ERROR',
            message: e.message
          });
        }
      });

      await this.videoDecoder.configure(config);

      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        while (true) {
          const { value: chunk, done } = await reader.read();
          if (done) break;
          totalChunks++;
          await this.videoDecoder.decode(chunk);
          processedChunks++;
        }
      } else {
        totalChunks = 1;
        await this.videoDecoder.decode(data);
        processedChunks = 1;
      }

      await this.videoDecoder.flush();

      this.notifyComplete({
        type: 'video',
        frames,
        duration: frames.reduce((total, frame) => total + frame.duration ?? 0, 0) / 1000,
        config
      });

    } catch (error) {
      this.notifyError({
        code: 'VIDEO_DECODING_FAILED',
        message: error.message,
        details: error
      });
    } finally {
      if (this.videoDecoder) {
        this.videoDecoder.close();
        this.videoDecoder = null;
      }
    }
  }

  async decodeAudio(data: Uint8Array | ReadableStream<Uint8Array>, config: AudioDecodingConfig): Promise<void> {
    if (!this.isAudioDecodingSupported(config.codec)) {
      throw new Error(`Audio codec ${config.codec} is not supported`);
    }

    try {
      const audioData: AudioData[] = [];
      let totalChunks = 0;
      let processedChunks = 0;
      let processedSamples = 0;

      this.audioDecoder = new AudioDecoder({
        output: data => {
          audioData.push(data);
          processedSamples += data.numberOfFrames;
          this.notifyFrame(data);

          this.notifyProgress({
            type: 'audio',
            timestamp: performance.now(),
            totalChunks,
            processedChunks,
            totalSamples: processedSamples,
            processedSamples,
            progress: processedChunks / totalChunks
          });
        },
        error: e => {
          this.notifyError({
            code: 'AUDIO_DECODING_ERROR',
            message: e.message
          });
        }
      });

      await this.audioDecoder.configure(config);

      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        while (true) {
          const { value: chunk, done } = await reader.read();
          if (done) break;
          totalChunks++;
          await this.audioDecoder.decode(chunk);
          processedChunks++;
        }
      } else {
        totalChunks = 1;
        await this.audioDecoder.decode(data);
        processedChunks = 1;
      }

      await this.audioDecoder.flush();

      this.notifyComplete({
        type: 'audio',
        frames: audioData,
        duration: audioData.reduce((total, data) => total + data.duration ?? 0, 0) / 1000,
        config
      });

    } catch (error) {
      this.notifyError({
        code: 'AUDIO_DECODING_FAILED',
        message: error.message,
        details: error
      });
    } finally {
      if (this.audioDecoder) {
        this.audioDecoder.close();
        this.audioDecoder = null;
      }
    }
  }

  isVideoDecodingSupported(codec: string): boolean {
    return VideoDecoder.isConfigSupported({
      codec,
      codedWidth: 1280,
      codedHeight: 720
    }).then(support => support.supported)
      .catch(() => false);
  }

  isAudioDecodingSupported(codec: string): boolean {
    return AudioDecoder.isConfigSupported({
      codec,
      sampleRate: 48000,
      numberOfChannels: 2
    }).then(support => support.supported)
      .catch(() => false);
  }

  getSupportedVideoCodecs(): Promise<string[]> {
    const codecs = ['avc1.42E01F', 'vp8', 'vp9', 'av1'];
    return Promise.all(
      codecs.map(codec =>
        this.isVideoDecodingSupported(codec).then(supported => supported ? codec : null)
      )
    ).then(results => results.filter((codec): codec is string => codec !== null));
  }

  getSupportedAudioCodecs(): Promise<string[]> {
    const codecs = ['opus', 'aac', 'vorbis'];
    return Promise.all(
      codecs.map(codec =>
        this.isAudioDecodingSupported(codec).then(supported => supported ? codec : null)
      )
    ).then(results => results.filter((codec): codec is string => codec !== null));
  }

  onProgress(callback: DecodingCallback): () => void {
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

  onFrame(callback: FrameCallback): () => void {
    this.onFrameCallbacks.add(callback);
    return () => {
      this.onFrameCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    if (this.videoDecoder) {
      this.videoDecoder.close();
      this.videoDecoder = null;
    }
    if (this.audioDecoder) {
      this.audioDecoder.close();
      this.audioDecoder = null;
    }
    this.onProgressCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.onCompleteCallbacks.clear();
    this.onFrameCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'VideoDecoder' in window &&
      'AudioDecoder' in window;
  }
}

// Example usage:
/*
const decoder = MediaDecodingManager.getInstance();

// Check if media decoding is supported
console.log('Media Decoding supported:', MediaDecodingManager.isSupported());

// Get supported codecs
Promise.all([
  decoder.getSupportedVideoCodecs(),
  decoder.getSupportedAudioCodecs()
]).then(([videoCodecs, audioCodecs]) => {
  console.log('Supported video codecs:', videoCodecs);
  console.log('Supported audio codecs:', audioCodecs);
});

// Set up listeners
const progressCleanup = decoder.onProgress(progress => {
  console.log(`${progress.type} decoding progress:`, progress.progress);
});

const errorCleanup = decoder.onError(error => {
  console.error('Decoding error:', error);
});

const completeCleanup = decoder.onComplete(result => {
  console.log(`${result.type} decoding complete:`, result);
});

const frameCleanup = decoder.onFrame(frame => {
  console.log('Decoded frame:', frame);
});

// Example: Decode a video file
fetch('video.webm')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    decoder.decodeVideo(new Uint8Array(buffer), {
      codec: 'vp8',
      codedWidth: 1280,
      codedHeight: 720
    });
  })
  .catch(error => {
    console.error('Failed to decode video:', error);
  });

// Example: Decode an audio file
fetch('audio.opus')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    decoder.decodeAudio(new Uint8Array(buffer), {
      codec: 'opus',
      sampleRate: 48000,
      numberOfChannels: 2
    });
  })
  .catch(error => {
    console.error('Failed to decode audio:', error);
  });

// Clean up after 10 seconds
setTimeout(() => {
  progressCleanup();
  errorCleanup();
  completeCleanup();
  frameCleanup();
  decoder.cleanup();
}, 10000);
*/