type DropZoneOptions = {
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  multiple?: boolean;
  customPreview?: boolean;
  preventDefaultDrop?: boolean;
};

type DragDropEvents = {
  onDragEnter?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent, files: File[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
};

type DragPreviewOptions = {
  element: HTMLElement;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  scale?: number;
};

export class DragDropManager {
  private static instance: DragDropManager;
  private dropZone: HTMLElement | null = null;
  private options: DropZoneOptions = {};
  private events: DragDropEvents = {};
  private dragCounter = 0;
  private dragPreview: HTMLElement | null = null;

  private constructor() {}

  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager();
    }
    return DragDropManager.instance;
  }

  // Initialize drop zone
  initialize(element: HTMLElement, options: DropZoneOptions = {}): void {
    this.dropZone = element;
    this.options = options;
    this.setupDropZone();
  }

  // Setup drop zone event listeners
  private setupDropZone(): void {
    if (!this.dropZone) return;

    this.dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
  }

  // Set event handlers
  setEvents(events: DragDropEvents): void {
    this.events = events;
  }

  // Handle drag enter
  private handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter++;

    if (this.dragCounter === 1) {
      this.dropZone?.classList.add('drag-active');
      this.events.onDragEnter?.(event);
    }
  }

  // Handle drag leave
  private handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter--;

    if (this.dragCounter === 0) {
      this.dropZone?.classList.remove('drag-active');
      this.events.onDragLeave?.(event);
    }
  }

  // Handle drag over
  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    this.events.onDragOver?.(event);
  }

  // Handle drop
  private async handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragCounter = 0;
    this.dropZone?.classList.remove('drag-active');

    const files = Array.from(event.dataTransfer?.files || []);

    try {
      // Validate files
      const validFiles = await this.validateFiles(files);

      if (validFiles.length > 0) {
        this.events.onDrop?.(event, validFiles);
      }
    } catch (error) {
      this.events.onError?.(error as Error);
    }
  }

  // Validate files
  private async validateFiles(files: File[]): Promise<File[]> {
    if (!this.options.multiple && files.length > 1) {
      throw new Error('Multiple files are not allowed');
    }

    const validFiles: File[] = [];

    for (const file of files) {
      // Check file type
      if (this.options.acceptedFileTypes?.length) {
        const fileType = file.type || this.getFileExtension(file.name);
        if (!this.options.acceptedFileTypes.some(type => 
          fileType.toLowerCase().includes(type.toLowerCase())
        )) {
          throw new Error(`File type ${fileType} is not allowed`);
        }
      }

      // Check file size
      if (this.options.maxFileSize && file.size > this.options.maxFileSize) {
        throw new Error(`File size exceeds ${this.formatFileSize(this.options.maxFileSize)}`);
      }

      validFiles.push(file);
    }

    return validFiles;
  }

  // Get file extension
  private getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  // Format file size
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // Make element draggable
  makeDraggable(element: HTMLElement, options: DragPreviewOptions): void {
    element.draggable = true;

    element.addEventListener('dragstart', (event) => {
      if (!this.options.customPreview) return;

      const preview = options.element.cloneNode(true) as HTMLElement;
      preview.style.position = 'fixed';
      preview.style.pointerEvents = 'none';
      preview.style.zIndex = '9999';
      preview.style.opacity = `${options.opacity || 0.8}`;
      preview.style.transform = `scale(${options.scale || 1})`;

      document.body.appendChild(preview);
      this.dragPreview = preview;

      // Set drag image
      if (event.dataTransfer) {
        event.dataTransfer.setDragImage(
          preview,
          options.offsetX || 0,
          options.offsetY || 0
        );
      }
    });

    element.addEventListener('drag', (event) => {
      if (!this.dragPreview) return;

      // Update preview position
      this.dragPreview.style.left = `${event.clientX + (options.offsetX || 0)}px`;
      this.dragPreview.style.top = `${event.clientY + (options.offsetY || 0)}px`;
    });

    element.addEventListener('dragend', () => {
      if (this.dragPreview) {
        document.body.removeChild(this.dragPreview);
        this.dragPreview = null;
      }
    });
  }

  // Upload files with progress
  async uploadFiles(files: File[], url: string): Promise<void> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          this.events.onProgress?.(progress);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', url);
        xhr.send(formData);
      });
    } catch (error) {
      this.events.onError?.(error as Error);
    }
  }

  // Clean up resources
  cleanup(): void {
    if (!this.dropZone) return;

    this.dropZone.removeEventListener('dragenter', this.handleDragEnter.bind(this));
    this.dropZone.removeEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropZone.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.dropZone.removeEventListener('drop', this.handleDrop.bind(this));

    if (this.dragPreview && document.body.contains(this.dragPreview)) {
      document.body.removeChild(this.dragPreview);
    }

    this.dropZone = null;
    this.options = {};
    this.events = {};
    this.dragCounter = 0;
    this.dragPreview = null;
  }

  // Check if drag and drop is supported
  static isSupported(): boolean {
    const div = document.createElement('div');
    return (
      ('draggable' in div || ('ondragstart' in div && 'ondrop' in div)) &&
      'FormData' in window &&
      'FileReader' in window
    );
  }
}

// Example usage:
/*
// Create drag and drop manager instance
const dragDropManager = DragDropManager.getInstance();

// Check if drag and drop is supported
if (DragDropManager.isSupported()) {
  // Initialize drop zone
  const dropZone = document.getElementById('dropZone');
  dragDropManager.initialize(dropZone, {
    acceptedFileTypes: ['.jpg', '.png', '.pdf'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    customPreview: true
  });

  // Set event handlers
  dragDropManager.setEvents({
    onDragEnter: (event) => {
      console.log('Drag enter:', event);
    },
    onDrop: async (event, files) => {
      console.log('Files dropped:', files);
      await dragDropManager.uploadFiles(files, '/api/upload');
    },
    onError: (error) => {
      console.error('Error:', error);
    },
    onProgress: (progress) => {
      console.log('Upload progress:', progress);
    }
  });

  // Make element draggable with custom preview
  const draggable = document.getElementById('draggable');
  const preview = document.getElementById('preview');
  dragDropManager.makeDraggable(draggable, {
    element: preview,
    offsetX: 10,
    offsetY: 10,
    opacity: 0.8,
    scale: 0.8
  });

  // Clean up when done
  dragDropManager.cleanup();
}
*/