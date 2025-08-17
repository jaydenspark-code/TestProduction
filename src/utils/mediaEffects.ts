type EffectConfig = {
  type: 'video' | 'audio';
  name: string;
  params: Record<string, any>;
  enabled?: boolean;
  priority?: number;
};

type EffectState = {
  id: string;
  type: 'video' | 'audio';
  name: string;
  enabled: boolean;
  priority: number;
  params: Record<string, any>;
  processor?: MediaStreamTrackProcessor;
  generator?: MediaStreamTrackGenerator;
};

type EffectEvent = {
  type: 'added' | 'removed' | 'enabled' | 'disabled' | 'error';
  effectId: string;
  timestamp: number;
  details?: any;
};

type EffectEventCallback = (event: EffectEvent) => void;

export class MediaEffectsManager {
  private static instance: MediaEffectsManager;
  private effects: Map<string, EffectState>;
  private videoEffects: Map<string, (frame: VideoFrame) => VideoFrame>;
  private audioEffects: Map<string, (data: AudioData) => AudioData>;
  private onEffectEventCallbacks: Set<EffectEventCallback>;

  private constructor() {
    this.effects = new Map();
    this.videoEffects = new Map();
    this.audioEffects = new Map();
    this.onEffectEventCallbacks = new Set();

    // Register built-in video effects
    this.registerVideoEffect('grayscale', this.grayscaleEffect.bind(this));
    this.registerVideoEffect('blur', this.blurEffect.bind(this));
    this.registerVideoEffect('brightness', this.brightnessEffect.bind(this));
    this.registerVideoEffect('contrast', this.contrastEffect.bind(this));
    this.registerVideoEffect('saturation', this.saturationEffect.bind(this));

    // Register built-in audio effects
    this.registerAudioEffect('gain', this.gainEffect.bind(this));
    this.registerAudioEffect('lowpass', this.lowpassEffect.bind(this));
    this.registerAudioEffect('highpass', this.highpassEffect.bind(this));
    this.registerAudioEffect('echo', this.echoEffect.bind(this));
    this.registerAudioEffect('compressor', this.compressorEffect.bind(this));
  }

  static getInstance(): MediaEffectsManager {
    if (!MediaEffectsManager.instance) {
      MediaEffectsManager.instance = new MediaEffectsManager();
    }
    return MediaEffectsManager.instance;
  }

  private notifyEffectEvent(event: EffectEvent): void {
    this.onEffectEventCallbacks.forEach(callback => callback(event));
  }

  registerVideoEffect(name: string, effect: (frame: VideoFrame) => VideoFrame): void {
    this.videoEffects.set(name, effect);
  }

  registerAudioEffect(name: string, effect: (data: AudioData) => AudioData): void {
    this.audioEffects.set(name, effect);
  }

  async addEffect(track: MediaStreamTrack, config: EffectConfig): Promise<string> {
    const effectId = crypto.randomUUID();
    const processor = new MediaStreamTrackProcessor({ track });
    const generator = new MediaStreamTrackGenerator({ kind: track.kind });

    const effect: EffectState = {
      id: effectId,
      type: config.type,
      name: config.name,
      enabled: config.enabled ?? true,
      priority: config.priority ?? 0,
      params: config.params,
      processor,
      generator
    };

    this.effects.set(effectId, effect);

    if (effect.type === 'video') {
      this.processVideoEffect(effect);
    } else {
      this.processAudioEffect(effect);
    }

    this.notifyEffectEvent({
      type: 'added',
      effectId,
      timestamp: performance.now(),
      details: { config }
    });

    return effectId;
  }

