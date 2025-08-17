type MediaEncodingConfig = {
  video?: VideoEncodingConfig;
  audio?: AudioEncodingConfig;
};

type VideoEncodingConfig = {
  codec: string;
  width?: number;
  height?: number;
  bitrate?: number;
  framerate?: number;
  keyFrameInterval?: number;
  latencyMode?: 'realtime' | 'quality';
};

type AudioEncodingConfig = {
  codec: string;
  sampleRate?: number;
  bitrate?: number;
  channels?: number;
  sampleSize?: number;
};

type EncodingProgress = {
  type: 'video' | 'audio';
  timestamp: number;
  totalFrames?: number;
  processedFrames?: number;
  totalSamples?: number;
  processedSamples?: number;
  progress: number;
};

type EncodingError = {
  code: string;
  message: string;
  details?: any;
};

type EncodingResult = {
  type: 'video' | 'audio';
  data: Blob;
  duration: number;
  size: number;
  config: VideoEncodingConfig | AudioEncodingConfig;
};

type EncodingCallback = (progress: EncodingProgress) => void;
type ErrorCallback = (error: EncodingError) => void;
type CompleteCallback = (result: EncodingResult) => void;

export class MediaEncodingManager {
  private static instance: MediaEncodingManager;
  private videoEncoder: VideoEncoder | null;
  private audioEncoder: AudioEncoder | null;
  private onProgressCallbacks: Set<EncodingCallback>;
  private onErrorCallbacks: Set<ErrorCallback>;
  private onCompleteCallbacks: Set<CompleteCallback>;

  private constructor() {
    this.videoEncoder = null;
    this.audioEncoder = null;
    this.onProgressCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.onCompleteCallbacks = new Set();
  }

  static getInstance(): MediaEncodingManager {
    if (!MediaEncodingManager.instance) {
      MediaEncodingManager.instance = new MediaEncodingManager();
    }
    return MediaEncodingManager.instance;
  }

  private notifyProgress(progress: EncodingProgress): void {
    this.onProgressCallbacks.forEach(callback => callback(progress));
  }

  private notifyError(error: EncodingError): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private notifyComplete(result: EncodingResult): void {
    this.onCompleteCallbacks.forEach(callback => callback(result));
  }

