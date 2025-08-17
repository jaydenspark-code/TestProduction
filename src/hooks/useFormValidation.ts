import { useState, useCallback } from 'react';
import { ValidationError } from '../utils/errorHandling';

type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

type ValidationErrors<T> = {
  [K in keyof T]?: string[];
};

interface UseFormValidationResult<T> {
  errors: ValidationErrors<T>;
  validateField: (field: keyof T, value: T[keyof T]) => boolean;
  validateForm: (data: T) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  hasErrors: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  rules: ValidationRules<T>
): UseFormValidationResult<T> {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  const validateField = useCallback(
    (field: keyof T, value: T[keyof T]): boolean => {
      const fieldRules = rules[field];
      if (!fieldRules) return true;

      const fieldErrors: string[] = [];

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message);
        }
      }

      setErrors(prev => ({
        ...prev,
        [field]: fieldErrors.length > 0 ? fieldErrors : undefined
      }));

      return fieldErrors.length === 0;
    },
    [rules]
  );

  const validateForm = useCallback(
    (data: T): boolean => {
      const newErrors: ValidationErrors<T> = {};
      let isValid = true;

      for (const field in rules) {
        const fieldRules = rules[field];
        if (!fieldRules) continue;

        const fieldErrors: string[] = [];
        const value = data[field];

        for (const rule of fieldRules) {
          if (!rule.validate(value)) {
            fieldErrors.push(rule.message);
            isValid = false;
          }
        }

        if (fieldErrors.length > 0) {
          newErrors[field] = fieldErrors;
        }
      }

      setErrors(newErrors);

      if (!isValid) {
        throw new ValidationError('Form validation failed', newErrors);
      }

      return isValid;
    },
    [rules]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors
  };
}

// Common validation rules
export const commonValidationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value: any) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0),
    message
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value: string) =>
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
    message
  }),

  minLength: (length: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length >= length,
    message: message || `Must be at least ${length} characters`
  }),

  maxLength: (length: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length <= length,
    message: message || `Must be no more than ${length} characters`
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value: string) => regex.test(value),
    message
  }),

  match: (matchValue: any, message: string): ValidationRule<any> => ({
    validate: (value: any) => value === matchValue,
    message
  }),

  number: (message = 'Must be a number'): ValidationRule<any> => ({
    validate: (value: any) => !isNaN(Number(value)),
    message
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value <= max,
    message: message || `Must be no more than ${max}`
  })
};