import { DateTime } from './datetime';

type TransformFunction<T, R> = (value: T) => R;

interface TransformOptions {
  strict?: boolean; // If true, throws error on invalid input
  defaultValue?: any; // Value to return if transformation fails
}

export class Transform {
  // String transformations
  static toString(
    value: any,
    options: TransformOptions = {}
  ): string {
    try {
      if (value === null || value === undefined) {
        if (options.strict) {
          throw new Error('Value is null or undefined');
        }
        return options.defaultValue ?? '';
      }

      if (typeof value === 'string') {
        return value;
      }

      if (value instanceof Date) {
        return new DateTime(value).format();
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return String(value);
    } catch (error) {
      if (options.strict) {
        throw error;
      }
      return options.defaultValue ?? '';
    }
  }

  // Number transformations
  static toNumber(
    value: any,
    options: TransformOptions = {}
  ): number {
    try {
      if (value === null || value === undefined) {
        if (options.strict) {
          throw new Error('Value is null or undefined');
        }
        return options.defaultValue ?? 0;
      }

      if (typeof value === 'number') {
        return value;
      }

      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          throw new Error('Invalid number string');
        }
        return parsed;
      }

      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }

      throw new Error('Cannot convert value to number');
    } catch (error) {
      if (options.strict) {
        throw error;
      }
      return options.defaultValue ?? 0;
    }
  }

  // Boolean transformations
  static toBoolean(
    value: any,
    options: TransformOptions = {}
  ): boolean {
    try {
      if (value === null || value === undefined) {
        if (options.strict) {
          throw new Error('Value is null or undefined');
        }
        return options.defaultValue ?? false;
      }

      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (['true', '1', 'yes', 'on'].includes(normalized)) {
          return true;
        }
        if (['false', '0', 'no', 'off'].includes(normalized)) {
          return false;
        }
        throw new Error('Invalid boolean string');
      }

      if (typeof value === 'number') {
        return value !== 0;
      }

      throw new Error('Cannot convert value to boolean');
    } catch (error) {
      if (options.strict) {
        throw error;
      }
      return options.defaultValue ?? false;
    }
  }

  // Date transformations
  static toDate(
    value: any,
    options: TransformOptions = {}
  ): Date {
    try {
      if (value === null || value === undefined) {
        if (options.strict) {
          throw new Error('Value is null or undefined');
        }
        return options.defaultValue ?? new Date();
      }

      if (value instanceof Date) {
        return value;
      }

      if (typeof value === 'string') {
        const date = new DateTime(value).toDate();
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date string');
        }
        return date;
      }

      if (typeof value === 'number') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date number');
        }
        return date;
      }

      throw new Error('Cannot convert value to date');
    } catch (error) {
      if (options.strict) {
        throw error;
      }
      return options.defaultValue ?? new Date();
    }
  }

  // Array transformations
  static toArray<T>(
    value: any,
    transform?: TransformFunction<any, T>,
    options: TransformOptions = {}
  ): T[] {
    try {
      if (value === null || value === undefined) {
        if (options.strict) {
          throw new Error('Value is null or undefined');
        }
        return options.defaultValue ?? [];
      }

      let array: any[];

      if (Array.isArray(value)) {
        array = value;
      } else if (typeof value === 'string') {
        try {
          array = JSON.parse(value);
          if (!Array.isArray(array)) {
            throw new Error('Parsed value is not an array');
          }
        } catch {
          array = value.split(',').map((item) => item.trim());
        }
      } else if (value instanceof Set || value instanceof Map) {
        array = Array.from(value);
      } else if (typeof value === 'object') {
        array = Object.values(value);
      } else {
        array = [value];
      }

      if (transform) {
        return array.map((item) => transform(item));
      }

      return array as T[];
    } catch (error) {
      if (options.strict) {
        throw error;
      }
      return options.defaultValue ?? [];
    }
  }

  // Object transformations
  static toObject<T extends object>(
    value: any,
    options: TransformOptions = {}
  ): T {
    try {
      if (value === null || value === undefined) {
        if (options.strict) {
          throw new Error('Value is null or undefined');
        }
        return options.defaultValue ?? ({} as T);
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        return value as T;
      }

      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as T;
        } catch {
          throw new Error('Invalid JSON string');
        }
      }

      throw new Error('Cannot convert value to object');
    } catch (error) {
      if (options.strict) {
        throw error;
      }
      return options.defaultValue ?? ({} as T);
    }
  }

  // Custom transformations
  static transform<T, R>(
    value: T,
    transformFn: TransformFunction<T, R>,
    options: TransformOptions = {}
  ): R {
    try {
      if (value === null || value === undefined) {
        if (options.strict) {
          throw new Error('Value is null or undefined');
        }
        return options.defaultValue;
      }

      return transformFn(value);
    } catch (error) {
      if (options.strict) {
        throw error;
      }
      return options.defaultValue;
    }
  }
}

// Example usage:
/*
// String transformations
const stringValue = Transform.toString(123); // '123'
const dateString = Transform.toString(new Date()); // '2023-12-31 23:59:59'
const objectString = Transform.toString({ key: 'value' }); // '{"key":"value"}'

// Number transformations
const numberValue = Transform.toNumber('123.45'); // 123.45
const booleanNumber = Transform.toNumber(true); // 1
const invalidNumber = Transform.toNumber('invalid', { defaultValue: 0 }); // 0

// Boolean transformations
const booleanValue = Transform.toBoolean('yes'); // true
const numberBoolean = Transform.toBoolean(1); // true
const invalidBoolean = Transform.toBoolean('invalid', { defaultValue: false }); // false

// Date transformations
const dateValue = Transform.toDate('2023-12-31');
const timestampDate = Transform.toDate(1672531199000);
const invalidDate = Transform.toDate('invalid', { defaultValue: new Date() });

// Array transformations
const arrayValue = Transform.toArray('1,2,3', Transform.toNumber); // [1, 2, 3]
const setArray = Transform.toArray(new Set([1, 2, 3])); // [1, 2, 3]
const objectArray = Transform.toArray({ a: 1, b: 2 }); // [1, 2]

// Object transformations
const objectValue = Transform.toObject<{ key: string }>('{"key":"value"}');
const invalidObject = Transform.toObject('invalid', { defaultValue: { key: '' } });

// Custom transformations
const customTransform = Transform.transform(
  'hello',
  (value) => value.toUpperCase(),
  { defaultValue: '' }
); // 'HELLO'
*/