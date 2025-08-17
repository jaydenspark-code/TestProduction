type FileMetadata = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

type FileValidationOptions = {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
};

type ImageResizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
};

export class FileUtil {
  private static readonly DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
  private static readonly IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  // Get file metadata
  static getMetadata(file: File): FileMetadata {
    return {
      name: file.name,
      size: file.size,
      type: file.type || this.getMimeType(file.name),
      lastModified: file.lastModified
    };
  }

  // Get file extension
  static getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Get MIME type from filename
  static getMimeType(filename: string): string {
    const ext = this.getExtension(filename);
    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      xml: 'application/xml',
      pdf: 'application/pdf',
      zip: 'application/zip',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      mp3: 'audio/mpeg',
      mp4: 'video/mp4',
      wav: 'audio/wav',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      webm: 'video/webm'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Format file size
  static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // Validate file
  static validate(
    file: File,
    options: FileValidationOptions = {}
  ): { valid: boolean; error?: string } {
    const {
      maxSize,
      allowedTypes,
      allowedExtensions
    } = options;

    // Check file size
    if (maxSize && file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${this.formatSize(maxSize)}`
      };
    }

    // Check file type
    if (allowedTypes?.length) {
      const fileType = file.type || this.getMimeType(file.name);
      if (!allowedTypes.includes(fileType)) {
        return {
          valid: false,
          error: `File type ${fileType} is not allowed`
        };
      }
    }

    // Check file extension
    if (allowedExtensions?.length) {
      const extension = this.getExtension(file.name);
      if (!allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `File extension .${extension} is not allowed`
        };
      }
    }

    return { valid: true };
  }

  // Read file as text
  static async readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // Read file as data URL
  static async readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // Read file as array buffer
  static async readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  // Read file in chunks
  static async *readInChunks(
    file: File,
    chunkSize: number = this.DEFAULT_CHUNK_SIZE
  ): AsyncGenerator<ArrayBuffer> {
    let offset = 0;
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      yield await this.readAsArrayBuffer(chunk);
      offset += chunkSize;
    }
  }

  // Check if file is an image
  static isImage(file: File): boolean {
    return this.IMAGE_TYPES.includes(
      file.type || this.getMimeType(file.name)
    );
  }

  // Resize image
  static async resizeImage(
    file: File,
    options: ImageResizeOptions = {}
  ): Promise<Blob> {
    if (!this.isImage(file)) {
      throw new Error('File is not an image');
    }

    const {
      maxWidth = Infinity,
      maxHeight = Infinity,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    // Create image element
    const img = new Image();
    const imageUrl = await this.readAsDataURL(file);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Draw and export image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imageUrl;
    });
  }

  // Download file
  static download(data: Blob | string, filename: string): void {
    const blob = typeof data === 'string' ? new Blob([data]) : data;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Create file from base64
  static base64ToFile(
    base64: string,
    filename: string,
    type: string = 'application/octet-stream'
  ): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || type;
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  // Convert file to base64
  static async fileToBase64(file: File): Promise<string> {
    return await this.readAsDataURL(file);
  }
}

// Example usage:
/*
// Get file metadata
const metadata = FileUtil.getMetadata(file);
console.log(metadata);

// Validate file
const validation = FileUtil.validate(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['jpg', 'jpeg', 'png']
});

if (!validation.valid) {
  console.error(validation.error);
}

// Read file content
const text = await FileUtil.readAsText(file);
console.log(text);

// Read large file in chunks
for await (const chunk of FileUtil.readInChunks(file)) {
  console.log('Chunk size:', chunk.byteLength);
}

// Resize image
const resizedImage = await FileUtil.resizeImage(file, {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.8,
  format: 'jpeg'
});

// Download file
FileUtil.download(resizedImage, 'resized-image.jpg');

// Convert between base64 and File
const base64 = await FileUtil.fileToBase64(file);
const newFile = FileUtil.base64ToFile(base64, 'converted-file.jpg');
*/