let currentFormData = null;
let formValues = {};
let fieldStates = {};

// Function to create the form based on JSON response
function createFormFromJSON(jsonResponse) {
    currentFormData = jsonResponse;
    formValues = {};
    fieldStates = {};
    
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    if (jsonResponse.statusCode === 200 && jsonResponse.data.components) {
        const form = document.createElement('form');
        form.className = 'dynamic-form';
        
        jsonResponse.data.components.forEach(component => {
            const formGroup = createFormComponent(component);
            if (formGroup) {
                form.appendChild(formGroup);
                
                // Add change event listener for rule evaluation
                const input = formGroup.querySelector('.form-control');
                if (input) {
                    // Initialize form values
                    formValues[component.id] = input.value;
                    
                    input.addEventListener('input', function() {
                        // Clear validation styling
                        this.classList.remove('invalid');
                        const errorMessage = this.parentElement.querySelector('.error-message');
                        if (errorMessage) {
                            errorMessage.remove();
                        }
                        const errorSummary = document.querySelector('.error-summary');
                        if (errorSummary) {
                            errorSummary.remove();
                        }

                        // Update form values and evaluate rules
                        formValues[component.id] = this.value;
                        jsonResponse.data.components.forEach(field => {
                            RuleEngine.evaluateRules(field, jsonResponse.data.components, formValues, fieldStates);
                        });
                    });
                }
            }
        });

        // Add submit button
        if (!jsonResponse.data.components.some(comp => comp.type === 'button' && comp.action === 'submit')) {
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';

            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.className = 'btn btn-primary';
            submitButton.textContent = 'Submit';

            buttonGroup.appendChild(submitButton);
            form.appendChild(buttonGroup);
        }

        // Add form submit handler
        form.addEventListener('submit', handleFormSubmit);
        
        contentDiv.appendChild(form);

        // Initial rule evaluation
        jsonResponse.data.components.forEach(field => {
            RuleEngine.evaluateRules(field, jsonResponse.data.components, formValues, fieldStates);
        });
    } else {
        contentDiv.innerHTML = '<p class="error">Invalid form data structure</p>';
    }
}

// Function to create individual form components
function createFormComponent(component) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    // Add label if not hidden and not a checkbox
    if (!component.hidden && !component.hideLabel && component.type !== 'checkbox') {
        const label = document.createElement('label');
        label.textContent = component.label;
        formGroup.appendChild(label);
    }

    let input;
    switch (component.type) {
        case 'select':
            input = createSelectComponent(component);
            break;
        case 'datetime':
            input = createDateTimeComponent(component);
            break;
        case 'number':
            input = createNumberComponent(component);
            break;
        case 'textfield':
            input = createTextFieldComponent(component);
            break;
        case 'textarea':
            input = createTextAreaComponent(component);
            break;
        case 'radio':
            input = createRadioComponent(component);
            break;
        case 'checkbox':
            input = createCheckboxComponent(component);
            break;
        case 'file':
            input = createFileComponent(component);
            break;
        default:
            return null;
    }

    if (input) {
        formGroup.appendChild(input);

        // Add validation message if present
        if (component.validate?.message) {
            const validationMessage = document.createElement('div');
            validationMessage.className = 'validation-message';
            validationMessage.textContent = component.validate.message;
            formGroup.appendChild(validationMessage);
        }
    }

    return formGroup;
}

// Component creation helper functions
function createSelectComponent(component) {
    const select = document.createElement('select');
    select.id = component.key;
    select.name = component.key;
    select.className = 'form-control';
    select.required = component.validate?.required || false;
    select.disabled = component.disabled || false;

    // Add placeholder option if exists
    if (component.placeholder) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = component.placeholder;
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
    }

    // Add options
    if (component.data?.values) {
        component.data.values.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            if (component.defaultValue === option.value) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
    }

    return select;
}

function createDateTimeComponent(component) {
    if (component.type === 'time') {
        const timeGroup = document.createElement('div');
        timeGroup.className = 'time-picker-group';

        // Time from
        const fromGroup = document.createElement('div');
        fromGroup.className = 'form-group';
        const fromLabel = document.createElement('label');
        fromLabel.textContent = 'Time from';
        const fromInput = document.createElement('input');
        fromInput.type = 'time';
        fromInput.className = 'form-control';
        fromInput.id = component.key + '_from';
        fromInput.name = component.key + '_from';
        fromGroup.appendChild(fromLabel);
        fromGroup.appendChild(fromInput);

        // Separator
        const separator = document.createElement('span');
        separator.className = 'time-separator';
        separator.textContent = '→';

        // Time to
        const toGroup = document.createElement('div');
        toGroup.className = 'form-group';
        const toLabel = document.createElement('label');
        toLabel.textContent = 'Time to';
        const toInput = document.createElement('input');
        toInput.type = 'time';
        toInput.className = 'form-control';
        toInput.id = component.key + '_to';
        toInput.name = component.key + '_to';
        toGroup.appendChild(toLabel);
        toGroup.appendChild(toInput);

        timeGroup.appendChild(fromGroup);
        timeGroup.appendChild(separator);
        timeGroup.appendChild(toGroup);

        return timeGroup;
    } else {
        const input = document.createElement('input');
        input.type = 'date';
        input.id = component.key;
        input.name = component.key;
        input.className = 'form-control';
        return input;
    }
}

