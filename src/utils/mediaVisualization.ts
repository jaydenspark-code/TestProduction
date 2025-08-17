type VisualizationConfig = {
  maxVisualizations?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultFPS?: number;
  defaultSmoothing?: boolean;
  defaultFFTSize?: number;
  defaultMinDecibels?: number;
  defaultMaxDecibels?: number;
  defaultSmoothingTimeConstant?: number;
};

type VisualizationType = 'waveform' | 'frequency' | 'spectrum' | 'volume' | 'custom';

type VisualizationItem = {
  id: string;
  type: VisualizationType;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  fps: number;
  smoothing: boolean;
  fftSize: number;
  minDecibels: number;
  maxDecibels: number;
  smoothingTimeConstant: number;
  timestamp: number;
  metadata: Record<string, any>;
};

type VisualizationEvent = {
  type: 'start' | 'update' | 'stop' | 'error' | 'cleanup';
  visualizationId?: string;
  timestamp: number;
  details: any;
};

type VisualizationEventCallback = (event: VisualizationEvent) => void;

export class MediaVisualizationManager {
  private static instance: MediaVisualizationManager;
  private config: VisualizationConfig;
  private visualizations: Map<string, VisualizationItem>;
  private animationFrames: Map<string, number>;
  private onVisualizationEventCallbacks: Set<VisualizationEventCallback>;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.visualizations = new Map();
    this.animationFrames = new Map();
    this.onVisualizationEventCallbacks = new Set();
  }

  static getInstance(): MediaVisualizationManager {
    if (!MediaVisualizationManager.instance) {
      MediaVisualizationManager.instance = new MediaVisualizationManager();
    }
    return MediaVisualizationManager.instance;
  }

  private notifyVisualizationEvent(event: VisualizationEvent): void {
    this.onVisualizationEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): VisualizationConfig {
    return {
      maxVisualizations: 10,
      autoCleanup: true,
      cleanupThreshold: 0.9,              // 90% of maxVisualizations
      defaultWidth: 512,
      defaultHeight: 256,
      defaultFPS: 30,
      defaultSmoothing: true,
      defaultFFTSize: 2048,
      defaultMinDecibels: -90,
      defaultMaxDecibels: -10,
      defaultSmoothingTimeConstant: 0.8
    };
  }

  configure(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.visualizations.size > this.config.maxVisualizations! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    return { canvas, context };
  }

  private drawWaveform(visualization: VisualizationItem, audioData: Float32Array): void {
    const { context, width, height } = visualization;
    const step = Math.ceil(audioData.length / width);
    const amp = height / 2;

    context.fillStyle = 'rgb(200, 200, 200)';
    context.fillRect(0, 0, width, height);
    context.lineWidth = 1;
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.beginPath();

    for (let i = 0; i < width; i++) {
      const min = 1.0;
      const max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = audioData[(i * step) + j];
        if (datum < min) min;
        if (datum > max) max;
      }
      context.moveTo(i, (1 + min) * amp);
      context.lineTo(i, (1 + max) * amp);
    }

    context.stroke();
  }

  private drawFrequency(visualization: VisualizationItem, frequencyData: Uint8Array): void {
    const { context, width, height } = visualization;
    const barWidth = (width / frequencyData.length) * 2.5;
    let barHeight;
    let x = 0;

    context.fillStyle = 'rgb(200, 200, 200)';
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < frequencyData.length; i++) {
      barHeight = frequencyData[i] / 2;

      context.fillStyle = `rgb(${barHeight + 100},50,50)`;
      context.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  private drawSpectrum(visualization: VisualizationItem, frequencyData: Uint8Array): void {
    const { context, width, height } = visualization;
    const barCount = frequencyData.length;
    const barWidth = width / barCount;
    const heightScale = height / 256;

    context.fillStyle = 'rgb(200, 200, 200)';
    context.fillRect(0, 0, width, height);

    context.lineWidth = 2;
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.beginPath();

    context.moveTo(0, height - frequencyData[0] * heightScale);
    for (let i = 1; i < barCount; i++) {
      const x = i * barWidth;
      const y = height - frequencyData[i] * heightScale;
      context.lineTo(x, y);
    }

    context.stroke();
  }

  private drawVolume(visualization: VisualizationItem, volumeData: number): void {
    const { context, width, height } = visualization;
    const radius = Math.min(width, height) / 3;
    const centerX = width / 2;
    const centerY = height / 2;

    context.fillStyle = 'rgb(200, 200, 200)';
    context.fillRect(0, 0, width, height);

    context.beginPath();
    context.arc(centerX, centerY, radius * volumeData, 0, 2 * Math.PI);
    context.fillStyle = `rgb(${Math.floor(volumeData * 255)}, 50, 50)`;
    context.fill();
  }

  startVisualization(
    audioContext: AudioContext,
    sourceNode: AudioNode,
    options: {
      type: VisualizationType;
      width?: number;
      height?: number;
      fps?: number;
      smoothing?: boolean;
      fftSize?: number;
      minDecibels?: number;
      maxDecibels?: number;
      smoothingTimeConstant?: number;
      metadata?: Record<string, any>;
      customDrawFunction?: (context: CanvasRenderingContext2D, analyser: AnalyserNode, width: number, height: number) => void;
    }
  ): string {
    const id = crypto.randomUUID();
    const currentTime = performance.now();

    const { canvas, context } = this.createCanvas(
      options.width || this.config.defaultWidth!,
      options.height || this.config.defaultHeight!
    );

    const visualization: VisualizationItem = {
      id,
      type: options.type,
      canvas,
      context,
      width: canvas.width,
      height: canvas.height,
      fps: options.fps || this.config.defaultFPS!,
      smoothing: options.smoothing ?? this.config.defaultSmoothing!,
      fftSize: options.fftSize || this.config.defaultFFTSize!,
      minDecibels: options.minDecibels || this.config.defaultMinDecibels!,
      maxDecibels: options.maxDecibels || this.config.defaultMaxDecibels!,
      smoothingTimeConstant: options.smoothingTimeConstant || this.config.defaultSmoothingTimeConstant!,
      timestamp: currentTime,
      metadata: options.metadata || {}
    };

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = visualization.fftSize;
    analyser.minDecibels = visualization.minDecibels;
    analyser.maxDecibels = visualization.maxDecibels;
    analyser.smoothingTimeConstant = visualization.smoothingTimeConstant;

    sourceNode.connect(analyser);

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Float32Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!this.visualizations.has(id)) return;

      const frameId = requestAnimationFrame(draw);
      this.animationFrames.set(id, frameId);

      switch (visualization.type) {
        case 'waveform':
          analyser.getFloatTimeDomainData(timeData);
          this.drawWaveform(visualization, timeData);
          break;

        case 'frequency':
          analyser.getByteFrequencyData(frequencyData);
          this.drawFrequency(visualization, frequencyData);
          break;

        case 'spectrum':
          analyser.getByteFrequencyData(frequencyData);
          this.drawSpectrum(visualization, frequencyData);
          break;

        case 'volume':
          analyser.getByteTimeDomainData(frequencyData);
          let sum = 0;
          for (let i = 0; i < frequencyData.length; i++) {
            sum += Math.abs(frequencyData[i] - 128);
          }
          const volume = sum / (frequencyData.length * 128);
          this.drawVolume(visualization, volume);
          break;

        case 'custom':
          if (options.customDrawFunction) {
            options.customDrawFunction(context, analyser, canvas.width, canvas.height);
          }
          break;
      }

      this.notifyVisualizationEvent({
        type: 'update',
        visualizationId: id,
        timestamp: performance.now(),
        details: { visualization }
      });
    };

    this.visualizations.set(id, visualization);
    const frameId = requestAnimationFrame(draw);
    this.animationFrames.set(id, frameId);

    this.notifyVisualizationEvent({
      type: 'start',
      visualizationId: id,
      timestamp: currentTime,
      details: { visualization }
    });

    if (this.visualizations.size > this.config.maxVisualizations! && this.config.autoCleanup) {
      this.cleanup();
    }

    return id;
  }

  stopVisualization(id: string): boolean {
    const visualization = this.visualizations.get(id);
    const frameId = this.animationFrames.get(id);

    if (visualization && frameId) {
      cancelAnimationFrame(frameId);
      this.visualizations.delete(id);
      this.animationFrames.delete(id);

      this.notifyVisualizationEvent({
        type: 'stop',
        visualizationId: id,
        timestamp: performance.now(),
        details: { visualization }
      });

      return true;
    }

    return false;
  }

  getVisualization(id: string): VisualizationItem | undefined {
    return this.visualizations.get(id);
  }

  getVisualizationCanvas(id: string): HTMLCanvasElement | undefined {
    return this.visualizations.get(id)?.canvas;
  }

  getAllVisualizations(): VisualizationItem[] {
    return Array.from(this.visualizations.values());
  }

  getVisualizationCount(): number {
    return this.visualizations.size;
  }

  cleanup(): void {
    if (this.visualizations.size <= this.config.maxVisualizations! * this.config.cleanupThreshold!) {
      return;
    }

    const visualizationsToRemove = Array.from(this.visualizations.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, this.visualizations.size - this.config.maxVisualizations!);

    for (const visualization of visualizationsToRemove) {
      this.stopVisualization(visualization.id);
    }

    this.notifyVisualizationEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: visualizationsToRemove.length }
    });
  }

  onVisualizationEvent(callback: VisualizationEventCallback): () => void {
    this.onVisualizationEventCallbacks.add(callback);
    return () => {
      this.onVisualizationEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'AudioContext' in window &&
      'AnalyserNode' in window &&
      'HTMLCanvasElement' in window &&
      'requestAnimationFrame' in window &&
      'crypto' in window &&
      'performance' in window;
  }
}

