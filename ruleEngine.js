class RuleEngine {
    static evaluateRules(component, allComponents, formValues, fieldStates) {
        if (!component.conditional?.json || !Array.isArray(component.conditional.json)) {
            return;
        }

        const element = document.getElementById(component.key);
        if (!element) return;

        // Initialize field state if not exists
        if (!fieldStates[component.key]) {
            fieldStates[component.key] = {
                hidden: false,
                required: component.validate?.required || false,
                disabled: component.disabled || false
            };
        }

        let shouldShow = true; // Default to showing
        let shouldBeRequired = false;
        let shouldBeDisabled = false;

        component.conditional.json.forEach(rule => {
            const dependentValue = formValues[rule.dependsOn];
            let result = false;

            // Special handling for filter rules
            if (rule.type === 'filter' && component.type === 'select') {
                this.filterSelectOptions(element, component, rule, dependentValue, allComponents, formValues);
                return; // Skip the rest of the rule processing
            }

            // Convert values for comparison
            const ruleValue = rule.value;
            let compareValue = dependentValue;

            // For numeric comparisons, ensure we're comparing numbers
            if (['lt', 'le', 'gt', 'ge'].includes(rule.op)) {
                compareValue = parseFloat(dependentValue);
            }
            // For contains operation, ensure case-insensitive string comparison
            else if (rule.op === 'contains') {
                compareValue = String(dependentValue || '').toUpperCase();
                const upperRuleValue = String(ruleValue || '').toUpperCase();
                result = compareValue.includes(upperRuleValue);
                // Skip the switch statement for contains op
                switch (rule.type) {
                    case 'show':
                        shouldShow = shouldShow && result;
                        break;
                    case 'hide':
                        shouldShow = shouldShow && !result;
                        break;
                    case 'required':
                        shouldBeRequired = shouldBeRequired || result;
                        break;
                    case 'disable':
                        shouldBeDisabled = shouldBeDisabled || result;
                        break;
                    case 'enable':
                        shouldBeDisabled = shouldBeDisabled || !result;
                        break;
                }
                return; // Skip the rest of this iteration
            }

            switch (rule.op) {
                case 'eq':
                    result = compareValue === ruleValue;
                    break;
                case 'ne':
                    result = compareValue !== ruleValue;
                    break;
                case 'lt':
                    result = compareValue < parseFloat(ruleValue);
                    break;
                case 'le':
                    result = compareValue <= parseFloat(ruleValue);
                    break;
                case 'gt':
                    result = compareValue > parseFloat(ruleValue);
                    break;
                case 'ge':
                    result = compareValue >= parseFloat(ruleValue);
                    break;
                default:
                    console.warn(`Unsupported operator: ${rule.op}`);
                    return;
            }

            // Apply the rule effect
            switch (rule.type) {
                case 'show':
                    shouldShow = shouldShow && result;
                    break;
                case 'hide':
                    shouldShow = shouldShow && !result;
                    break;
                case 'required':
                    shouldBeRequired = shouldBeRequired || result;
                    break;
                case 'disable':
                    shouldBeDisabled = shouldBeDisabled || result;
                    break;
                case 'enable':
                    shouldBeDisabled = shouldBeDisabled || !result;
                    break;
            }
        });

        // Apply final show/hide state
        const formGroup = element.closest('.form-group');
        if (formGroup) {
            formGroup.style.display = shouldShow ? '' : 'none';
            fieldStates[component.key].hidden = !shouldShow;
        }

        // Apply final required state
        element.required = shouldBeRequired;
        fieldStates[component.key].required = shouldBeRequired;

        // Apply final disabled state
        element.disabled = shouldBeDisabled;
        fieldStates[component.key].disabled = shouldBeDisabled;

        // For file inputs, also update the custom button state
        if (component.type === 'file') {
            const customButton = formGroup?.querySelector('.file-input-button');
            if (customButton) {
                customButton.style.pointerEvents = shouldBeDisabled ? 'none' : '';
                customButton.style.opacity = shouldBeDisabled ? '0.5' : '';
            }
        }
    }

    static filterSelectOptions(selectElement, component, rule, dependentValue, allComponents, formValues) {
        // Reset all options to visible first
        Array.from(selectElement.options).forEach(option => {
            option.style.display = '';
        });

        // If no dependent value, reset everything
        if (!dependentValue) {
            this.resetSelect(selectElement, component, formValues);
            this.resetDependentSelects(component.key, allComponents, formValues);
            return;
        }

        // Get the values array from the component data
        const values = component.data?.values || [];
        
        // Create a map of value to relatedWith for quick lookup
        const relatedWithMap = new Map();
        values.forEach(value => {
            if (value.value && value.relatedWith) {
                relatedWithMap.set(value.value, value.relatedWith);
            }
        });

        // Filter options based on relatedWith value
        Array.from(selectElement.options).forEach(option => {
            if (option.value) {  // Skip placeholder option
                const relatedWith = relatedWithMap.get(option.value);
                option.style.display = relatedWith === dependentValue ? '' : 'none';
            }
        });

        // If the currently selected option is now hidden, reset everything
        if (selectElement.selectedIndex !== -1 && 
            selectElement.options[selectElement.selectedIndex].style.display === 'none') {
            this.resetSelect(selectElement, component, formValues);
            this.resetDependentSelects(component.key, allComponents, formValues);
        }
    }

    static resetSelect(selectElement, component, formValues) {
        // Reset the select element value
        selectElement.value = '';
        
        // Reset the form values
        formValues[component.key] = '';
        
        // Reset the component's data if it exists
        if (component.data) {
            // Preserve the original values array
            const originalValues = [...(component.data.values || [])];
            
            // Reset the entire data object while keeping the original values
            component.data = {
                values: originalValues,
                url: component.data.url || '',
                headers: component.data.headers || [],
                custom: {},
                selected: null,
                filtered: false,
                filter: null,
                sort: null,
                limit: component.data.limit || null
            };
        }

        // Reset component's default value
        component.defaultValue = null;
        component.stringDefaultValue = null;

        // Reset any validation states
        if (component.validate) {
            component.validate.customMessage = '';
            component.validate.custom = '';
            component.validate.customPrivate = false;
            component.validate.json = '';
        }

        // Clear any error states from the UI
        selectElement.classList.remove('is-invalid', 'is-valid', 'error');
        const formGroup = selectElement.closest('.form-group');
        if (formGroup) {
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
            const validationMessage = formGroup.querySelector('.validation-message');
            if (validationMessage) {
                validationMessage.textContent = '';
            }
        }
    }

    static resetDependentSelects(parentKey, allComponents, formValues) {
        // Find all select components that depend on this one
        const dependentComponents = allComponents.filter(comp => 
            comp.type === 'select' && 
            comp.conditional?.json?.some(rule => 
                rule.type === 'filter' && rule.dependsOn === parentKey
            )
        );

        // Reset each dependent select
        dependentComponents.forEach(comp => {
            const element = document.getElementById(comp.key);
            if (element) {
                // Reset both the element and its data
                this.resetSelect(element, comp, formValues);
                // Recursively reset components that depend on this one
                this.resetDependentSelects(comp.key, allComponents, formValues);
            }
        });
    }
} 