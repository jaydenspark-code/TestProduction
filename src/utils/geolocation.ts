type GeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  onSuccess?: (position: GeolocationPosition) => void;
  onError?: (error: GeolocationError) => void;
  onWatchError?: (error: GeolocationError) => void;
};

type GeolocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
};

type GeolocationError = {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
};

type WatchId = number;

export class GeolocationManager {
  private static instance: GeolocationManager;
  private watchIds: Set<WatchId>;
  private lastPosition: GeolocationPosition | null;
  private defaultOptions: GeolocationOptions;

  private constructor() {
    this.watchIds = new Set();
    this.lastPosition = null;
    this.defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
  }

  static getInstance(): GeolocationManager {
    if (!GeolocationManager.instance) {
      GeolocationManager.instance = new GeolocationManager();
    }
    return GeolocationManager.instance;
  }

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Get current position
  async getCurrentPosition(
    options: GeolocationOptions = {}
  ): Promise<GeolocationPosition> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported');
    }

    return new Promise((resolve, reject) => {
      const mergedOptions = { ...this.defaultOptions, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const formattedPosition = this.formatPosition(position);
          this.lastPosition = formattedPosition;
          mergedOptions.onSuccess?.(formattedPosition);
          resolve(formattedPosition);
        },
        (error) => {
          const formattedError = this.formatError(error);
          mergedOptions.onError?.(formattedError);
          reject(formattedError);
        },
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge
        }
      );
    });
  }

  // Watch position changes
  watchPosition(options: GeolocationOptions = {}): WatchId {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported');
    }

    const mergedOptions = { ...this.defaultOptions, ...options };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const formattedPosition = this.formatPosition(position);
        this.lastPosition = formattedPosition;
        mergedOptions.onSuccess?.(formattedPosition);
      },
      (error) => {
        const formattedError = this.formatError(error);
        mergedOptions.onWatchError?.(formattedError);
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge
      }
    );

    this.watchIds.add(watchId);
    return watchId;
  }

  // Clear specific watch
  clearWatch(watchId: WatchId): void {
    if (this.watchIds.has(watchId)) {
      navigator.geolocation.clearWatch(watchId);
      this.watchIds.delete(watchId);
    }
  }

  // Clear all watches
  clearAllWatches(): void {
    this.watchIds.forEach(watchId => {
      navigator.geolocation.clearWatch(watchId);
    });
    this.watchIds.clear();
  }

  // Get last known position
  getLastPosition(): GeolocationPosition | null {
    return this.lastPosition;
  }

  // Calculate distance between two points (in meters)
  calculateDistance(
    point1: Pick<GeolocationPosition['coords'], 'latitude' | 'longitude'>,
    point2: Pick<GeolocationPosition['coords'], 'latitude' | 'longitude'>
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(point1.latitude);
    const φ2 = this.toRadians(point2.latitude);
    const Δφ = this.toRadians(point2.latitude - point1.latitude);
    const Δλ = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Check if point is within radius (in meters)
  isWithinRadius(
    center: Pick<GeolocationPosition['coords'], 'latitude' | 'longitude'>,
    point: Pick<GeolocationPosition['coords'], 'latitude' | 'longitude'>,
    radius: number
  ): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radius;
  }

  // Get bearing between two points (in degrees)
  calculateBearing(
    point1: Pick<GeolocationPosition['coords'], 'latitude' | 'longitude'>,
    point2: Pick<GeolocationPosition['coords'], 'latitude' | 'longitude'>
  ): number {
    const φ1 = this.toRadians(point1.latitude);
    const φ2 = this.toRadians(point2.latitude);
    const Δλ = this.toRadians(point2.longitude - point1.longitude);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (this.toDegrees(θ) + 360) % 360;
  }

  // Get formatted address from coordinates using reverse geocoding
  async getAddress(
    coords: Pick<GeolocationPosition['coords'], 'latitude' | 'longitude'>
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&lat=${coords.latitude}&lon=${coords.longitude}`
      );
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (error) {
      throw new Error(`Failed to get address: ${error}`);
    }
  }

  // Private methods
  private formatPosition(position: GeolocationPosition): GeolocationPosition {
    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed
      },
      timestamp: position.timestamp
    };
  }

  private formatError(error: GeolocationPositionError): GeolocationError {
    return {
      code: error.code,
      message: error.message,
      PERMISSION_DENIED: GeolocationPositionError.PERMISSION_DENIED,
      POSITION_UNAVAILABLE: GeolocationPositionError.POSITION_UNAVAILABLE,
      TIMEOUT: GeolocationPositionError.TIMEOUT
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

// Example usage:
/*
const geolocation = GeolocationManager.getInstance();

// Get current position
try {
  const position = await geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 5000,
    onSuccess: (pos) => console.log('Position updated:', pos),
    onError: (err) => console.error('Error:', err.message)
  });

  console.log(`Latitude: ${position.coords.latitude}`);
  console.log(`Longitude: ${position.coords.longitude}`);
} catch (error) {
  console.error('Failed to get position:', error);
}

// Watch position changes
const watchId = geolocation.watchPosition({
  enableHighAccuracy: true,
  onSuccess: (position) => {
    console.log('New position:', position);
  },
  onWatchError: (error) => {
    console.error('Watch error:', error);
  }
});

// Calculate distance between two points
const distance = geolocation.calculateDistance(
  { latitude: 51.5074, longitude: -0.1278 }, // London
  { latitude: 48.8566, longitude: 2.3522 }   // Paris
);
console.log(`Distance: ${distance} meters`);

// Check if point is within radius
const isNearby = geolocation.isWithinRadius(
  { latitude: 51.5074, longitude: -0.1278 }, // Center
  { latitude: 51.5080, longitude: -0.1280 }, // Point
  1000 // 1km radius
);
console.log(`Is nearby: ${isNearby}`);

// Get bearing between two points
const bearing = geolocation.calculateBearing(
  { latitude: 51.5074, longitude: -0.1278 }, // From
  { latitude: 48.8566, longitude: 2.3522 }   // To
);
console.log(`Bearing: ${bearing} degrees`);

// Get address from coordinates
try {
  const address = await geolocation.getAddress({
    latitude: 51.5074,
    longitude: -0.1278
  });
  console.log('Address:', address);
} catch (error) {
  console.error('Failed to get address:', error);
}

// Clean up
geolocation.clearWatch(watchId);
geolocation.clearAllWatches();
*/