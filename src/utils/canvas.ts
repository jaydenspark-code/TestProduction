type CanvasOptions = {
  width: number;
  height: number;
  backgroundColor?: string;
  smoothing?: boolean;
};

type DrawStyle = {
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  miterLimit?: number;
  lineDashOffset?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  globalAlpha?: number;
  globalCompositeOperation?: GlobalCompositeOperation;
};

type TextStyle = DrawStyle & {
  font?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  direction?: CanvasDirection;
};

type AnimationFrame = {
  update: (deltaTime: number) => void;
  render: (context: CanvasRenderingContext2D) => void;
};

export class CanvasManager {
  private static instance: CanvasManager;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frames: AnimationFrame[] = [];

  private constructor() {}

  static getInstance(): CanvasManager {
    if (!CanvasManager.instance) {
      CanvasManager.instance = new CanvasManager();
    }
    return CanvasManager.instance;
  }

  // Initialize canvas
  initialize(canvas: HTMLCanvasElement, options: CanvasOptions): void {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    if (!this.context) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas size
    this.setSize(options.width, options.height);

    // Set background color
    if (options.backgroundColor) {
      this.setBackground(options.backgroundColor);
    }

    // Set image smoothing
    this.context.imageSmoothingEnabled = options.smoothing ?? true;
  }

  // Set canvas size
  setSize(width: number, height: number): void {
    if (!this.canvas) return;

    this.canvas.width = width;
    this.canvas.height = height;
  }

