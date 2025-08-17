type AudioOptions = {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  volume?: number;
};

type AudioEffect = {
  type: 'gain' | 'filter' | 'delay' | 'reverb' | 'distortion';
  params: Record<string, number>;
};

type AudioVisualizerOptions = {
  type: 'waveform' | 'frequency' | 'circular';
  canvas: HTMLCanvasElement;
  barWidth?: number;
  barSpacing?: number;
  barColor?: string;
  backgroundColor?: string;
};

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private effectNodes: AudioNode[] = [];
  private stream: MediaStream | null = null;
  private visualizerFrameId: number | null = null;
  private options: AudioOptions = {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    volume: 1.0
  };

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Initialize audio context and setup audio nodes
  async initialize(options: Partial<AudioOptions> = {}): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.options = { ...this.options, ...options };

      // Create analyzer node
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.options.fftSize!;
      this.analyserNode.smoothingTimeConstant = this.options.smoothingTimeConstant!;
      this.analyserNode.minDecibels = this.options.minDecibels!;
      this.analyserNode.maxDecibels = this.options.maxDecibels!;

      // Create gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.options.volume!;

      // Connect nodes
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error initializing audio context:', error);
      throw error;
    }
  }

  // Start audio capture from microphone
  async startMicrophoneCapture(): Promise<void> {
    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      this.sourceNode = this.audioContext!.createMediaStreamSource(this.stream);
      this.sourceNode.connect(this.gainNode!);
    } catch (error) {
      console.error('Error starting microphone capture:', error);
      throw error;
    }
  }

  // Stop audio capture
  stopCapture(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  // Load audio file
  async loadAudioFile(file: File): Promise<void> {
    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      const bufferSource = this.audioContext!.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(this.gainNode!);
      bufferSource.start();
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  // Add audio effect
  addEffect(effect: AudioEffect): void {
    if (!this.audioContext) return;

    let effectNode: AudioNode;

    switch (effect.type) {
      case 'gain':
        effectNode = this.audioContext.createGain();
        (effectNode as GainNode).gain.value = effect.params.gain || 1.0;
        break;

      case 'filter':
        effectNode = this.audioContext.createBiquadFilter();
        (effectNode as BiquadFilterNode).type = 'lowpass';
        (effectNode as BiquadFilterNode).frequency.value = effect.params.frequency || 1000;
        (effectNode as BiquadFilterNode).Q.value = effect.params.Q || 1.0;
        break;

      case 'delay':
        effectNode = this.audioContext.createDelay();
        (effectNode as DelayNode).delayTime.value = effect.params.delayTime || 0.5;
        break;

      case 'reverb':
        // Simple convolver reverb
        effectNode = this.audioContext.createConvolver();
        // You would need to load an impulse response buffer here
        break;

      case 'distortion':
        effectNode = this.audioContext.createWaveShaper();
        const curve = this.makeDistortionCurve(effect.params.amount || 50);
        (effectNode as WaveShaperNode).curve = curve;
        break;

      default:
        return;
    }

    // Disconnect previous chain
    if (this.effectNodes.length > 0) {
      const lastEffect = this.effectNodes[this.effectNodes.length - 1];
      lastEffect.disconnect();
      lastEffect.connect(effectNode);
    } else if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode.connect(effectNode);
    }

    effectNode.connect(this.gainNode!);
    this.effectNodes.push(effectNode);
  }

  // Start audio visualization
  startVisualization(options: AudioVisualizerOptions): void {
    if (!this.analyserNode) return;

    const canvas = options.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.visualizerFrameId = requestAnimationFrame(draw);

      ctx.fillStyle = options.backgroundColor || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      switch (options.type) {
        case 'waveform':
          this.drawWaveform(ctx, dataArray, options);
          break;

        case 'frequency':
          this.drawFrequencyBars(ctx, dataArray, options);
          break;

        case 'circular':
          this.drawCircularVisualization(ctx, dataArray, options);
          break;
      }
    };

    draw();
  }

  // Stop audio visualization
  stopVisualization(): void {
    if (this.visualizerFrameId !== null) {
      cancelAnimationFrame(this.visualizerFrameId);
      this.visualizerFrameId = null;
    }
  }

  // Set volume
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Get current volume
  getVolume(): number {
    return this.gainNode?.gain.value || 0;
  }

  // Check if Web Audio API is supported
  static isSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  // Private methods
  private drawWaveform(
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    options: AudioVisualizerOptions
  ): void {
    this.analyserNode!.getByteTimeDomainData(dataArray);

    ctx.lineWidth = options.barWidth || 2;
    ctx.strokeStyle = options.barColor || '#00ff00';
    ctx.beginPath();

    const sliceWidth = ctx.canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * ctx.canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
    ctx.stroke();
  }

  private drawFrequencyBars(
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    options: AudioVisualizerOptions
  ): void {
    this.analyserNode!.getByteFrequencyData(dataArray);

    const barWidth = options.barWidth || 2;
    const barSpacing = options.barSpacing || 1;
    const totalWidth = barWidth + barSpacing;
    const barCount = Math.floor(ctx.canvas.width / totalWidth);

    ctx.fillStyle = options.barColor || '#00ff00';

    for (let i = 0; i < barCount; i++) {
      const percent = dataArray[i] / 255;
      const height = ctx.canvas.height * percent;
      const x = i * totalWidth;
      const y = ctx.canvas.height - height;

      ctx.fillRect(x, y, barWidth, height);
    }
  }

  private drawCircularVisualization(
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    options: AudioVisualizerOptions
  ): void {
    this.analyserNode!.getByteFrequencyData(dataArray);

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const barCount = 180;
    const barWidth = (Math.PI * 2) / barCount;

    ctx.strokeStyle = options.barColor || '#00ff00';
    ctx.lineWidth = options.barWidth || 2;

    for (let i = 0; i < barCount; i++) {
      const amplitude = dataArray[i] / 255;
      const barLength = radius * amplitude;
      const angle = i * barWidth;

      const x1 = centerX + radius * Math.cos(angle);
      const y1 = centerY + radius * Math.sin(angle);
      const x2 = centerX + (radius + barLength) * Math.cos(angle);
      const y2 = centerY + (radius + barLength) * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
  }
}

// Example usage:
/*
// Create audio manager instance
const audioManager = AudioManager.getInstance();

// Check if Web Audio API is supported
if (AudioManager.isSupported()) {
  // Initialize with custom options
  await audioManager.initialize({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    volume: 0.8
  });

  // Start microphone capture
  await audioManager.startMicrophoneCapture();

  // Add audio effects
  audioManager.addEffect({
    type: 'gain',
    params: { gain: 1.5 }
  });

  audioManager.addEffect({
    type: 'filter',
    params: {
      frequency: 1000,
      Q: 1.0
    }
  });

  // Start visualization
  const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
  audioManager.startVisualization({
    type: 'frequency',
    canvas: canvas,
    barWidth: 2,
    barSpacing: 1,
    barColor: '#00ff00',
    backgroundColor: '#000000'
  });

  // Load audio file
  const fileInput = document.getElementById('audio-file') as HTMLInputElement;
  fileInput.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      await audioManager.loadAudioFile(file);
    }
  });

  // Control volume
  audioManager.setVolume(0.8);
  console.log('Current volume:', audioManager.getVolume());

  // Cleanup
  audioManager.stopVisualization();
  audioManager.stopCapture();
}
*/