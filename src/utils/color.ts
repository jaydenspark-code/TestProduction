type RGB = {
  r: number;
  g: number;
  b: number;
};

type HSL = {
  h: number;
  s: number;
  l: number;
};

type HSLA = HSL & { a: number };
type RGBA = RGB & { a: number };

export class Color {
  private r: number;
  private g: number;
  private b: number;
  private a: number;

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = this.clamp(r, 0, 255);
    this.g = this.clamp(g, 0, 255);
    this.b = this.clamp(b, 0, 255);
    this.a = this.clamp(a, 0, 1);
  }

  // Factory methods
  static fromHex(hex: string): Color {
    const normalized = hex.toLowerCase().replace(/^#/, '');
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    const a = normalized.length === 8
      ? parseInt(normalized.slice(6, 8), 16) / 255
      : 1;

    return new Color(r, g, b, a);
  }

  static fromRGB(r: number, g: number, b: number): Color {
    return new Color(r, g, b);
  }

  static fromRGBA(r: number, g: number, b: number, a: number): Color {
    return new Color(r, g, b, a);
  }

  static fromHSL(h: number, s: number, l: number): Color {
    const rgb = Color.hslToRgb(h, s, l);
    return new Color(rgb.r, rgb.g, rgb.b);
  }

  static fromHSLA(h: number, s: number, l: number, a: number): Color {
    const rgb = Color.hslToRgb(h, s, l);
    return new Color(rgb.r, rgb.g, rgb.b, a);
  }

  static fromString(color: string): Color {
    color = color.toLowerCase().trim();

    // Hex
    if (color.startsWith('#')) {
      return Color.fromHex(color);
    }

    // RGB/RGBA
    if (color.startsWith('rgb')) {
      const values = color
        .replace(/[rgba()\s]/g, '')
        .split(',')
        .map(Number);

      return values.length === 4
        ? Color.fromRGBA(values[0], values[1], values[2], values[3])
        : Color.fromRGB(values[0], values[1], values[2]);
    }

    // HSL/HSLA
    if (color.startsWith('hsl')) {
      const values = color
        .replace(/[hsla()%\s]/g, '')
        .split(',')
        .map(Number);

      return values.length === 4
        ? Color.fromHSLA(values[0], values[1], values[2], values[3])
        : Color.fromHSL(values[0], values[1], values[2]);
    }

    // Named colors
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    ctx.fillStyle = color;
    const [r, g, b] = ctx.fillStyle
      .replace(/[^0-9,]/g, '')
      .split(',')
      .map(Number);

    return new Color(r, g, b);
  }

  // Conversion methods
  toRGB(): RGB {
    return {
      r: Math.round(this.r),
      g: Math.round(this.g),
      b: Math.round(this.b)
    };
  }

  toRGBA(): RGBA {
    return { ...this.toRGB(), a: this.a };
  }

  toHSL(): HSL {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  toHSLA(): HSLA {
    return { ...this.toHSL(), a: this.a };
  }

  toHex(includeAlpha: boolean = false): string {
    const hex = [
      Math.round(this.r).toString(16).padStart(2, '0'),
      Math.round(this.g).toString(16).padStart(2, '0'),
      Math.round(this.b).toString(16).padStart(2, '0')
    ];

    if (includeAlpha) {
      hex.push(Math.round(this.a * 255).toString(16).padStart(2, '0'));
    }

    return `#${hex.join('')}`;
  }

  toString(format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' = 'rgba'): string {
    switch (format) {
      case 'hex':
        return this.toHex();
      case 'rgb': {
        const { r, g, b } = this.toRGB();
        return `rgb(${r}, ${g}, ${b})`;
      }
      case 'rgba': {
        const { r, g, b, a } = this.toRGBA();
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
      case 'hsl': {
        const { h, s, l } = this.toHSL();
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
      case 'hsla': {
        const { h, s, l, a } = this.toHSLA();
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
      }
      default:
        return this.toHex();
    }
  }

  // Modification methods
  lighten(amount: number): Color {
    const hsl = this.toHSL();
    return Color.fromHSLA(
      hsl.h,
      hsl.s,
      Math.min(100, hsl.l + amount),
      this.a
    );
  }

  darken(amount: number): Color {
    const hsl = this.toHSL();
    return Color.fromHSLA(
      hsl.h,
      hsl.s,
      Math.max(0, hsl.l - amount),
      this.a
    );
  }

  saturate(amount: number): Color {
    const hsl = this.toHSL();
    return Color.fromHSLA(
      hsl.h,
      Math.min(100, hsl.s + amount),
      hsl.l,
      this.a
    );
  }

  desaturate(amount: number): Color {
    const hsl = this.toHSL();
    return Color.fromHSLA(
      hsl.h,
      Math.max(0, hsl.s - amount),
      hsl.l,
      this.a
    );
  }

  setAlpha(alpha: number): Color {
    return new Color(this.r, this.g, this.b, this.clamp(alpha, 0, 1));
  }

  // Blend methods
  mix(color: Color, weight: number = 0.5): Color {
    const w = this.clamp(weight, 0, 1);
    return new Color(
      Math.round(this.r * (1 - w) + color.r * w),
      Math.round(this.g * (1 - w) + color.g * w),
      Math.round(this.b * (1 - w) + color.b * w),
      this.a * (1 - w) + color.a * w
    );
  }

  // Utility methods
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private static hslToRgb(h: number, s: number, l: number): RGB {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // Static utility methods
  static isValidHex(hex: string): boolean {
    return /^#([A-Fa-f0-9]{3}){1,2}$|^#([A-Fa-f0-9]{4}){1,2}$/.test(hex);
  }

  static random(): Color {
    return new Color(
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    );
  }

  static getContrastColor(color: Color): Color {
    const rgb = color.toRGB();
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? new Color(0, 0, 0) : new Color(255, 255, 255);
  }
}

// Example usage:
/*
// Create colors
const color1 = new Color(255, 0, 0); // Red
const color2 = Color.fromHex('#00ff00'); // Green
const color3 = Color.fromString('blue'); // Blue
const color4 = Color.fromHSL(180, 50, 50); // Teal

// Convert between formats
console.log(color1.toHex()); // #ff0000
console.log(color1.toString('rgb')); // rgb(255, 0, 0)
console.log(color1.toHSL()); // { h: 0, s: 100, l: 50 }

// Modify colors
const lightRed = color1.lighten(20);
const darkRed = color1.darken(20);
const saturatedRed = color1.saturate(20);
const transparentRed = color1.setAlpha(0.5);

// Blend colors
const purple = color1.mix(color3, 0.5);

// Get contrast color
const textColor = Color.getContrastColor(color1);

// Generate random color
const randomColor = Color.random();
*/