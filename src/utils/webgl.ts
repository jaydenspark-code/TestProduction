type ShaderType = 'vertex' | 'fragment';

type ShaderSource = {
  vertex: string;
  fragment: string;
};

type UniformValue = number | number[] | Float32Array | WebGLTexture;

type Uniforms = Record<string, UniformValue>;

type Attributes = Record<string, {
  size: number;
  data: Float32Array;
}>;

type TextureOptions = {
  width: number;
  height: number;
  format?: number;
  type?: number;
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
  mipmap?: boolean;
};

export class WebGLManager {
  private static instance: WebGLManager;
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private programs: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private buffers: Map<string, WebGLBuffer> = new Map();
  private currentProgram: string | null = null;

  private constructor() {}

  static getInstance(): WebGLManager {
    if (!WebGLManager.instance) {
      WebGLManager.instance = new WebGLManager();
    }
    return WebGLManager.instance;
  }

  // Initialize WebGL context
  initialize(canvas: HTMLCanvasElement, options: WebGLContextAttributes = {}): void {
    try {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', options) ||
               canvas.getContext('experimental-webgl', options) as WebGLRenderingContext;

      if (!this.gl) {
        throw new Error('WebGL not supported');
      }

      // Enable basic WebGL features
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    } catch (error) {
      console.error('Error initializing WebGL:', error);
      throw error;
    }
  }

  // Create and compile shader
  private createShader(type: ShaderType, source: string): WebGLShader {
    const gl = this.gl!;
    const shader = gl.createShader(
      type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
    );

    if (!shader) {
      throw new Error(`Error creating ${type} shader`);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Error compiling ${type} shader: ${info}`);
    }

    return shader;
  }

  // Create shader program
  createProgram(name: string, source: ShaderSource): void {
    const gl = this.gl!;
    const vertexShader = this.createShader('vertex', source.vertex);
    const fragmentShader = this.createShader('fragment', source.fragment);

    const program = gl.createProgram();
    if (!program) {
      throw new Error('Error creating shader program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Error linking shader program: ${info}`);
    }

    // Clean up shaders
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    this.programs.set(name, program);
  }

  // Use shader program
  useProgram(name: string): void {
    const program = this.programs.get(name);
    if (!program) {
      throw new Error(`Program '${name}' not found`);
    }

    this.gl!.useProgram(program);
    this.currentProgram = name;
  }

  // Set uniforms
  setUniforms(uniforms: Uniforms): void {
    const gl = this.gl!;
    const program = this.programs.get(this.currentProgram!);
    if (!program) return;

    Object.entries(uniforms).forEach(([name, value]) => {
      const location = gl.getUniformLocation(program, name);
      if (location === null) return;

      if (typeof value === 'number') {
        gl.uniform1f(location, value);
      } else if (value instanceof Float32Array) {
        switch (value.length) {
          case 2:
            gl.uniform2fv(location, value);
            break;
          case 3:
            gl.uniform3fv(location, value);
            break;
          case 4:
            gl.uniform4fv(location, value);
            break;
          case 9:
            gl.uniformMatrix3fv(location, false, value);
            break;
          case 16:
            gl.uniformMatrix4fv(location, false, value);
            break;
        }
      } else if (Array.isArray(value)) {
        switch (value.length) {
          case 2:
            gl.uniform2f(location, value[0], value[1]);
            break;
          case 3:
            gl.uniform3f(location, value[0], value[1], value[2]);
            break;
          case 4:
            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
            break;
        }
      } else if (value instanceof WebGLTexture) {
        // Handle texture uniforms
        const textureUnit = 0; // You might want to manage texture units
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, value);
        gl.uniform1i(location, textureUnit);
      }
    });
  }

  // Create and set attributes
  setAttributes(attributes: Attributes): void {
    const gl = this.gl!;
    const program = this.programs.get(this.currentProgram!);
    if (!program) return;

    Object.entries(attributes).forEach(([name, { size, data }]) => {
      const location = gl.getAttribLocation(program, name);
      if (location === -1) return;

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);

      this.buffers.set(name, buffer!);
    });
  }

  // Create texture
  createTexture(name: string, options: TextureOptions): WebGLTexture {
    const gl = this.gl!;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Error creating texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrapS || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrapT || gl.CLAMP_TO_EDGE);

    // Allocate texture memory
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      options.format || gl.RGBA,
      options.width,
      options.height,
      0,
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      null
    );

    if (options.mipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    this.textures.set(name, texture);
    return texture;
  }

  // Update texture data
  updateTexture(
    name: string,
    data: ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
  ): void {
    const gl = this.gl!;
    const texture = this.textures.get(name);
    if (!texture) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  // Clear canvas
  clear(color: [number, number, number, number] = [0, 0, 0, 1]): void {
    const gl = this.gl!;
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  // Draw arrays
  draw(mode: number, count: number, offset: number = 0): void {
    this.gl!.drawArrays(mode, offset, count);
  }

  // Draw elements
  drawElements(mode: number, count: number, type: number, offset: number = 0): void {
    this.gl!.drawElements(mode, count, type, offset);
  }

  // Set viewport
  setViewport(x: number, y: number, width: number, height: number): void {
    this.gl!.viewport(x, y, width, height);
  }

  // Resize canvas
  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.setViewport(0, 0, width, height);
    }
  }

  // Clean up resources
  cleanup(): void {
    const gl = this.gl!;

    // Delete programs
    this.programs.forEach(program => {
      gl.deleteProgram(program);
    });
    this.programs.clear();

    // Delete textures
    this.textures.forEach(texture => {
      gl.deleteTexture(texture);
    });
    this.textures.clear();

    // Delete buffers
    this.buffers.forEach(buffer => {
      gl.deleteBuffer(buffer);
    });
    this.buffers.clear();

    this.currentProgram = null;
  }

  // Check if WebGL is supported
  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }
}

// Example usage:
/*
// Create WebGL manager instance
const webglManager = WebGLManager.getInstance();

// Check if WebGL is supported
if (WebGLManager.isSupported()) {
  // Initialize WebGL context
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  webglManager.initialize(canvas, {
    alpha: true,
    depth: true,
    stencil: true,
    antialias: true,
    preserveDrawingBuffer: false
  });

  // Create shader program
  webglManager.createProgram('basic', {
    vertex: `
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `,
    fragment: `
      precision mediump float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
    `
  });

  // Use program
  webglManager.useProgram('basic');

  // Set attributes
  webglManager.setAttributes({
    position: {
      size: 2,
      data: new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ])
    }
  });

  // Set uniforms
  webglManager.setUniforms({
    color: [1, 0, 0, 1]
  });

  // Create texture
  const texture = webglManager.createTexture('main', {
    width: 512,
    height: 512,
    mipmap: true
  });

  // Draw
  webglManager.clear();
  webglManager.draw(WebGLRenderingContext.TRIANGLE_STRIP, 4);

  // Clean up
  webglManager.cleanup();
}
*/