  private async processVideoEffect(effect: EffectState): Promise<void> {
    const reader = effect.processor!.readable.getReader();
    const writer = effect.generator!.writable.getWriter();
    const effectFunc = this.videoEffects.get(effect.name);

    if (!effectFunc) {
      throw new Error(`Video effect ${effect.name} not found`);
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (effect.enabled) {
          const processedFrame = effectFunc(value);
          await writer.write(processedFrame);
          value.close();
        } else {
          await writer.write(value);
        }
      }
    } catch (error) {
      this.notifyEffectEvent({
        type: 'error',
        effectId: effect.id,
        timestamp: performance.now(),
        details: error
      });
    } finally {
      reader.releaseLock();
      writer.releaseLock();
    }
  }

  private async processAudioEffect(effect: EffectState): Promise<void> {
    const reader = effect.processor!.readable.getReader();
    const writer = effect.generator!.writable.getWriter();
    const effectFunc = this.audioEffects.get(effect.name);

    if (!effectFunc) {
      throw new Error(`Audio effect ${effect.name} not found`);
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (effect.enabled) {
          const processedData = effectFunc(value);
          await writer.write(processedData);
          value.close();
        } else {
          await writer.write(value);
        }
      }
    } catch (error) {
      this.notifyEffectEvent({
        type: 'error',
        effectId: effect.id,
        timestamp: performance.now(),
        details: error
      });
    } finally {
      reader.releaseLock();
      writer.releaseLock();
    }
  }

  removeEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (!effect) {
      throw new Error(`Effect with id ${effectId} not found`);
    }

    effect.processor?.disconnect();
    effect.generator?.disconnect();
    this.effects.delete(effectId);

    this.notifyEffectEvent({
      type: 'removed',
      effectId,
      timestamp: performance.now()
    });
  }

  enableEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (!effect) {
      throw new Error(`Effect with id ${effectId} not found`);
    }

    effect.enabled = true;

    this.notifyEffectEvent({
      type: 'enabled',
      effectId,
      timestamp: performance.now()
    });
  }

  disableEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (!effect) {
      throw new Error(`Effect with id ${effectId} not found`);
    }

    effect.enabled = false;

    this.notifyEffectEvent({
      type: 'disabled',
      effectId,
      timestamp: performance.now()
    });
  }

  updateEffectParams(effectId: string, params: Record<string, any>): void {
    const effect = this.effects.get(effectId);
    if (!effect) {
      throw new Error(`Effect with id ${effectId} not found`);
    }

    effect.params = { ...effect.params, ...params };
  }

  getEffect(effectId: string): EffectState | undefined {
    return this.effects.get(effectId);
  }

  getAllEffects(): EffectState[] {
    return Array.from(this.effects.values());
  }

  getVideoEffects(): EffectState[] {
    return this.getAllEffects().filter(effect => effect.type === 'video');
  }

  getAudioEffects(): EffectState[] {
    return this.getAllEffects().filter(effect => effect.type === 'audio');
  }

  onEffectEvent(callback: EffectEventCallback): () => void {
    this.onEffectEventCallbacks.add(callback);
    return () => {
      this.onEffectEventCallbacks.delete(callback);
    };
  }

  // Built-in video effects
  private grayscaleEffect(frame: VideoFrame): VideoFrame {
    // Implementation would use WebGL or Canvas to apply grayscale
    return frame;
  }

  private blurEffect(frame: VideoFrame): VideoFrame {
    // Implementation would use WebGL or Canvas to apply blur
    return frame;
  }

  private brightnessEffect(frame: VideoFrame): VideoFrame {
    // Implementation would use WebGL or Canvas to adjust brightness
    return frame;
  }

  private contrastEffect(frame: VideoFrame): VideoFrame {
    // Implementation would use WebGL or Canvas to adjust contrast
    return frame;
  }

  private saturationEffect(frame: VideoFrame): VideoFrame {
    // Implementation would use WebGL or Canvas to adjust saturation
    return frame;
  }

  // Built-in audio effects
  private gainEffect(data: AudioData): AudioData {
    // Implementation would use Web Audio API to adjust gain
    return data;
  }

  private lowpassEffect(data: AudioData): AudioData {
    // Implementation would use Web Audio API to apply lowpass filter
    return data;
  }

  private highpassEffect(data: AudioData): AudioData {
    // Implementation would use Web Audio API to apply highpass filter
    return data;
  }

  private echoEffect(data: AudioData): AudioData {
    // Implementation would use Web Audio API to add echo
    return data;
  }

  private compressorEffect(data: AudioData): AudioData {
    // Implementation would use Web Audio API to apply compression
    return data;
  }

  cleanup(): void {
    this.effects.forEach((effect, effectId) => {
      this.removeEffect(effectId);
    });
    this.effects.clear();
    this.videoEffects.clear();
    this.audioEffects.clear();
    this.onEffectEventCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'MediaStreamTrackProcessor' in window &&
      'MediaStreamTrackGenerator' in window;
  }
}

// Example usage:
/*
const effectsManager = MediaEffectsManager.getInstance();

// Check if media effects are supported
console.log('Media Effects supported:', MediaEffectsManager.isSupported());

// Set up event listener
const eventCleanup = effectsManager.onEffectEvent(event => {
  console.log('Effect event:', event);
});

// Get user media and apply effects
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    // Add video effects
    effectsManager.addEffect(videoTrack, {
      type: 'video',
      name: 'grayscale',
      params: {},
      priority: 1
    }).then(grayscaleId => {
      // Add blur effect after grayscale
      return effectsManager.addEffect(videoTrack, {
        type: 'video',
        name: 'blur',
        params: { radius: 5 },
        priority: 2
      });
    }).then(blurId => {
      console.log('Video effects added');
    });

    // Add audio effects
    effectsManager.addEffect(audioTrack, {
      type: 'audio',
      name: 'gain',
      params: { level: 1.5 },
      priority: 1
    }).then(gainId => {
      // Add echo effect after gain
      return effectsManager.addEffect(audioTrack, {
        type: 'audio',
        name: 'echo',
        params: { delay: 0.5, feedback: 0.3 },
        priority: 2
      });
    }).then(echoId => {
      console.log('Audio effects added');
    });
  })
  .catch(error => {
    console.error('Failed to get user media:', error);
  });

// Clean up after 30 seconds
setTimeout(() => {
  eventCleanup();
  effectsManager.cleanup();
}, 30000);
*/