import {
  format,
  formatDistance,
  formatRelative,
  isValid,
  parse,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  subDays,
  subHours,
  subMinutes,
  subSeconds,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isBefore,
  isAfter,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear
} from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export class DateTime {
  private date: Date;
  private timezone: string;

  constructor(date?: Date | string | number, timezone = 'UTC') {
    this.timezone = timezone;
    this.date = this.parseInput(date);
  }

  private parseInput(input?: Date | string | number): Date {
    if (!input) {
      return new Date();
    }

    if (input instanceof Date) {
      return input;
    }

    if (typeof input === 'string') {
      const parsed = parseISO(input);
      if (!isValid(parsed)) {
        throw new Error('Invalid date string');
      }
      return parsed;
    }

    const parsed = new Date(input);
    if (!isValid(parsed)) {
      throw new Error('Invalid date');
    }
    return parsed;
  }

  // Getters and setters
  toDate(): Date {
    return this.date;
  }

  toUTC(): DateTime {
    const utcDate = zonedTimeToUtc(this.date, this.timezone);
    return new DateTime(utcDate, 'UTC');
  }

  toTimezone(timezone: string): DateTime {
    const zonedDate = utcToZonedTime(this.date, timezone);
    return new DateTime(zonedDate, timezone);
  }

  // Formatting
  format(formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
    return format(this.date, formatStr);
  }

  formatRelative(baseDate = new Date()): string {
    return formatRelative(this.date, baseDate);
  }

  formatDistance(baseDate = new Date()): string {
    return formatDistance(this.date, baseDate, { addSuffix: true });
  }

  // Comparison
  isBefore(date: Date | DateTime): boolean {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return isBefore(this.date, compareDate);
  }

  isAfter(date: Date | DateTime): boolean {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return isAfter(this.date, compareDate);
  }

  isSameDay(date: Date | DateTime): boolean {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return isSameDay(this.date, compareDate);
  }

  isSameWeek(date: Date | DateTime): boolean {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return isSameWeek(this.date, compareDate);
  }

  isSameMonth(date: Date | DateTime): boolean {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return isSameMonth(this.date, compareDate);
  }

  isSameYear(date: Date | DateTime): boolean {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return isSameYear(this.date, compareDate);
  }

  // Difference calculations
  diffInDays(date: Date | DateTime): number {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return differenceInDays(this.date, compareDate);
  }

  diffInHours(date: Date | DateTime): number {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return differenceInHours(this.date, compareDate);
  }

  diffInMinutes(date: Date | DateTime): number {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return differenceInMinutes(this.date, compareDate);
  }

  diffInSeconds(date: Date | DateTime): number {
    const compareDate = date instanceof DateTime ? date.toDate() : date;
    return differenceInSeconds(this.date, compareDate);
  }

  // Manipulations
  add(amount: number, unit: 'days' | 'hours' | 'minutes' | 'seconds'): DateTime {
    let newDate: Date;

    switch (unit) {
      case 'days':
        newDate = addDays(this.date, amount);
        break;
      case 'hours':
        newDate = addHours(this.date, amount);
        break;
      case 'minutes':
        newDate = addMinutes(this.date, amount);
        break;
      case 'seconds':
        newDate = addSeconds(this.date, amount);
        break;
      default:
        throw new Error('Invalid unit');
    }

    return new DateTime(newDate, this.timezone);
  }

  subtract(
    amount: number,
    unit: 'days' | 'hours' | 'minutes' | 'seconds'
  ): DateTime {
    let newDate: Date;

    switch (unit) {
      case 'days':
        newDate = subDays(this.date, amount);
        break;
      case 'hours':
        newDate = subHours(this.date, amount);
        break;
      case 'minutes':
        newDate = subMinutes(this.date, amount);
        break;
      case 'seconds':
        newDate = subSeconds(this.date, amount);
        break;
      default:
        throw new Error('Invalid unit');
    }

    return new DateTime(newDate, this.timezone);
  }

  // Start/End of period
  startOf(
    unit: 'day' | 'week' | 'month' | 'year'
  ): DateTime {
    let newDate: Date;

    switch (unit) {
      case 'day':
        newDate = startOfDay(this.date);
        break;
      case 'week':
        newDate = startOfWeek(this.date);
        break;
      case 'month':
        newDate = startOfMonth(this.date);
        break;
      case 'year':
        newDate = startOfYear(this.date);
        break;
      default:
        throw new Error('Invalid unit');
    }

    return new DateTime(newDate, this.timezone);
  }

  endOf(
    unit: 'day' | 'week' | 'month' | 'year'
  ): DateTime {
    let newDate: Date;

    switch (unit) {
      case 'day':
        newDate = endOfDay(this.date);
        break;
      case 'week':
        newDate = endOfWeek(this.date);
        break;
      case 'month':
        newDate = endOfMonth(this.date);
        break;
      case 'year':
        newDate = endOfYear(this.date);
        break;
      default:
        throw new Error('Invalid unit');
    }

    return new DateTime(newDate, this.timezone);
  }

  // Static methods
  static now(timezone = 'UTC'): DateTime {
    return new DateTime(new Date(), timezone);
  }

  static fromISO(dateString: string, timezone = 'UTC'): DateTime {
    return new DateTime(dateString, timezone);
  }

  static fromFormat(
    dateString: string,
    formatStr: string,
    timezone = 'UTC'
  ): DateTime {
    const parsed = parse(dateString, formatStr, new Date());
    if (!isValid(parsed)) {
      throw new Error('Invalid date string or format');
    }
    return new DateTime(parsed, timezone);
  }
}

// Example usage:
/*
// Create dates
const now = DateTime.now();
const customDate = new DateTime('2023-01-01');
const fromFormat = DateTime.fromFormat('01/01/2023', 'dd/MM/yyyy');

// Format dates
console.log(now.format()); // '2023-12-31 23:59:59'
console.log(now.formatRelative()); // 'today at 23:59'
console.log(now.formatDistance(customDate.toDate())); // 'about 1 year ago'

// Timezone handling
const localDate = now.toTimezone('America/New_York');
console.log(localDate.format()); // Converts to NY timezone

// Comparisons
console.log(now.isBefore(customDate)); // false
console.log(now.isAfter(customDate)); // true
console.log(now.isSameDay(DateTime.now())); // true

// Calculations
const tomorrow = now.add(1, 'days');
const lastWeek = now.subtract(7, 'days');
const daysDiff = now.diffInDays(customDate);

// Period boundaries
const startOfMonth = now.startOf('month');
const endOfYear = now.endOf('year');
*/