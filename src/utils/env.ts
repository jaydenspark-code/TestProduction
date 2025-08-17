type EnvVar = string | number | boolean;

interface EnvConfig {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'url';
    required?: boolean;
    default?: EnvVar;
    validate?: (value: EnvVar) => boolean;
  };
}

class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvError';
  }
}

export class Env {
  private static instance: Env;
  private cache: Map<string, EnvVar> = new Map();
  private config: EnvConfig;

  private constructor(config: EnvConfig) {
    this.config = config;
    this.validateConfig();
  }

  static initialize(config: EnvConfig): Env {
    if (!Env.instance) {
      Env.instance = new Env(config);
    }
    return Env.instance;
  }

  static getInstance(): Env {
    if (!Env.instance) {
      throw new EnvError('Env not initialized. Call initialize() first.');
    }
    return Env.instance;
  }

  private validateConfig(): void {
    for (const [key, settings] of Object.entries(this.config)) {
      const value = import.meta.env[key];

      if (settings.required && value === undefined && settings.default === undefined) {
        throw new EnvError(`Required environment variable ${key} is missing`);
      }

      if (value !== undefined) {
        const parsedValue = this.parseValue(value, settings.type);
        if (settings.validate && !settings.validate(parsedValue)) {
          throw new EnvError(`Environment variable ${key} failed validation`);
        }
        this.cache.set(key, parsedValue);
      } else if (settings.default !== undefined) {
        this.cache.set(key, settings.default);
      }
    }
  }

  private parseValue(value: string, type: string): EnvVar {
    switch (type) {
      case 'string':
        return value;
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new EnvError(`Failed to parse ${value} as number`);
        }
        return num;
      case 'boolean':
        const normalized = value.toLowerCase();
        if (!['true', 'false', '1', '0'].includes(normalized)) {
          throw new EnvError(`Failed to parse ${value} as boolean`);
        }
        return ['true', '1'].includes(normalized);
      case 'url':
        try {
          new URL(value);
          return value;
        } catch {
          throw new EnvError(`Failed to parse ${value} as URL`);
        }
      default:
        throw new EnvError(`Unsupported type: ${type}`);
    }
  }

  get<T extends EnvVar>(key: string): T {
    if (!this.config[key]) {
      throw new EnvError(`Environment variable ${key} is not configured`);
    }

    const value = this.cache.get(key);
    if (value === undefined) {
      throw new EnvError(`Environment variable ${key} is not set`);
    }

    return value as T;
  }

  getString(key: string): string {
    return this.get<string>(key);
  }

  getNumber(key: string): number {
    return this.get<number>(key);
  }

  getBoolean(key: string): boolean {
    return this.get<boolean>(key);
  }

  getUrl(key: string): string {
    return this.get<string>(key);
  }
}

// Example usage:
/*
// Initialize environment configuration
const env = Env.initialize({
  VITE_API_URL: {
    type: 'url',
    required: true,
    validate: (value) => value.toString().startsWith('https')
  },
  VITE_API_KEY: {
    type: 'string',
    required: true
  },
  VITE_DEBUG_MODE: {
    type: 'boolean',
    default: false
  },
  VITE_MAX_RETRIES: {
    type: 'number',
    default: 3,
    validate: (value) => Number(value) > 0
  }
});

// Get environment variables with type safety
const apiUrl = env.getUrl('VITE_API_URL');
const apiKey = env.getString('VITE_API_KEY');
const debugMode = env.getBoolean('VITE_DEBUG_MODE');
const maxRetries = env.getNumber('VITE_MAX_RETRIES');
*/