// Example usage:
/*
const visualizationManager = MediaVisualizationManager.getInstance();

// Check if media visualization is supported
console.log('Media Visualization supported:', MediaVisualizationManager.isSupported());

// Configure visualization manager
visualizationManager.configure({
  maxVisualizations: 5,
  autoCleanup: true,
  cleanupThreshold: 0.8,
  defaultWidth: 800,
  defaultHeight: 400,
  defaultFPS: 60,
  defaultSmoothing: true,
  defaultFFTSize: 2048,
  defaultMinDecibels: -90,
  defaultMaxDecibels: -10,
  defaultSmoothingTimeConstant: 0.8
});

// Set up event listener
const eventCleanup = visualizationManager.onVisualizationEvent(event => {
  console.log('Visualization event:', event);
});

// Create audio context and source
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
oscillator.type = 'sine';
oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
oscillator.start();

// Start visualizations
const waveformId = visualizationManager.startVisualization(audioContext, oscillator, {
  type: 'waveform',
  width: 800,
  height: 200,
  metadata: { name: 'Sine Wave' }
});

const frequencyId = visualizationManager.startVisualization(audioContext, oscillator, {
  type: 'frequency',
  width: 800,
  height: 200,
  metadata: { name: 'Frequency Bars' }
});

const spectrumId = visualizationManager.startVisualization(audioContext, oscillator, {
  type: 'spectrum',
  width: 800,
  height: 200,
  metadata: { name: 'Spectrum' }
});

const volumeId = visualizationManager.startVisualization(audioContext, oscillator, {
  type: 'volume',
  width: 200,
  height: 200,
  metadata: { name: 'Volume Meter' }
});

// Custom visualization
const customId = visualizationManager.startVisualization(audioContext, oscillator, {
  type: 'custom',
  width: 800,
  height: 200,
  metadata: { name: 'Custom Visualization' },
  customDrawFunction: (context, analyser, width, height) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    context.fillStyle = 'rgb(200, 200, 200)';
    context.fillRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');

    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(0, height);

    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * width;
      const y = height - (data[i] / 255) * height;
      context.lineTo(x, y);
    }

    context.lineTo(width, height);
    context.closePath();
    context.fill();
  }
});

// Get visualization information
console.log('Visualization count:', visualizationManager.getVisualizationCount());
console.log('All visualizations:', visualizationManager.getAllVisualizations());

// Get canvas elements
const waveformCanvas = visualizationManager.getVisualizationCanvas(waveformId);
const frequencyCanvas = visualizationManager.getVisualizationCanvas(frequencyId);
const spectrumCanvas = visualizationManager.getVisualizationCanvas(spectrumId);
const volumeCanvas = visualizationManager.getVisualizationCanvas(volumeId);
const customCanvas = visualizationManager.getVisualizationCanvas(customId);

// Add canvases to document
document.body.appendChild(waveformCanvas);
document.body.appendChild(frequencyCanvas);
document.body.appendChild(spectrumCanvas);
document.body.appendChild(volumeCanvas);
document.body.appendChild(customCanvas);

// Stop visualizations after 5 seconds
setTimeout(() => {
  visualizationManager.stopVisualization(waveformId);
  visualizationManager.stopVisualization(frequencyId);
  visualizationManager.stopVisualization(spectrumId);
  visualizationManager.stopVisualization(volumeId);
  visualizationManager.stopVisualization(customId);
  oscillator.stop();
}, 5000);

// Remove event listener
eventCleanup();
*/