import { ValidationError } from './errors';

type ValidationRule<T = any> = {
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
};

type FieldValidation<T = any> = {
  required?: boolean;
  rules?: ValidationRule<T>[];
};

type FormValidation = {
  [key: string]: FieldValidation;
};

type FormData = {
  [key: string]: any;
};

type ValidationResult = {
  valid: boolean;
  errors: { [key: string]: string[] };
};

type FormOptions = {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  stopOnFirstError?: boolean;
  trimValues?: boolean;
};

export class Form {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
  private static readonly PHONE_REGEX = /^\+?[\d\s-()]+$/;

  private validation: FormValidation;
  private options: FormOptions;
  private data: FormData = {};
  private errors: { [key: string]: string[] } = {};
  private touched: Set<string> = new Set();
  private dirty: Set<string> = new Set();

  constructor(
    validation: FormValidation,
    options: FormOptions = {}
  ) {
    this.validation = validation;
    this.options = {
      validateOnChange: true,
      validateOnBlur: true,
      validateOnSubmit: true,
      stopOnFirstError: false,
      trimValues: true,
      ...options
    };
  }

  // Static validation rules
  static rules = {
    required: (message = 'This field is required'): ValidationRule => ({
      validate: (value: any) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
      message
    }),

    email: (message = 'Invalid email address'): ValidationRule => ({
      validate: (value: string) =>
        !value || Form.EMAIL_REGEX.test(value),
      message
    }),

    url: (message = 'Invalid URL'): ValidationRule => ({
      validate: (value: string) =>
        !value || Form.URL_REGEX.test(value),
      message
    }),

    phone: (message = 'Invalid phone number'): ValidationRule => ({
      validate: (value: string) =>
        !value || Form.PHONE_REGEX.test(value),
      message
    }),

    minLength: (length: number, message?: string): ValidationRule => ({
      validate: (value: string | any[]) =>
        !value || value.length >= length,
      message: message || `Minimum length is ${length}`
    }),

    maxLength: (length: number, message?: string): ValidationRule => ({
      validate: (value: string | any[]) =>
        !value || value.length <= length,
      message: message || `Maximum length is ${length}`
    }),

    min: (min: number, message?: string): ValidationRule => ({
      validate: (value: number) =>
        !value || value >= min,
      message: message || `Minimum value is ${min}`
    }),

    max: (max: number, message?: string): ValidationRule => ({
      validate: (value: number) =>
        !value || value <= max,
      message: message || `Maximum value is ${max}`
    }),

    pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
      validate: (value: string) =>
        !value || regex.test(value),
      message
    }),

    match: (field: string, message?: string): ValidationRule => ({
      validate: (value: any) =>
        value === this.data[field],
      message: message || `Must match ${field}`
    }),

    custom: (validator: (value: any) => boolean | Promise<boolean>, message: string): ValidationRule => ({
      validate: validator,
      message
    })
  };

  // Initialize form data
  initialize(data: FormData): void {
    this.data = this.options.trimValues
      ? this.trimObjectValues(data)
      : { ...data };
    this.errors = {};
    this.touched.clear();
    this.dirty.clear();
  }

  // Get form data
  getData(): FormData {
    return { ...this.data };
  }

  // Get field value
  getValue(field: string): any {
    return this.data[field];
  }

  // Set field value
  setValue(field: string, value: any): void {
    const oldValue = this.data[field];
    this.data[field] = this.options.trimValues && typeof value === 'string'
      ? value.trim()
      : value;

    if (oldValue !== value) {
      this.dirty.add(field);
      if (this.options.validateOnChange) {
        this.validateField(field);
      }
    }
  }

  // Set multiple values
  setValues(values: FormData): void {
    Object.entries(values).forEach(([field, value]) => {
      this.setValue(field, value);
    });
  }

  // Mark field as touched
  setTouched(field: string): void {
    this.touched.add(field);
    if (this.options.validateOnBlur) {
      this.validateField(field);
    }
  }

  // Check if field is touched
  isTouched(field: string): boolean {
    return this.touched.has(field);
  }

  // Check if field is dirty (changed)
  isDirty(field: string): boolean {
    return this.dirty.has(field);
  }

  // Get field errors
  getErrors(field: string): string[] {
    return this.errors[field] || [];
  }

  // Get all errors
  getAllErrors(): { [key: string]: string[] } {
    return { ...this.errors };
  }

  // Check if form has errors
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  // Reset form
  reset(): void {
    this.data = {};
    this.errors = {};
    this.touched.clear();
    this.dirty.clear();
  }

  // Validate single field
  async validateField(field: string): Promise<boolean> {
    const fieldValidation = this.validation[field];
    if (!fieldValidation) return true;

    const value = this.data[field];
    const errors: string[] = [];

    // Check required
    if (fieldValidation.required) {
      const isValid = Form.rules.required().validate(value);
      if (!isValid) {
        errors.push('This field is required');
        if (this.options.stopOnFirstError) {
          this.errors[field] = errors;
          return false;
        }
      }
    }

    // Check rules
    if (fieldValidation.rules) {
      for (const rule of fieldValidation.rules) {
        const isValid = await rule.validate(value);
        if (!isValid) {
          errors.push(rule.message);
          if (this.options.stopOnFirstError) {
            this.errors[field] = errors;
            return false;
          }
        }
      }
    }

    if (errors.length > 0) {
      this.errors[field] = errors;
      return false;
    }

    delete this.errors[field];
    return true;
  }

  // Validate all fields
  async validate(): Promise<ValidationResult> {
    const validations = Object.keys(this.validation).map(
      field => this.validateField(field)
    );

    const results = await Promise.all(validations);
    const valid = results.every(result => result);

    return {
      valid,
      errors: this.errors
    };
  }

  // Submit form
  async submit(onSubmit: (data: FormData) => Promise<void>): Promise<void> {
    if (this.options.validateOnSubmit) {
      const { valid, errors } = await this.validate();
      if (!valid) {
        throw new ValidationError('Form validation failed', errors);
      }
    }

    await onSubmit(this.data);
  }

  // Trim string values in object
  private trimObjectValues(obj: FormData): FormData {
    const trimmed: FormData = {};
    for (const [key, value] of Object.entries(obj)) {
      trimmed[key] = typeof value === 'string' ? value.trim() : value;
    }
    return trimmed;
  }
}

