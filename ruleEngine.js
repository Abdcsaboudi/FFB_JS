class RuleEngine {
    static evaluateRules(field, allFields, formValues, fieldStates) {
        if (!field.rules) return;

        field.rules.forEach(rule => {
            if (!rule || !rule.condition) return;

            // Handle nested components
            if (field.components && field.components.length > 0) {
                field.components.forEach(component => {
                    const updatedFields = [...allFields, ...field.components];
                    this.evaluateRules(component, updatedFields, formValues, fieldStates);
                });
            }

            const targetField = allFields.find(f => f.id === rule.condition.dependsOn);
            if (!targetField) return;

            let fieldValue = formValues[targetField.id];
            let ruleValue = rule.condition.value;

            if (fieldValue === undefined || fieldValue === null) return;

            // Handle different comparison types
            switch (rule.condition.compareOn) {
                case 'value':
                    switch (targetField.type) {
                        case 'number':
                            fieldValue = this.parseNumber(fieldValue.toString());
                            ruleValue = this.parseNumber(ruleValue.toString());
                            break;
                        case 'datetime':
                            fieldValue = this.handleValueDateTime(fieldValue, targetField);
                            ruleValue = this.handleRuleDateTime(targetField, ruleValue);
                            break;
                        default:
                            if (rule.actions.some(action => action.type === 'filter')) {
                                ruleValue = field.data?.values?.filter(v => v.relatedWith === formValues[targetField.id]);
                            } else {
                                fieldValue = fieldValue.toString();
                                ruleValue = ruleValue.toString();
                            }
                    }
                    break;
                case 'length':
                    fieldValue = fieldValue.toString().length;
                    ruleValue = parseFloat(ruleValue);
                    break;
            }

            const condition = this.handleConditions(rule.condition.operator, fieldValue, ruleValue);
            this.applyActions(field.id, rule.actions, fieldStates, condition, ruleValue);
        });
    }

    static handleConditions(operator, fieldValue, value) {
        if (fieldValue === null || value === null) return false;

        switch (operator) {
            case 'eq':
                if (fieldValue instanceof Date && value instanceof Date) {
                    return fieldValue.getTime() === value.getTime();
                }
                return fieldValue === value;
            case 'ne':
                if (fieldValue instanceof Date && value instanceof Date) {
                    return fieldValue.getTime() !== value.getTime();
                }
                return fieldValue !== value;
            case 'lt':
                if (fieldValue instanceof Date && value instanceof Date) {
                    return fieldValue < value;
                }
                return parseFloat(fieldValue) < parseFloat(value);
            case 'gt':
                if (fieldValue instanceof Date && value instanceof Date) {
                    return fieldValue > value;
                }
                return parseFloat(fieldValue) > parseFloat(value);
            case 'le':
                if (fieldValue instanceof Date && value instanceof Date) {
                    return fieldValue <= value;
                }
                return parseFloat(fieldValue) <= parseFloat(value);
            case 'ge':
                if (fieldValue instanceof Date && value instanceof Date) {
                    return fieldValue >= value;
                }
                return parseFloat(fieldValue) >= parseFloat(value);
            case 'contains':
                return fieldValue.toString().toLowerCase().includes(value.toString().toLowerCase());
            default:
                return true;
        }
    }

    static applyActions(fieldId, actions, fieldStates, condition, ruleValue = null) {
        actions.forEach(action => {
            const targetField = document.querySelector(`[name="${action.targetField}"]`);
            if (!targetField) return;

            switch (action.type) {
                case 'show':
                    targetField.closest('.form-group').style.display = condition ? 'block' : 'none';
                    if (!condition) {
                        targetField.value = '';
                        this.clearValidation(targetField);
                    }
                    break;
                case 'hide':
                    targetField.closest('.form-group').style.display = condition ? 'none' : 'block';
                    if (condition) {
                        targetField.value = '';
                        this.clearValidation(targetField);
                    }
                    break;
                case 'enable':
                    targetField.disabled = !condition;
                    if (!condition) {
                        targetField.value = '';
                    }
                    break;
                case 'disable':
                    targetField.disabled = condition;
                    break;
                case 'optional':
                    targetField.required = !condition;
                    break;
                case 'required':
                    targetField.required = condition;
                    break;
                case 'filter':
                    if (targetField.tagName === 'SELECT') {
                        this.updateSelectOptions(targetField, ruleValue || []);
                    }
                    break;
                case 'addValidationMessage':
                    if (condition) {
                        this.showValidationMessage(targetField, action.message);
                    } else {
                        this.clearValidation(targetField);
                    }
                    break;
            }
        });
    }

    static clearValidation(field) {
        const errorMessage = field.closest('.form-group').querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
        field.classList.remove('invalid');
    }

    static showValidationMessage(field, message) {
        this.clearValidation(field);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.closest('.form-group').appendChild(errorDiv);
        field.classList.add('invalid');
    }

    static updateSelectOptions(select, options) {
        select.innerHTML = '';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            select.appendChild(optionElement);
        });
        select.disabled = options.length === 0;
    }

    static parseNumber(value) {
        if (!value) return null;
        return parseFloat(value.replace(',', ''));
    }

    static handleValueDateTime(fieldValue, targetField) {
        if (!(fieldValue instanceof Date)) {
            return new Date();
        }

        if (!targetField.validation?.enableDate) {
            return this.formatTime(fieldValue);
        } else if (!targetField.validation?.enableTime) {
            return this.formatDate(fieldValue);
        } else {
            return this.formatDateTime(fieldValue);
        }
    }

    static handleRuleDateTime(targetField, ruleValue) {
        if (!targetField.validation?.enableDate) {
            return this.parseTime(ruleValue.toString());
        } else if (!targetField.validation?.enableTime) {
            return this.parseDate(ruleValue.toString());
        } else {
            return this.parseDateTime(ruleValue.toString());
        }
    }

    // Date handling utilities
    static parseDate(date) {
        if (!date) return null;
        const [day, month, year] = date.split('-');
        return new Date(year, month - 1, day, 0, 0, 0);
    }

    static parseDateTime(date) {
        if (!date) return null;
        const [datePart, timePart] = date.split(' ');
        const [day, month, year] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');
        return new Date(year, month - 1, day, hours, minutes, 0);
    }

    static parseTime(time) {
        if (!time) return null;
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(hours, minutes, 0);
        return date;
    }

    static formatDate(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    }

    static formatDateTime(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                       date.getHours(), date.getMinutes(), 0);
    }

    static formatTime(date) {
        const newDate = new Date();
        newDate.setHours(date.getHours(), date.getMinutes(), 0);
        return newDate;
    }
} 