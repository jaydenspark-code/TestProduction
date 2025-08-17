type SVGOptions = {
  width?: number;
  height?: number;
  viewBox?: string;
  preserveAspectRatio?: string;
  xmlns?: string;
};

type SVGAttributes = {
  [key: string]: string | number | boolean;
};

type SVGAnimation = {
  attributeName: string;
  from: string | number;
  to: string | number;
  dur: string;
  repeatCount?: string | number;
  begin?: string;
  fill?: 'freeze' | 'remove';
  calcMode?: 'linear' | 'spline' | 'discrete' | 'paced';
  keySplines?: string;
  keyTimes?: string;
  values?: string;
};

export class SVGManager {
  private static instance: SVGManager;
  private svg: SVGSVGElement | null = null;
  private defs: SVGDefsElement | null = null;
  private elements: Map<string, SVGElement> = new Map();
  private animations: Map<string, SVGAnimateElement> = new Map();

  private constructor() {}

  static getInstance(): SVGManager {
    if (!SVGManager.instance) {
      SVGManager.instance = new SVGManager();
    }
    return SVGManager.instance;
  }

  // Initialize SVG
  initialize(container: HTMLElement, options: SVGOptions = {}): void {
    const {
      width = 100,
      height = 100,
      viewBox = `0 0 ${width} ${height}`,
      preserveAspectRatio = 'xMidYMid meet',
      xmlns = 'http://www.w3.org/2000/svg'
    } = options;

    this.svg = document.createElementNS(xmlns, 'svg');
    this.setAttributes(this.svg, {
      width,
      height,
      viewBox,
      preserveAspectRatio,
      xmlns
    });

    // Create defs element for reusable elements
    this.defs = document.createElementNS(xmlns, 'defs');
    this.svg.appendChild(this.defs);

    container.appendChild(this.svg);
  }