// Example usage:
/*
// Create form validation schema
const validation: FormValidation = {
  email: {
    required: true,
    rules: [
      Form.rules.email()
    ]
  },
  password: {
    required: true,
    rules: [
      Form.rules.minLength(8, 'Password must be at least 8 characters'),
      Form.rules.pattern(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
        'Password must contain letters and numbers'
      )
    ]
  },
  confirmPassword: {
    required: true,
    rules: [
      Form.rules.match('password', 'Passwords must match')
    ]
  },
  age: {
    rules: [
      Form.rules.min(18, 'Must be at least 18 years old')
    ]
  },
  website: {
    rules: [
      Form.rules.url()
    ]
  }
};

// Create form instance
const form = new Form(validation, {
  validateOnChange: true,
  validateOnBlur: true,
  stopOnFirstError: true
});

// Initialize form with data
form.initialize({
  email: 'user@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  age: 25,
  website: 'https://example.com'
});

// Handle form submission
try {
  await form.submit(async (data) => {
    // Submit data to server
    await api.post('/register', data);
  });
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.log(error.errors);
  } else {
    // Handle other errors
    console.error(error);
  }
}

// Handle field change
form.setValue('email', 'newuser@example.com');

// Handle field blur
form.setTouched('email');

// Check field status
const isEmailValid = !form.getErrors('email').length;
const isEmailTouched = form.isTouched('email');
const isEmailDirty = form.isDirty('email');

// Reset form
form.reset();
*/