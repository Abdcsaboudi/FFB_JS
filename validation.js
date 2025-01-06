class ValidationEngineUtil {
    static validateField(field, fieldValue) {
        if (!field || !field.type) return null;

        if (field.validate) {
            // Required field validation
            if (this.checkRequired(field, fieldValue)) {
                return field.validate.required?.message || `${field.label} is required.`;
            }

            // Min value validation
            if (this.checkMin(field, fieldValue)) {
                return `${field.label} must be greater than ${this.parseNumber(field.validate.min)}.`;
            }

            // Max value validation
            if (this.checkMax(field, fieldValue)) {
                return `${field.label} must be less than ${this.parseNumber(field.validate.max)}.`;
            }

            // Regex validation
            if (field.validate.pattern && fieldValue && fieldValue.toString().trim() !== '') {
                const regex = new RegExp(field.validate.pattern);
                if (!regex.test(fieldValue.toString())) {
                    return field.validate.pattern?.message || `${field.label} has an invalid format.`;
                }
            }

            // Max length validation
            if (field.validate.maxLength !== null && fieldValue) {
                if (fieldValue.toString().length > field.validate.maxLength) {
                    return field.validate.maxLength?.message || `${field.label} must be less than ${field.validate.maxLength} characters.`;
                }
            }

            // Min length validation
            if (field.validate.minLength !== null && fieldValue) {
                if (fieldValue.toString().length < field.validate.minLength) {
                    return field.validate.minLength?.message || `${field.label} must be at least ${field.validate.minLength} characters.`;
                }
            }
        }

        return null;
    }

    static checkRequired(field, fieldValue) {
        if (!field.validate?.required) return false;

        if (field.type === 'file' && field.validate?.required) {
            if (Array.isArray(fieldValue)) {
                return fieldValue.length === 0 || fieldValue.every(v => !v || v.toString().trim() === '');
            }
        }

        return fieldValue === null || 
               fieldValue === undefined || 
               fieldValue.toString().trim() === '' || 
               (field.type === 'checkbox' && !fieldValue);
    }

    static checkMin(field, fieldValue) {
        if (!field.validate?.min || !fieldValue || fieldValue.toString().trim() === '') {
            return false;
        }
        const value = parseFloat(fieldValue.toString().replace(',', ''));
        return value < field.validate.min;
    }

    static checkMax(field, fieldValue) {
        if (!field.validate?.max || !fieldValue || fieldValue.toString().trim() === '') {
            return false;
        }
        const value = parseFloat(fieldValue.toString().replace(',', ''));
        return value > field.validate.max;
    }

    static parseNumber(value) {
        return parseFloat(value).toLocaleString();
    }

    static validateForm(formData) {
        const errors = {};
        let isValid = true;

        // Get all form inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Remove any existing error states first
            input.classList.remove('invalid');
            const existingError = input.closest('.form-group')?.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            const fieldKey = input.name;
            const field = formData.data.components.find(c => c.key === fieldKey);
            
            if (field) {
                let fieldValue;
                switch (input.type) {
                    case 'checkbox':
                        fieldValue = input.checked;
                        break;
                    case 'file':
                        fieldValue = input.files;
                        break;
                    default:
                        fieldValue = input.value;
                }

                const error = this.validateField(field, fieldValue);
                if (error) {
                    errors[fieldKey] = error;
                    isValid = false;
                    
                    // Add visual feedback
                    input.classList.add('invalid');
                    
                    // Find the form-group parent
                    const formGroup = input.closest('.form-group');
                    if (formGroup) {
                        // Add error message below the field
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.textContent = error;
                        
                        // Add the error message after the input or its wrapper
                        const targetElement = input.closest('.input-group') || input;
                        targetElement.insertAdjacentElement('afterend', errorDiv);
                    }
                }
            }
        });

        return { isValid, errors };
    }
} 