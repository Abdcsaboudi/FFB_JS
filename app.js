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
        
        // Add red star for required fields
        if (component.validate?.required) {
            const requiredStar = document.createElement('span');
            requiredStar.className = 'required-star';
            requiredStar.textContent = ' *';
            requiredStar.style.color = 'red';
            label.appendChild(requiredStar);
        }
        
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

        // Add change event listener for any input that other components depend on
        const baseInput = input.tagName === 'DIV' ? input.querySelector('input, select, textarea') : input;
        if (baseInput) {
            // Initialize form values
            formValues[component.key] = baseInput.value;

            // Add input event listener if this field is depended upon by other fields
            if (currentFormData?.data?.components?.some(comp => 
                comp.conditional?.json?.some(rule => rule.dependsOn === component.key)
            )) {
                baseInput.addEventListener('input', function() {
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

                    // Update form values
                    formValues[component.key] = this.value;

                    // Re-evaluate rules for all dependent components
                    if (currentFormData?.data?.components) {
                        currentFormData.data.components.forEach(field => {
                            if (field.conditional?.json?.some(rule => rule.dependsOn === component.key)) {
                                RuleEngine.evaluateRules(field, currentFormData.data.components, formValues, fieldStates);
                            }
                        });
                    }
                });
            }
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
    const wrapper = document.createElement('div');
    wrapper.className = 'datetime-wrapper';

    // If both flags are false, return empty wrapper
    if (!component.enableDate && !component.enableTime) {
        return wrapper;
    }

    // Create date input if enabled
    if (component.enableDate) {
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = `${component.key}_date`;
        dateInput.name = `${component.key}_date`;
        dateInput.className = 'form-control';
        dateInput.required = component.validate?.required || false;
        dateInput.disabled = component.disabled || false;

        // Handle min/max dates if provided in datePicker
        if (component.datePicker?.minDate) {
            try {
                // Try to parse the date and format it as YYYY-MM-DD
                const minDate = new Date(component.datePicker.minDate);
                if (!isNaN(minDate.getTime())) {
                    dateInput.min = minDate.toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn('Invalid minDate format:', e);
            }
        }
        if (component.datePicker?.maxDate) {
            try {
                // Try to parse the date and format it as YYYY-MM-DD
                const maxDate = new Date(component.datePicker.maxDate);
                if (!isNaN(maxDate.getTime())) {
                    dateInput.max = maxDate.toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn('Invalid maxDate format:', e);
            }
        }

        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        if (component.label) {
            const dateLabel = document.createElement('label');
            dateLabel.htmlFor = `${component.key}_date`;
            dateLabel.textContent = 'Date';
            
            // Add red star for required date fields
            if (component.validate?.required) {
                const requiredStar = document.createElement('span');
                requiredStar.className = 'required-star';
                requiredStar.textContent = ' *';
                requiredStar.style.color = 'red';
                dateLabel.appendChild(requiredStar);
            }
            
            dateGroup.appendChild(dateLabel);
        }
        dateGroup.appendChild(dateInput);
        wrapper.appendChild(dateGroup);
    }

    // Create time input if enabled
    if (component.enableTime) {
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.id = `${component.key}_time`;
        timeInput.name = `${component.key}_time`;
        timeInput.className = 'form-control';
        timeInput.required = component.validate?.required || false;
        timeInput.disabled = component.disabled || false;

        // Handle 24-hour format
        if (component.timePicker?.showMeridian === false) {
            timeInput.step = component.timePicker?.minuteStep || 60;
        }

        const timeGroup = document.createElement('div');
        timeGroup.className = 'time-group';
        if (component.label) {
            const timeLabel = document.createElement('label');
            timeLabel.htmlFor = `${component.key}_time`;
            timeLabel.textContent = 'Time';
            
            // Add red star for required time fields
            if (component.validate?.required) {
                const requiredStar = document.createElement('span');
                requiredStar.className = 'required-star';
                requiredStar.textContent = ' *';
                requiredStar.style.color = 'red';
                timeLabel.appendChild(requiredStar);
            }
            
            timeGroup.appendChild(timeLabel);
        }
        timeGroup.appendChild(timeInput);
        wrapper.appendChild(timeGroup);
    }

    // Add combined value handler
    wrapper.getValue = function() {
        const dateValue = component.enableDate ? this.querySelector('input[type="date"]')?.value : '';
        const timeValue = component.enableTime ? this.querySelector('input[type="time"]')?.value : '';
        
        if (dateValue && timeValue) {
            return `${dateValue}T${timeValue}`;
        } else if (dateValue) {
            return dateValue;
        } else if (timeValue) {
            return timeValue;
        }
        return '';
    };

    // Add event listeners to update form values
    const inputs = wrapper.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            formValues[component.key] = wrapper.getValue();
        });
    });

    return wrapper;
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

    // Get options from values array first, then fall back to data.values, then options
    const options = component.values || (component.data && component.data.values) || component.options || [];
    
    options.forEach(option => {
        const wrapper = document.createElement('div');
        wrapper.className = 'radio-wrapper';
        if (component.inline) {
            wrapper.className += ' radio-inline';
        }

        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `${component.key}_${option.value}`;
        input.name = component.key;
        input.value = option.value;
        input.required = component.validate?.required || false;
        input.checked = option.value === component.defaultValue || option.value === component.stringDefaultValue;

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

    // Add red star for required checkboxes
    if (component.validate?.required) {
        const requiredStar = document.createElement('span');
        requiredStar.className = 'required-star';
        requiredStar.textContent = ' *';
        requiredStar.style.color = 'red';
        label.appendChild(requiredStar);
    }

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
    const data = {};
    
    // Collect all form values including custom components
    currentFormData.data.components.forEach(component => {
        if (component.type === 'datetime') {
            // Handle datetime components
            const dateInput = document.querySelector(`input[name="${component.key}_date"]`);
            const timeInput = document.querySelector(`input[name="${component.key}_time"]`);
            
            let value = '';
            if (component.enableDate && dateInput) {
                value = dateInput.value;
            }
            if (component.enableTime && timeInput) {
                if (value) {
                    value += `T${timeInput.value}`;
                } else {
                    value = timeInput.value;
                }
            }
            data[component.key] = value;
        } else if (component.type === 'radio') {
            // Handle radio components
            const selectedRadio = document.querySelector(`input[name="${component.key}"]:checked`);
            data[component.key] = selectedRadio ? selectedRadio.value : '';
        } else if (component.type === 'checkbox') {
            // Handle checkbox components
            const checkbox = document.querySelector(`input[name="${component.key}"]`);
            data[component.key] = checkbox ? checkbox.checked : false;
        } else if (component.type === 'file') {
            // Handle file components
            const fileInput = document.querySelector(`input[name="${component.key}"]`);
            if (fileInput && fileInput.files.length > 0) {
                data[component.key] = Array.from(fileInput.files).map(file => file.name);
            } else {
                data[component.key] = [];
            }
        } else {
            // Handle other components
            const input = document.querySelector(`[name="${component.key}"]`);
            if (input) {
                data[component.key] = input.value;
            }
        }
    });

    // Show the data dialog
    showFormDataDialog(data);
}

function showFormDataDialog(data) {
    // Remove any existing dialog
    const existingDialog = document.querySelector('.form-data-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    // Create dialog container
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'form-data-dialog';

    // Create dialog content
    const title = document.createElement('h2');
    title.textContent = 'Form Submission Data';
    dialog.appendChild(title);

    const content = document.createElement('div');
    content.className = 'dialog-content';

    // Format and display each field
    Object.entries(data).forEach(([key, value]) => {
        const field = document.createElement('div');
        field.className = 'dialog-field';

        // Find the component to get its label
        const component = currentFormData.data.components.find(comp => comp.key === key);
        const label = component ? component.label : key;

        // Format the value based on type
        let displayValue = value;
        if (Array.isArray(value)) {
            displayValue = value.join(', ') || 'No files selected';
        } else if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
        } else if (value === '') {
            displayValue = 'Not provided';
        }

        field.innerHTML = `
            <strong>${label}:</strong>
            <span>${displayValue}</span>
        `;
        content.appendChild(field);
    });

    dialog.appendChild(content);

    // Add action buttons
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.onclick = () => {
        dialogOverlay.remove();
        // Here you can add the actual form submission logic
        console.log('Form data confirmed:', data);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-outline-primary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => dialogOverlay.remove();

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    dialog.appendChild(actions);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'dialog-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => dialogOverlay.remove();
    dialog.appendChild(closeBtn);

    dialogOverlay.appendChild(dialog);
    document.body.appendChild(dialogOverlay);
} 