  // Set background color
  setBackground(color: string): void {
    if (!this.context) return;

    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.canvas?.width || 0, this.canvas?.height || 0);
  }

  // Clear canvas
  clear(): void {
    if (!this.context || !this.canvas) return;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Apply drawing styles
  private applyStyle(style: DrawStyle): void {
    if (!this.context) return;

    Object.entries(style).forEach(([key, value]) => {
      if (value !== undefined) {
        (this.context as any)[key] = value;
      }
    });
  }

  // Draw rectangle
  drawRect(x: number, y: number, width: number, height: number, style: DrawStyle = {}): void {
    if (!this.context) return;

    this.applyStyle(style);

    if (style.fillStyle) {
      this.context.fillRect(x, y, width, height);
    }
    if (style.strokeStyle) {
      this.context.strokeRect(x, y, width, height);
    }
  }

  // Draw circle
  drawCircle(x: number, y: number, radius: number, style: DrawStyle = {}): void {
    if (!this.context) return;

    this.applyStyle(style);

    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.closePath();

    if (style.fillStyle) {
      this.context.fill();
    }
    if (style.strokeStyle) {
      this.context.stroke();
    }
  }

  // Draw line
  drawLine(x1: number, y1: number, x2: number, y2: number, style: DrawStyle = {}): void {
    if (!this.context) return;

    this.applyStyle(style);

    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  }

  // Draw path
  drawPath(points: [number, number][], style: DrawStyle = {}): void {
    if (!this.context || points.length < 2) return;

    this.applyStyle(style);

    this.context.beginPath();
    this.context.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      this.context.lineTo(points[i][0], points[i][1]);
    }

    if (style.fillStyle) {
      this.context.fill();
    }
    if (style.strokeStyle) {
      this.context.stroke();
    }
  }

  // Draw text
  drawText(text: string, x: number, y: number, style: TextStyle = {}): void {
    if (!this.context) return;

    this.applyStyle(style);

    if (style.fillStyle) {
      this.context.fillText(text, x, y);
    }
    if (style.strokeStyle) {
      this.context.strokeText(text, x, y);
    }
  }

  // Draw image
  drawImage(
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
    sx?: number,
    sy?: number,
    sWidth?: number,
    sHeight?: number
  ): void {
    if (!this.context) return;

    if (sx !== undefined && sy !== undefined && sWidth !== undefined && sHeight !== undefined) {
      this.context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth!, dHeight!);
    } else if (dWidth !== undefined && dHeight !== undefined) {
      this.context.drawImage(image, dx, dy, dWidth, dHeight);
    } else {
      this.context.drawImage(image, dx, dy);
    }
  }

  // Create gradient
  createLinearGradient(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    colorStops: [number, string][]
  ): CanvasGradient {
    if (!this.context) throw new Error('Canvas context not initialized');

    const gradient = this.context.createLinearGradient(x1, y1, x2, y2);
    colorStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    return gradient;
  }

  // Create radial gradient
  createRadialGradient(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number,
    colorStops: [number, string][]
  ): CanvasGradient {
    if (!this.context) throw new Error('Canvas context not initialized');

    const gradient = this.context.createRadialGradient(x1, y1, r1, x2, y2, r2);
    colorStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    return gradient;
  }

  // Create pattern
  createPattern(
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    repetition: string
  ): CanvasPattern | null {
    if (!this.context) return null;

    return this.context.createPattern(image, repetition);
  }

  // Save context state
  save(): void {
    this.context?.save();
  }

  // Restore context state
  restore(): void {
    this.context?.restore();
  }

  // Transform context
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.context?.transform(a, b, c, d, e, f);
  }

  // Set transform matrix
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.context?.setTransform(a, b, c, d, e, f);
  }

  // Reset transform
  resetTransform(): void {
    this.context?.resetTransform();
  }

  // Translate context
  translate(x: number, y: number): void {
    this.context?.translate(x, y);
  }

  // Rotate context
  rotate(angle: number): void {
    this.context?.rotate(angle);
  }

  // Scale context
  scale(x: number, y: number): void {
    this.context?.scale(x, y);
  }

  // Add animation frame
  addFrame(frame: AnimationFrame): void {
    this.frames.push(frame);

    if (this.frames.length === 1) {
      this.startAnimation();
    }
  }

  // Remove animation frame
  removeFrame(frame: AnimationFrame): void {
    const index = this.frames.indexOf(frame);
    if (index !== -1) {
      this.frames.splice(index, 1);
    }

    if (this.frames.length === 0) {
      this.stopAnimation();
    }
  }

  // Start animation loop
  private startAnimation(): void {
    this.lastFrameTime = performance.now();
    this.animate();
  }

  // Animation loop
  private animate(): void {
    if (!this.context) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Clear canvas
    this.clear();

    // Update and render all frames
    this.frames.forEach(frame => {
      frame.update(deltaTime);
      frame.render(this.context!);
    });

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  // Stop animation
  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Get canvas data URL
  toDataURL(type?: string, quality?: number): string {
    return this.canvas?.toDataURL(type, quality) || '';
  }

  // Get canvas image data
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData | null {
    return this.context?.getImageData(sx, sy, sw, sh) || null;
  }

  // Put image data
  putImageData(imageData: ImageData, dx: number, dy: number): void {
    this.context?.putImageData(imageData, dx, dy);
  }

  // Clean up resources
  cleanup(): void {
    this.stopAnimation();
    this.frames = [];
    this.context = null;
    this.canvas = null;
  }

  // Check if canvas is supported
  static isSupported(): boolean {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('2d');
  }
}

// Example usage:
/*
// Create canvas manager instance
const canvasManager = CanvasManager.getInstance();

// Check if canvas is supported
if (CanvasManager.isSupported()) {
  // Initialize canvas
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvasManager.initialize(canvas, {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    smoothing: true
  });

  // Draw shapes
  canvasManager.drawRect(10, 10, 100, 100, {
    fillStyle: 'red',
    strokeStyle: 'black',
    lineWidth: 2
  });

  canvasManager.drawCircle(200, 200, 50, {
    fillStyle: 'blue',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowBlur: 10
  });

  // Draw text
  canvasManager.drawText('Hello Canvas!', 300, 300, {
    font: '24px Arial',
    fillStyle: 'green',
    textAlign: 'center'
  });

  // Create and add animation frame
  const frame = {
    x: 0,
    update: (deltaTime: number) => {
      frame.x += 100 * deltaTime; // Move 100 pixels per second
      if (frame.x > 800) frame.x = 0;
    },
    render: (context: CanvasRenderingContext2D) => {
      canvasManager.drawCircle(frame.x, 400, 20, {
        fillStyle: 'purple'
      });
    }
  };

  canvasManager.addFrame(frame);

  // Clean up when done
  canvasManager.cleanup();
}
*/