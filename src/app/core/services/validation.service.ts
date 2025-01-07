import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  validateField(component: any, value: any): any {
    const validationState = {
      valid: true,
      errors: []
    };

    if (!component.validations) {
      return validationState;
    }

    component.validations.forEach((validation: any) => {
      const isValid = this.validateRule(validation, value);
      if (!isValid) {
        validationState.valid = false;
        validationState.errors.push(validation.message || this.getDefaultErrorMessage(validation.type));
      }
    });

    return validationState;
  }

  private validateRule(validation: any, value: any): boolean {
    switch (validation.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';
      case 'minLength':
        return value?.length >= validation.value;
      case 'maxLength':
        return value?.length <= validation.value;
      case 'pattern':
        return new RegExp(validation.value).test(value);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'min':
        return Number(value) >= validation.value;
      case 'max':
        return Number(value) <= validation.value;
      default:
        return true;
    }
  }

  private getDefaultErrorMessage(validationType: string): string {
    switch (validationType) {
      case 'required':
        return 'This field is required';
      case 'minLength':
        return 'Value is too short';
      case 'maxLength':
        return 'Value is too long';
      case 'pattern':
        return 'Value does not match the required pattern';
      case 'email':
        return 'Invalid email address';
      case 'min':
        return 'Value is too small';
      case 'max':
        return 'Value is too large';
      default:
        return 'Invalid value';
    }
  }
} 