  async encodeVideo(stream: MediaStream, config: VideoEncodingConfig): Promise<void> {
    if (!this.isVideoEncodingSupported(config.codec)) {
      throw new Error(`Video codec ${config.codec} is not supported`);
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track found in the stream');
      }

      const processor = new MediaStreamTrackProcessor({ track: videoTrack });
      const reader = processor.readable.getReader();

      const chunks: Uint8Array[] = [];
      let totalFrames = 0;
      let processedFrames = 0;

      this.videoEncoder = new VideoEncoder({
        output: chunk => {
          chunks.push(new Uint8Array(chunk.byteLength));
          chunk.copyTo(chunks[chunks.length - 1]);
        },
        error: e => {
          this.notifyError({
            code: 'VIDEO_ENCODING_ERROR',
            message: e.message
          });
        }
      });

      await this.videoEncoder.configure({
        codec: config.codec,
        width: config.width,
        height: config.height,
        bitrate: config.bitrate,
        framerate: config.framerate,
        latencyMode: config.latencyMode
      });

      while (true) {
        const { value: frame, done } = await reader.read();
        if (done) break;

        totalFrames++;
        if (this.videoEncoder.encodeQueueSize < 2) {
          this.videoEncoder.encode(frame);
          processedFrames++;

          this.notifyProgress({
            type: 'video',
            timestamp: performance.now(),
            totalFrames,
            processedFrames,
            progress: processedFrames / totalFrames
          });
        }
        frame.close();
      }

      await this.videoEncoder.flush();
      const blob = new Blob(chunks, { type: `video/${config.codec}` });

      this.notifyComplete({
        type: 'video',
        data: blob,
        duration: totalFrames / (config.framerate || 30),
        size: blob.size,
        config
      });

    } catch (error) {
      this.notifyError({
        code: 'VIDEO_ENCODING_FAILED',
        message: error.message,
        details: error
      });
    } finally {
      if (this.videoEncoder) {
        this.videoEncoder.close();
        this.videoEncoder = null;
      }
    }
  }

  async encodeAudio(stream: MediaStream, config: AudioEncodingConfig): Promise<void> {
    if (!this.isAudioEncodingSupported(config.codec)) {
      throw new Error(`Audio codec ${config.codec} is not supported`);
    }

    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track found in the stream');
      }

      const processor = new MediaStreamTrackProcessor({ track: audioTrack });
      const reader = processor.readable.getReader();

      const chunks: Uint8Array[] = [];
      let totalSamples = 0;
      let processedSamples = 0;

      this.audioEncoder = new AudioEncoder({
        output: chunk => {
          chunks.push(new Uint8Array(chunk.byteLength));
          chunk.copyTo(chunks[chunks.length - 1]);
        },
        error: e => {
          this.notifyError({
            code: 'AUDIO_ENCODING_ERROR',
            message: e.message
          });
        }
      });

      await this.audioEncoder.configure({
        codec: config.codec,
        sampleRate: config.sampleRate,
        numberOfChannels: config.channels,
        bitrate: config.bitrate
      });

      while (true) {
        const { value: audioData, done } = await reader.read();
        if (done) break;

        totalSamples += audioData.numberOfFrames;
        if (this.audioEncoder.encodeQueueSize < 2) {
          this.audioEncoder.encode(audioData);
          processedSamples += audioData.numberOfFrames;

          this.notifyProgress({
            type: 'audio',
            timestamp: performance.now(),
            totalSamples,
            processedSamples,
            progress: processedSamples / totalSamples
          });
        }
        audioData.close();
      }

      await this.audioEncoder.flush();
      const blob = new Blob(chunks, { type: `audio/${config.codec}` });

      this.notifyComplete({
        type: 'audio',
        data: blob,
        duration: totalSamples / (config.sampleRate || 48000),
        size: blob.size,
        config
      });

    } catch (error) {
      this.notifyError({
        code: 'AUDIO_ENCODING_FAILED',
        message: error.message,
        details: error
      });
    } finally {
      if (this.audioEncoder) {
        this.audioEncoder.close();
        this.audioEncoder = null;
      }
    }
  }

  isVideoEncodingSupported(codec: string): boolean {
    return VideoEncoder.isConfigSupported({
      codec,
      width: 1280,
      height: 720
    }).then(support => support.supported)
      .catch(() => false);
  }

  isAudioEncodingSupported(codec: string): boolean {
    return AudioEncoder.isConfigSupported({
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
        this.isVideoEncodingSupported(codec).then(supported => supported ? codec : null)
      )
    ).then(results => results.filter((codec): codec is string => codec !== null));
  }

  getSupportedAudioCodecs(): Promise<string[]> {
    const codecs = ['opus', 'aac', 'vorbis'];
    return Promise.all(
      codecs.map(codec =>
        this.isAudioEncodingSupported(codec).then(supported => supported ? codec : null)
      )
    ).then(results => results.filter((codec): codec is string => codec !== null));
  }

  onProgress(callback: EncodingCallback): () => void {
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
    if (this.videoEncoder) {
      this.videoEncoder.close();
      this.videoEncoder = null;
    }
    if (this.audioEncoder) {
      this.audioEncoder.close();
      this.audioEncoder = null;
    }
    this.onProgressCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.onCompleteCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'VideoEncoder' in window &&
      'AudioEncoder' in window &&
      'MediaStreamTrackProcessor' in window;
  }
}

// Example usage:
/*
const encoder = MediaEncodingManager.getInstance();

// Check if media encoding is supported
console.log('Media Encoding supported:', MediaEncodingManager.isSupported());

// Get supported codecs
Promise.all([
  encoder.getSupportedVideoCodecs(),
  encoder.getSupportedAudioCodecs()
]).then(([videoCodecs, audioCodecs]) => {
  console.log('Supported video codecs:', videoCodecs);
  console.log('Supported audio codecs:', audioCodecs);
});

// Set up listeners
const progressCleanup = encoder.onProgress(progress => {
  console.log(`${progress.type} encoding progress:`, progress.progress);
});

const errorCleanup = encoder.onError(error => {
  console.error('Encoding error:', error);
});

const completeCleanup = encoder.onComplete(result => {
  console.log(`${result.type} encoding complete:`, result);
});

// Get media stream and start encoding
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    // Start video encoding
    encoder.encodeVideo(stream, {
      codec: 'vp8',
      width: 1280,
      height: 720,
      bitrate: 2_000_000,
      framerate: 30
    });

    // Start audio encoding
    encoder.encodeAudio(stream, {
      codec: 'opus',
      sampleRate: 48000,
      channels: 2,
      bitrate: 128000
    });

    // Clean up after 10 seconds
    setTimeout(() => {
      progressCleanup();
      errorCleanup();
      completeCleanup();
      encoder.cleanup();
      stream.getTracks().forEach(track => track.stop());
    }, 10000);
  })
  .catch(error => {
    console.error('Failed to get media stream:', error);
  });
*/