type ShareData = {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
};

type ShareOptions = {
  fallbackToClipboard?: boolean;
  fallbackToEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export class ShareManager {
  private static instance: ShareManager;
  private clipboardManager: any; // Reference to ClipboardManager if available

  private constructor() {
    // Dynamically import ClipboardManager if needed
    import('./clipboard').then(({ ClipboardManager }) => {
      this.clipboardManager = ClipboardManager.getInstance();
    }).catch(error => {
      console.warn('ClipboardManager not available:', error);
    });
  }

  static getInstance(): ShareManager {
    if (!ShareManager.instance) {
      ShareManager.instance = new ShareManager();
    }
    return ShareManager.instance;
  }

  // Share content using Web Share API with fallbacks
  async share(data: ShareData, options: ShareOptions = {}): Promise<void> {
    const {
      fallbackToClipboard = true,
      fallbackToEmail = true,
      emailSubject = '',
      emailBody = '',
      onSuccess,
      onError
    } = options;

    try {
      // Try Web Share API first
      if (this.isWebShareSupported(data)) {
        await navigator.share(data);
        onSuccess?.();
        return;
      }

      // Try Web Share API without files if files are not supported
      if (data.files && this.isBasicWebShareSupported()) {
        const { files, ...basicData } = data;
        await navigator.share(basicData);
        onSuccess?.();
        return;
      }

      // Fallback to clipboard
      if (fallbackToClipboard) {
        await this.fallbackToClipboard(data);
        onSuccess?.();
        return;
      }

      // Fallback to email
      if (fallbackToEmail) {
        this.fallbackToEmail(data, emailSubject, emailBody);
        onSuccess?.();
        return;
      }

      throw new Error('No sharing method available');
    } catch (error) {
      console.error('Sharing failed:', error);
      onError?.(error instanceof Error ? error : new Error('Sharing failed'));
    }
  }

  // Check if Web Share API is supported for the given data
  isWebShareSupported(data: ShareData): boolean {
    if (!navigator.share) return false;

    // Check if files are included and if they're supported
    if (data.files?.length) {
      return (
        'canShare' in navigator &&
        navigator.canShare?.(data)
      );
    }

    return true;
  }

  // Check if basic Web Share API is supported (without files)
  isBasicWebShareSupported(): boolean {
    return 'share' in navigator;
  }

  // Share content to specific targets
  async shareToTarget(
    target: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp',
    data: ShareData
  ): Promise<void> {
    const url = this.buildSharingUrl(target, data);
    if (url) {
      window.open(url, '_blank');
    } else {
      throw new Error(`Sharing to ${target} is not supported`);
    }
  }

  // Private methods
  private async fallbackToClipboard(data: ShareData): Promise<void> {
    if (!this.clipboardManager) {
      throw new Error('ClipboardManager not available');
    }

    const text = this.buildShareText(data);
    await this.clipboardManager.writeText(text);
  }

  private fallbackToEmail(
    data: ShareData,
    subject: string,
    body: string
  ): void {
    const emailSubject = subject || data.title || '';
    const emailBody = body || this.buildShareText(data);
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  }

  private buildShareText(data: ShareData): string {
    const parts = [];

    if (data.title) parts.push(data.title);
    if (data.text) parts.push(data.text);
    if (data.url) parts.push(data.url);

    return parts.join('\n');
  }

  private buildSharingUrl(
    target: string,
    data: ShareData
  ): string | null {
    const text = data.text || data.title || '';
    const url = data.url || window.location.href;

    switch (target) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}}`;

      default:
        return null;
    }
  }
}

// Example usage:
/*
// Create share manager instance
const shareManager = ShareManager.getInstance();

// Share content
try {
  await shareManager.share({
    title: 'Check this out!',
    text: 'This is an interesting article about web development.',
    url: 'https://example.com/article',
    files: [new File(['hello'], 'hello.txt', { type: 'text/plain' })]
  }, {
    fallbackToClipboard: true,
    fallbackToEmail: true,
    emailSubject: 'Interesting Article',
    emailBody: 'I thought you might find this interesting:',
    onSuccess: () => {
      console.log('Content shared successfully');
    },
    onError: (error) => {
      console.error('Sharing failed:', error);
    }
  });
} catch (error) {
  console.error('Sharing failed:', error);
}

// Share to specific platform
try {
  await shareManager.shareToTarget('twitter', {
    text: 'Check out this awesome article!',
    url: 'https://example.com/article'
  });
} catch (error) {
  console.error('Sharing to Twitter failed:', error);
}

// Check support
const isSupported = shareManager.isWebShareSupported({
  title: 'Test',
  text: 'Test content',
  url: 'https://example.com'
});
console.log('Web Share API supported:', isSupported);
*/