  // Set attributes helper
  private setAttributes(element: SVGElement, attributes: SVGAttributes): void {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, value.toString());
      }
    });
  }

  // Create basic shapes
  createRect(id: string, attributes: SVGAttributes): SVGRectElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const rect = document.createElementNS(this.svg.namespaceURI, 'rect');
    this.setAttributes(rect, attributes);
    this.elements.set(id, rect);
    this.svg.appendChild(rect);
    return rect;
  }

  createCircle(id: string, attributes: SVGAttributes): SVGCircleElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const circle = document.createElementNS(this.svg.namespaceURI, 'circle');
    this.setAttributes(circle, attributes);
    this.elements.set(id, circle);
    this.svg.appendChild(circle);
    return circle;
  }

  createEllipse(id: string, attributes: SVGAttributes): SVGEllipseElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const ellipse = document.createElementNS(this.svg.namespaceURI, 'ellipse');
    this.setAttributes(ellipse, attributes);
    this.elements.set(id, ellipse);
    this.svg.appendChild(ellipse);
    return ellipse;
  }

  createLine(id: string, attributes: SVGAttributes): SVGLineElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const line = document.createElementNS(this.svg.namespaceURI, 'line');
    this.setAttributes(line, attributes);
    this.elements.set(id, line);
    this.svg.appendChild(line);
    return line;
  }

  createPath(id: string, attributes: SVGAttributes): SVGPathElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const path = document.createElementNS(this.svg.namespaceURI, 'path');
    this.setAttributes(path, attributes);
    this.elements.set(id, path);
    this.svg.appendChild(path);
    return path;
  }

  createPolygon(id: string, attributes: SVGAttributes): SVGPolygonElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const polygon = document.createElementNS(this.svg.namespaceURI, 'polygon');
    this.setAttributes(polygon, attributes);
    this.elements.set(id, polygon);
    this.svg.appendChild(polygon);
    return polygon;
  }

  createText(id: string, text: string, attributes: SVGAttributes): SVGTextElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const textElement = document.createElementNS(this.svg.namespaceURI, 'text');
    textElement.textContent = text;
    this.setAttributes(textElement, attributes);
    this.elements.set(id, textElement);
    this.svg.appendChild(textElement);
    return textElement;
  }

  // Create gradient
  createLinearGradient(id: string, stops: Array<{ offset: string; color: string; opacity?: string }>): SVGLinearGradientElement {
    if (!this.svg || !this.defs) throw new Error('SVG not initialized');

    const gradient = document.createElementNS(this.svg.namespaceURI, 'linearGradient');
    gradient.setAttribute('id', id);

    stops.forEach(stop => {
      const stopElement = document.createElementNS(this.svg.namespaceURI, 'stop');
      stopElement.setAttribute('offset', stop.offset);
      stopElement.setAttribute('stop-color', stop.color);
      if (stop.opacity) {
        stopElement.setAttribute('stop-opacity', stop.opacity);
      }
      gradient.appendChild(stopElement);
    });

    this.defs.appendChild(gradient);
    return gradient;
  }

  createRadialGradient(id: string, stops: Array<{ offset: string; color: string; opacity?: string }>): SVGRadialGradientElement {
    if (!this.svg || !this.defs) throw new Error('SVG not initialized');

    const gradient = document.createElementNS(this.svg.namespaceURI, 'radialGradient');
    gradient.setAttribute('id', id);

    stops.forEach(stop => {
      const stopElement = document.createElementNS(this.svg.namespaceURI, 'stop');
      stopElement.setAttribute('offset', stop.offset);
      stopElement.setAttribute('stop-color', stop.color);
      if (stop.opacity) {
        stopElement.setAttribute('stop-opacity', stop.opacity);
      }
      gradient.appendChild(stopElement);
    });

    this.defs.appendChild(gradient);
    return gradient;
  }

  // Create pattern
  createPattern(id: string, attributes: SVGAttributes, content: SVGElement): SVGPatternElement {
    if (!this.svg || !this.defs) throw new Error('SVG not initialized');

    const pattern = document.createElementNS(this.svg.namespaceURI, 'pattern');
    pattern.setAttribute('id', id);
    this.setAttributes(pattern, attributes);
    pattern.appendChild(content);
    this.defs.appendChild(pattern);
    return pattern;
  }

  // Create clip path
  createClipPath(id: string, content: SVGElement): SVGClipPathElement {
    if (!this.svg || !this.defs) throw new Error('SVG not initialized');

    const clipPath = document.createElementNS(this.svg.namespaceURI, 'clipPath');
    clipPath.setAttribute('id', id);
    clipPath.appendChild(content);
    this.defs.appendChild(clipPath);
    return clipPath;
  }

  // Create mask
  createMask(id: string, content: SVGElement): SVGMaskElement {
    if (!this.svg || !this.defs) throw new Error('SVG not initialized');

    const mask = document.createElementNS(this.svg.namespaceURI, 'mask');
    mask.setAttribute('id', id);
    mask.appendChild(content);
    this.defs.appendChild(mask);
    return mask;
  }

  // Create filter
  createFilter(id: string, attributes: SVGAttributes): SVGFilterElement {
    if (!this.svg || !this.defs) throw new Error('SVG not initialized');

    const filter = document.createElementNS(this.svg.namespaceURI, 'filter');
    filter.setAttribute('id', id);
    this.setAttributes(filter, attributes);
    this.defs.appendChild(filter);
    return filter;
  }

  // Add animation
  addAnimation(elementId: string, animationId: string, animation: SVGAnimation): SVGAnimateElement {
    if (!this.svg) throw new Error('SVG not initialized');

    const element = this.elements.get(elementId);
    if (!element) throw new Error(`Element '${elementId}' not found`);

    const animate = document.createElementNS(this.svg.namespaceURI, 'animate');
    this.setAttributes(animate, animation as unknown as SVGAttributes);
    element.appendChild(animate);
    this.animations.set(animationId, animate);
    return animate;
  }

  // Start animation
  startAnimation(animationId: string): void {
    const animation = this.animations.get(animationId);
    if (animation) {
      animation.beginElement();
    }
  }

  // Stop animation
  stopAnimation(animationId: string): void {
    const animation = this.animations.get(animationId);
    if (animation) {
      animation.endElement();
    }
  }

  // Get element by id
  getElementById(id: string): SVGElement | undefined {
    return this.elements.get(id);
  }

  // Update element attributes
  updateElement(id: string, attributes: SVGAttributes): void {
    const element = this.elements.get(id);
    if (element) {
      this.setAttributes(element, attributes);
    }
  }

  // Remove element
  removeElement(id: string): void {
    const element = this.elements.get(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      this.elements.delete(id);
    }
  }

  // Get SVG as string
  toString(): string {
    return this.svg?.outerHTML || '';
  }

  // Clean up resources
  cleanup(): void {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
    this.elements.clear();
    this.animations.clear();
    this.svg = null;
    this.defs = null;
  }

  // Check if SVG is supported
  static isSupported(): boolean {
    return typeof SVGSVGElement !== 'undefined';
  }
}

// Example usage:
/*
// Create SVG manager instance
const svgManager = SVGManager.getInstance();

// Check if SVG is supported
if (SVGManager.isSupported()) {
  // Initialize SVG
  const container = document.getElementById('container')!;
  svgManager.initialize(container, {
    width: 500,
    height: 300,
    viewBox: '0 0 500 300'
  });

  // Create gradient
  svgManager.createLinearGradient('gradient1', [
    { offset: '0%', color: '#ff0000' },
    { offset: '100%', color: '#0000ff' }
  ]);

  // Create circle with gradient
  svgManager.createCircle('circle1', {
    cx: '250',
    cy: '150',
    r: '50',
    fill: 'url(#gradient1)'
  });

  // Add animation
  svgManager.addAnimation('circle1', 'animation1', {
    attributeName: 'r',
    from: '50',
    to: '80',
    dur: '2s',
    repeatCount: 'indefinite'
  });

  // Start animation
  svgManager.startAnimation('animation1');

  // Clean up when done
  svgManager.cleanup();
}
*/