function createNumberComponent(component) {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = component.key;
    input.name = component.key;
    input.className = 'form-control';
    input.required = component.validate?.required || false;
    input.disabled = component.disabled || false;
    input.placeholder = component.placeholder || '';
    input.step = component.validate?.step || 'any';
    
    if (component.validate?.min !== null) input.min = component.validate.min;
    if (component.validate?.max !== null) input.max = component.validate.max;

    // Add prefix/suffix if present
    if (component.prefix || component.suffix) {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group';
        
        if (component.prefix) {
            const prefix = document.createElement('span');
            prefix.className = 'input-group-text';
            prefix.textContent = component.prefix;
            wrapper.appendChild(prefix);
        }
        
        wrapper.appendChild(input);
        
        if (component.suffix) {
            const suffix = document.createElement('span');
            suffix.className = 'input-group-text';
            suffix.textContent = component.suffix;
            wrapper.appendChild(suffix);
        }
        
        return wrapper;
    }

    return input;
}

function createTextFieldComponent(component) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = component.key;
    input.name = component.key;
    input.className = 'form-control';
    input.required = component.validate?.required || false;
    input.disabled = component.disabled || false;
    input.placeholder = component.placeholder || '';
    
    if (component.validate?.maxLength) input.maxLength = component.validate.maxLength;
    if (component.validate?.minLength) input.minLength = component.validate.minLength;

    return input;
}

function createTextAreaComponent(component) {
    const textarea = document.createElement('textarea');
    textarea.id = component.key;
    textarea.name = component.key;
    textarea.className = 'form-control';
    textarea.required = component.validate?.required || false;
    textarea.disabled = component.disabled || false;
    textarea.placeholder = component.placeholder || '';
    textarea.rows = component.rows || 3;
    
    if (component.validate?.maxLength) textarea.maxLength = component.validate.maxLength;
    if (component.validate?.minLength) textarea.minLength = component.validate.minLength;

    return textarea;
}

function createRadioComponent(component) {
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    component.options.forEach(option => {
        const wrapper = document.createElement('div');
        wrapper.className = 'radio-wrapper';

        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `${component.key}_${option.value}`;
        input.name = component.key;
        input.value = option.value;
        input.checked = option.value === component.defaultValue;

        const label = document.createElement('label');
        label.htmlFor = `${component.key}_${option.value}`;
        label.textContent = option.label;

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        radioGroup.appendChild(wrapper);
    });

    return radioGroup;
}

function createFileComponent(component) {
    const wrapper = document.createElement('div');
    wrapper.className = 'file-input-wrapper';

    const input = document.createElement('input');
    input.type = 'file';
    input.id = component.key;
    input.name = component.key;
    input.className = 'form-control';
    input.required = component.validate?.required || false;
    input.disabled = false; // Ensure it's not disabled by default
    input.multiple = component.multiple || false;
    
    if (component.filePattern) {
        input.accept = component.filePattern;
    }

    // Add custom file input styling
    const customButton = document.createElement('label');
    customButton.htmlFor = component.key;
    customButton.className = 'btn btn-secondary file-input-button';
    customButton.textContent = 'Choose File';

    const fileNameDisplay = document.createElement('span');
    fileNameDisplay.className = 'file-name-display';
    fileNameDisplay.textContent = 'No file chosen';

    // Update file name display when file is selected
    input.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            if (this.files.length === 1) {
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = `${this.files.length} files selected`;
            }
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(customButton);
    wrapper.appendChild(fileNameDisplay);

    return wrapper;
}

function createButtonComponent(component) {
    const button = document.createElement('button');
    button.type = component.action === 'submit' ? 'submit' : 'button';
    button.id = component.key;
    button.className = `btn btn-${component.theme || 'primary'}`;
    button.textContent = component.label;
    button.disabled = component.disabled || false;
    
    if (component.block) {
        button.className += ' btn-block';
    }

    return button;
}

function createContainerComponent(component) {
    const container = document.createElement('div');
    container.className = 'container-component';
    container.id = component.key;

    if (component.components) {
        component.components.forEach(childComponent => {
            const childElement = createFormComponent(childComponent);
            if (childElement) {
                container.appendChild(childElement);
            }
        });
    }

    return container;
}

function createCheckboxComponent(component) {
    const wrapper = document.createElement('div');
    wrapper.className = 'checkbox-wrapper';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = component.key;
    input.name = component.key;
    input.className = 'form-check-input';
    input.checked = component.defaultValue || false;

    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.htmlFor = component.key;
    label.textContent = component.label;

    wrapper.appendChild(input);
    wrapper.appendChild(label);

    return wrapper;
}

// Form submission handler
function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!currentFormData) {
        console.error('No form data available');
        return;
    }

    // Clear any existing error summary
    const existingSummary = document.querySelector('.error-summary');
    if (existingSummary) {
        existingSummary.remove();
    }

    // Clear any existing validation messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

    // Validate the form
    const { isValid, errors } = ValidationEngineUtil.validateForm(currentFormData);
    
    if (!isValid) {
        // Create error summary at the top of the form
        const errorSummary = document.createElement('div');
        errorSummary.className = 'error-summary error';
        errorSummary.innerHTML = `
            <strong>Please correct the following errors:</strong>
            <ul>
                ${Object.entries(errors).map(([key, message]) => `
                    <li>
                        <a href="#${key}">${message}</a>
                    </li>
                `).join('')}
            </ul>
        `;
        
        const form = event.target;
        form.insertBefore(errorSummary, form.firstChild);
        
        // Scroll to the first error and focus it
        const firstInvalidField = document.querySelector('.form-control.invalid');
        if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // If validation passes, collect form data
    const formData = new FormData(event.target);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    console.log('Form submitted with data:', data);
    // Here you can add your API call to submit the form data
} 