type ClipboardItem = {
  type: string;
  value: string | Blob;
};

type ClipboardOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export class ClipboardManager {
  private static instance: ClipboardManager;

  private constructor() {}

  static getInstance(): ClipboardManager {
    if (!ClipboardManager.instance) {
      ClipboardManager.instance = new ClipboardManager();
    }
    return ClipboardManager.instance;
  }

  // Check if clipboard API is supported
  isSupported(): boolean {
    return !!navigator.clipboard;
  }

  // Write text to clipboard
  async writeText(text: string, options: ClipboardOptions = {}): Promise<void> {
    try {
      if (!this.isSupported()) {
        throw new Error('Clipboard API not supported');
      }

      await navigator.clipboard.writeText(text);
      options.onSuccess?.();
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  // Read text from clipboard
  async readText(options: ClipboardOptions = {}): Promise<string> {
    try {
      if (!this.isSupported()) {
        throw new Error('Clipboard API not supported');
      }

      const text = await navigator.clipboard.readText();
      options.onSuccess?.();
      return text;
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  // Write multiple items to clipboard
  async write(
    items: ClipboardItem[],
    options: ClipboardOptions = {}
  ): Promise<void> {
    try {
      if (!this.isSupported()) {
        throw new Error('Clipboard API not supported');
      }

      const clipboardItems = items.map(item => {
        const blob = item.value instanceof Blob
          ? item.value
          : new Blob([item.value.toString()], { type: item.type });

        return new window.ClipboardItem({
          [item.type]: blob
        });
      });

      await navigator.clipboard.write(clipboardItems);
      options.onSuccess?.();
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  // Read multiple items from clipboard
  async read(options: ClipboardOptions = {}): Promise<ClipboardItem[]> {
    try {
      if (!this.isSupported()) {
        throw new Error('Clipboard API not supported');
      }

      const clipboardItems = await navigator.clipboard.read();
      const items: ClipboardItem[] = [];

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          const blob = await clipboardItem.getType(type);
          items.push({ type, value: blob });
        }
      }

      options.onSuccess?.();
      return items;
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  // Copy image to clipboard
  async copyImage(
    image: HTMLImageElement | HTMLCanvasElement | Blob,
    options: ClipboardOptions = {}
  ): Promise<void> {
    try {
      let imageBlob: Blob;

      if (image instanceof Blob) {
        imageBlob = image;
      } else if (image instanceof HTMLCanvasElement) {
        imageBlob = await new Promise((resolve) => {
          image.toBlob((blob) => resolve(blob!));
        });
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(image, 0, 0);
        imageBlob = await new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob!));
        });
      }

      await this.write([
        { type: imageBlob.type, value: imageBlob }
      ], options);
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  // Copy rich text (HTML) to clipboard
  async copyRichText(
    text: string,
    html: string,
    options: ClipboardOptions = {}
  ): Promise<void> {
    try {
      await this.write([
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ], options);
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  // Copy URL to clipboard
  async copyUrl(
    url: string | URL,
    options: ClipboardOptions = {}
  ): Promise<void> {
    try {
      const urlString = url.toString();
      await this.writeText(urlString, options);
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  // Copy to clipboard with fallback
  copyWithFallback(
    text: string,
    options: ClipboardOptions = {}
  ): boolean {
    try {
      if (this.isSupported()) {
        this.writeText(text, options);
        return true;
      }

      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        options.onSuccess?.();
        return true;
      } catch (err) {
        options.onError?.(err as Error);
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      options.onError?.(error as Error);
      return false;
    }
  }

  // Copy element content to clipboard
  async copyElement(
    element: HTMLElement,
    options: ClipboardOptions = {}
  ): Promise<void> {
    try {
      const text = element.innerText || element.textContent || '';
      const html = element.innerHTML;

      await this.copyRichText(text, html, options);
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }
}

// Example usage:
/*
const clipboard = ClipboardManager.getInstance();

// Copy text
await clipboard.writeText('Hello, World!', {
  onSuccess: () => console.log('Text copied!'),
  onError: (error) => console.error('Copy failed:', error)
});

// Read text
const text = await clipboard.readText();

// Copy image
const image = document.querySelector('img');
if (image) {
  await clipboard.copyImage(image);
}

// Copy rich text
await clipboard.copyRichText(
  'Hello, World!',
  '<strong>Hello</strong>, World!'
);

// Copy URL
await clipboard.copyUrl('https://example.com');

// Copy with fallback
clipboard.copyWithFallback('Fallback text');

// Copy element content
const element = document.querySelector('.content');
if (element) {
  await clipboard.copyElement(element);
}

// Read multiple formats
const items = await clipboard.read();
for (const item of items) {
  console.log(`Type: ${item.type}`);
  if (item.type.startsWith('text/')) {
    const text = await new Response(item.value).text();
    console.log('Content:', text);
  }
}
*/