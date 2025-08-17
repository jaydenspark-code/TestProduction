type WebGL2Options = {
  antialias?: boolean;
  alpha?: boolean;
  depth?: boolean;
  stencil?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: WebGLPowerPreference;
};

type ShaderSource = {
  vertex: string;
  fragment: string;
};

type BufferData = {
  data: BufferSource;
  usage?: number;
  target?: number;
};

type TextureOptions = {
  target?: number;
  level?: number;
  internalformat?: number;
  format?: number;
  type?: number;
  border?: number;
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
};

export class WebGL2Manager {
  private static instance: WebGL2Manager;
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private programs: Map<string, WebGLProgram> = new Map();
  private buffers: Map<string, WebGLBuffer> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private currentProgram: WebGLProgram | null = null;

  private constructor() {}

  static getInstance(): WebGL2Manager {
    if (!WebGL2Manager.instance) {
      WebGL2Manager.instance = new WebGL2Manager();
    }
    return WebGL2Manager.instance;
  }

  // Initialize WebGL2 context
  initialize(canvas: HTMLCanvasElement, options: WebGL2Options = {}): void {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', options);

    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    // Enable depth testing by default
    if (options.depth !== false) {
      this.gl.enable(this.gl.DEPTH_TEST);
    }
  }

  // Create shader program
  createProgram(name: string, source: ShaderSource): WebGLProgram {
    if (!this.gl) throw new Error('WebGL2 context not initialized');

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, source.vertex);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, source.fragment);

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders');
    }

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error(`Failed to link program: ${info}`);
    }

    // Clean up shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    this.programs.set(name, program);
    return program;
  }

  // Create shader
  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      console.error('Shader compilation error:', info);
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  // Use program
  useProgram(name: string): void {
    if (!this.gl) return;

    const program = this.programs.get(name);
    if (!program) {
      throw new Error(`Program '${name}' not found`);
    }

    this.gl.useProgram(program);
    this.currentProgram = program;
  }

  // Create buffer
  createBuffer(name: string, bufferData: BufferData): void {
    if (!this.gl) return;

    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create buffer');
    }

    const target = bufferData.target || this.gl.ARRAY_BUFFER;
    const usage = bufferData.usage || this.gl.STATIC_DRAW;

    this.gl.bindBuffer(target, buffer);
    this.gl.bufferData(target, bufferData.data, usage);

    this.buffers.set(name, buffer);
  }

  // Bind buffer
  bindBuffer(name: string, target?: number): void {
    if (!this.gl) return;

    const buffer = this.buffers.get(name);
    if (!buffer) {
      throw new Error(`Buffer '${name}' not found`);
    }

    this.gl.bindBuffer(target || this.gl.ARRAY_BUFFER, buffer);
  }

  // Create texture
  createTexture(name: string, image: TexImageSource, options: TextureOptions = {}): void {
    if (!this.gl) return;

    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create texture');
    }

    const {
      target = this.gl.TEXTURE_2D,
      level = 0,
      internalformat = this.gl.RGBA,
      format = this.gl.RGBA,
      type = this.gl.UNSIGNED_BYTE,
      border = 0,
      minFilter = this.gl.LINEAR,
      magFilter = this.gl.LINEAR,
      wrapS = this.gl.CLAMP_TO_EDGE,
      wrapT = this.gl.CLAMP_TO_EDGE
    } = options;

    this.gl.bindTexture(target, texture);

    // Set texture parameters
    this.gl.texParameteri(target, this.gl.TEXTURE_MIN_FILTER, minFilter);
    this.gl.texParameteri(target, this.gl.TEXTURE_MAG_FILTER, magFilter);
    this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_S, wrapS);
    this.gl.texParameteri(target, this.gl.TEXTURE_WRAP_T, wrapT);

    // Upload image to texture
    this.gl.texImage2D(
      target,
      level,
      internalformat,
      format,
      type,
      image
    );

    // Generate mipmaps if using LINEAR_MIPMAP_LINEAR
    if (minFilter === this.gl.LINEAR_MIPMAP_LINEAR) {
      this.gl.generateMipmap(target);
    }

    this.textures.set(name, texture);
  }

  // Bind texture
  bindTexture(name: string, unit: number, target?: number): void {
    if (!this.gl) return;

    const texture = this.textures.get(name);
    if (!texture) {
      throw new Error(`Texture '${name}' not found`);
    }

    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(target || this.gl.TEXTURE_2D, texture);
  }

  // Set uniform value
  setUniform(name: string, value: any, type: string): void {
    if (!this.gl || !this.currentProgram) return;

    const location = this.gl.getUniformLocation(this.currentProgram, name);
    if (!location) return;

    switch (type) {
      case '1f':
        this.gl.uniform1f(location, value);
        break;
      case '2f':
        this.gl.uniform2f(location, value[0], value[1]);
        break;
      case '3f':
        this.gl.uniform3f(location, value[0], value[1], value[2]);
        break;
      case '4f':
        this.gl.uniform4f(location, value[0], value[1], value[2], value[3]);
        break;
      case '1i':
        this.gl.uniform1i(location, value);
        break;
      case 'matrix3fv':
        this.gl.uniformMatrix3fv(location, false, value);
        break;
      case 'matrix4fv':
        this.gl.uniformMatrix4fv(location, false, value);
        break;
    }
  }

  // Set vertex attribute
  setVertexAttribute(
    name: string,
    size: number,
    type: number,
    normalize: boolean,
    stride: number,
    offset: number
  ): void {
    if (!this.gl || !this.currentProgram) return;

    const location = this.gl.getAttribLocation(this.currentProgram, name);
    if (location === -1) return;

    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
  }

  // Clear canvas
  clear(color?: [number, number, number, number]): void {
    if (!this.gl) return;

    if (color) {
      this.gl.clearColor(color[0], color[1], color[2], color[3]);
    }
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // Draw arrays
  drawArrays(mode: number, first: number, count: number): void {
    if (!this.gl) return;
    this.gl.drawArrays(mode, first, count);
  }

  // Draw elements
  drawElements(mode: number, count: number, type: number, offset: number): void {
    if (!this.gl) return;
    this.gl.drawElements(mode, count, type, offset);
  }

  // Set viewport
  setViewport(x: number, y: number, width: number, height: number): void {
    if (!this.gl) return;
    this.gl.viewport(x, y, width, height);
  }

  // Enable depth test
  enableDepthTest(): void {
    if (!this.gl) return;
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  // Disable depth test
  disableDepthTest(): void {
    if (!this.gl) return;
    this.gl.disable(this.gl.DEPTH_TEST);
  }

  // Enable blending
  enableBlending(): void {
    if (!this.gl) return;
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  // Disable blending
  disableBlending(): void {
    if (!this.gl) return;
    this.gl.disable(this.gl.BLEND);
  }

  // Clean up resources
  cleanup(): void {
    if (!this.gl) return;

    // Delete programs
    this.programs.forEach(program => {
      this.gl?.deleteProgram(program);
    });
    this.programs.clear();

    // Delete buffers
    this.buffers.forEach(buffer => {
      this.gl?.deleteBuffer(buffer);
    });
    this.buffers.clear();

    // Delete textures
    this.textures.forEach(texture => {
      this.gl?.deleteTexture(texture);
    });
    this.textures.clear();

    this.currentProgram = null;
    this.gl = null;
    this.canvas = null;
  }

  // Check if WebGL2 is supported
  static isSupported(): boolean {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  }
}

// Example usage:
/*
// Create WebGL2 manager instance
const webgl2Manager = WebGL2Manager.getInstance();

// Check if WebGL2 is supported
if (WebGL2Manager.isSupported()) {
  // Initialize WebGL2 context
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  webgl2Manager.initialize(canvas, {
    antialias: true,
    depth: true
  });

  // Create shader program
  const program = webgl2Manager.createProgram('basic', {
    vertex: `#version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }`,
    fragment: `#version 300 es
      precision highp float;
      out vec4 fragColor;
      void main() {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }`
  });

  // Create buffer
  const vertices = new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
     0.0,  0.5
  ]);
  webgl2Manager.createBuffer('vertices', {
    data: vertices,
    usage: WebGL2RenderingContext.STATIC_DRAW
  });

  // Use program and set up attributes
  webgl2Manager.useProgram('basic');
  webgl2Manager.bindBuffer('vertices');
  webgl2Manager.setVertexAttribute(
    'position',
    2,
    WebGL2RenderingContext.FLOAT,
    false,
    0,
    0
  );

  // Clear and draw
  webgl2Manager.clear([0, 0, 0, 1]);
  webgl2Manager.drawArrays(
    WebGL2RenderingContext.TRIANGLES,
    0,
    3
  );

  // Clean up when done
  webgl2Manager.cleanup();
}
*/