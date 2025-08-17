import { ValidationError } from './errors';

type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string | ((value: T) => string);
};

type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

type ValidationResult<T> = {
  isValid: boolean;
  errors: Partial<Record<keyof T, string[]>>;
};

export class Validator<T extends Record<string, any>> {
  private schema: ValidationSchema<T>;

  constructor(schema: ValidationSchema<T>) {
    this.schema = schema;
  }

  validate(data: Partial<T>): ValidationResult<T> {
    const errors: Partial<Record<keyof T, string[]>> = {};

    for (const field in this.schema) {
      const rules = this.schema[field] || [];
      const value = data[field];

      const fieldErrors = rules
        .filter((rule) => !rule.validate(value))
        .map((rule) =>
          typeof rule.message === 'function'
            ? rule.message(value)
            : rule.message
        );

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateField<K extends keyof T>(
    field: K,
    value: T[K]
  ): string[] {
    const rules = this.schema[field] || [];
    return rules
      .filter((rule) => !rule.validate(value))
      .map((rule) =>
        typeof rule.message === 'function'
          ? rule.message(value)
          : rule.message
      );
  }

  validateOrThrow(data: Partial<T>): void {
    const result = this.validate(data);
    if (!result.isValid) {
      throw new ValidationError('Validation failed', {
        details: result.errors
      });
    }
  }
}

// Common validation rules
export const rules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value: T) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0),
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length >= min,
    message: message || `Minimum length is ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length <= max,
    message: message || `Maximum length is ${max} characters`
  }),

  pattern: (
    regex: RegExp,
    message = 'Invalid format'
  ): ValidationRule<string> => ({
    validate: (value) => !value || regex.test(value),
    message
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) =>
      !value ||
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
    message
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) =>
      value === undefined || value === null || value >= min,
    message: message || `Minimum value is ${min}`
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) =>
      value === undefined || value === null || value <= max,
    message: message || `Maximum value is ${max}`
  }),

  integer: (message = 'Must be an integer'): ValidationRule<number> => ({
    validate: (value) =>
      value === undefined ||
      value === null ||
      Number.isInteger(value),
    message
  }),

  decimal: (
    precision: number,
    message?: string
  ): ValidationRule<number> => ({
    validate: (value) => {
      if (value === undefined || value === null) return true;
      const str = value.toString();
      const decimalPart = str.includes('.')
        ? str.split('.')[1].length
        : 0;
      return decimalPart <= precision;
    },
    message:
      message ||
      `Maximum ${precision} decimal place${precision !== 1 ? 's' : ''}`
  }),

  oneOf: <T>(
    values: T[],
    message = 'Invalid value'
  ): ValidationRule<T> => ({
    validate: (value) =>
      value === undefined ||
      value === null ||
      values.includes(value),
    message
  }),

  custom: <T>(
    validateFn: (value: T) => boolean,
    message: string | ((value: T) => string)
  ): ValidationRule<T> => ({
    validate: validateFn,
    message
  })
};

// Example usage:
/*
// Define a user schema
interface User {
  email: string;
  password: string;
  age: number;
  website?: string;
}

const userValidator = new Validator<User>({
  email: [
    rules.required(),
    rules.email()
  ],
  password: [
    rules.required(),
    rules.minLength(8),
    rules.pattern(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      'Password must contain at least one letter and one number'
    )
  ],
  age: [
    rules.required(),
    rules.integer(),
    rules.min(18, 'Must be at least 18 years old'),
    rules.max(120)
  ],
  website: [
    rules.url()
  ]
});

// Validate user data
try {
  const userData = {
    email: 'invalid-email',
    password: 'weak',
    age: 16,
    website: 'not-a-url'
  };

  userValidator.validateOrThrow(userData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation errors:', error.details);
  }
}

// Validate single field
const emailErrors = userValidator.validateField('email', 'invalid-email');
console.log('Email validation errors:', emailErrors);
*/