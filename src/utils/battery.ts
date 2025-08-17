type BatteryStatus = {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
};

type BatteryCallback = (status: BatteryStatus) => void;

export class BatteryManager {
  private static instance: BatteryManager;
  private battery: any | null;
  private onUpdateCallbacks: Set<BatteryCallback>;
  private lastStatus: BatteryStatus | null;

  private constructor() {
    this.battery = null;
    this.onUpdateCallbacks = new Set();
    this.lastStatus = null;
  }

  static getInstance(): BatteryManager {
    if (!BatteryManager.instance) {
      BatteryManager.instance = new BatteryManager();
    }
    return BatteryManager.instance;
  }

  private handleBatteryChange = (): void => {
    if (!this.battery) return;

    const status: BatteryStatus = {
      charging: this.battery.charging,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime,
      level: this.battery.level
    };

    this.lastStatus = status;
    this.notifyCallbacks(status);
  };

  private notifyCallbacks(status: BatteryStatus): void {
    this.onUpdateCallbacks.forEach(callback => callback(status));
  }

  private addBatteryListeners(): void {
    if (!this.battery) return;

    this.battery.addEventListener('chargingchange', this.handleBatteryChange);
    this.battery.addEventListener('chargingtimechange', this.handleBatteryChange);
    this.battery.addEventListener('dischargingtimechange', this.handleBatteryChange);
    this.battery.addEventListener('levelchange', this.handleBatteryChange);
  }

  private removeBatteryListeners(): void {
    if (!this.battery) return;

    this.battery.removeEventListener('chargingchange', this.handleBatteryChange);
    this.battery.removeEventListener('chargingtimechange', this.handleBatteryChange);
    this.battery.removeEventListener('dischargingtimechange', this.handleBatteryChange);
    this.battery.removeEventListener('levelchange', this.handleBatteryChange);
  }

  async init(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Battery API is not supported');
    }

    try {
      this.battery = await (navigator as any).getBattery();
      this.addBatteryListeners();
      this.handleBatteryChange(); // Initial status update
    } catch (error) {
      console.error('Failed to initialize battery manager:', error);
      throw error;
    }
  }

  async getBatteryStatus(): Promise<BatteryStatus> {
    if (!this.battery) {
      await this.init();
    }

    return {
      charging: this.battery.charging,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime,
      level: this.battery.level
    };
  }

  onUpdate(callback: BatteryCallback): () => void {
    this.onUpdateCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onUpdateCallbacks.delete(callback);
    };
  }

  getLastStatus(): BatteryStatus | null {
    return this.lastStatus;
  }

  isCharging(): boolean {
    return this.battery?.charging ?? false;
  }

  getBatteryLevel(): number {
    return this.battery?.level ?? 0;
  }

  getChargingTime(): number {
    return this.battery?.chargingTime ?? Infinity;
  }

  getDischargingTime(): number {
    return this.battery?.dischargingTime ?? Infinity;
  }

  formatTimeRemaining(seconds: number): string {
    if (!isFinite(seconds) || seconds <= 0) {
      return 'Unknown';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(' ') : 'Less than 1m';
  }

  formatBatteryLevel(level: number): string {
    return `${Math.round(level * 100)}%`;
  }

  getBatteryStatusSummary(): string {
    if (!this.battery) return 'Battery status unavailable';

    const level = this.formatBatteryLevel(this.battery.level);
    const charging = this.battery.charging;
    let timeInfo = '';

    if (charging) {
      const timeToFull = this.formatTimeRemaining(this.battery.chargingTime);
      timeInfo = timeToFull !== 'Unknown' ? ` - ${timeToFull} until full` : '';
    } else {
      const timeToEmpty = this.formatTimeRemaining(this.battery.dischargingTime);
      timeInfo = timeToEmpty !== 'Unknown' ? ` - ${timeToEmpty} remaining` : '';
    }

    return `${level} (${charging ? 'Charging' : 'Not charging'}${timeInfo})`;
  }

  cleanup(): void {
    this.removeBatteryListeners();
    this.onUpdateCallbacks.clear();
    this.battery = null;
    this.lastStatus = null;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'getBattery' in navigator;
  }
}

// Example usage:
/*
const battery = BatteryManager.getInstance();

// Initialize battery manager
battery.init().then(() => {
  console.log('Battery manager initialized');

  // Get current battery status
  battery.getBatteryStatus().then(status => {
    console.log('Current battery status:', status);
  });

  // Listen for battery changes
  const cleanup = battery.onUpdate(status => {
    console.log('Battery status updated:', status);
    console.log('Battery summary:', battery.getBatteryStatusSummary());
  });

  // Get specific battery information
  console.log('Is charging:', battery.isCharging());
  console.log('Battery level:', battery.formatBatteryLevel(battery.getBatteryLevel()));
  console.log('Time to full:', battery.formatTimeRemaining(battery.getChargingTime()));
  console.log('Time remaining:', battery.formatTimeRemaining(battery.getDischargingTime()));

  // Later: cleanup
  cleanup(); // Remove update listener
  battery.cleanup(); // Full cleanup
}).catch(error => {
  console.error('Failed to initialize battery manager:', error);
});
*/