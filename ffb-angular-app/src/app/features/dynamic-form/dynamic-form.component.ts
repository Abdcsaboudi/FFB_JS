import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormDataService } from '../../services/form-data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dynamic-form-container">
      <h2>Event Form</h2>
      <div *ngIf="formData" class="form-content">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <ng-container *ngFor="let component of formData.data.components">
            <div class="form-group" [ngStyle]="getFieldStyles(component)" *ngIf="component.type !== 'button'">
              <!-- Label for non-checkbox fields -->
              <label *ngIf="component.type !== 'checkbox'" [for]="component.key">
                {{ component.label }}
                <span class="required-star" *ngIf="getFieldRequired(component)">*</span>
              </label>

              <!-- File Input -->
              <div *ngIf="component.type === 'file'" class="file-upload-wrapper">
                <input type="file"
                       [id]="component.key"
                       [accept]="component.fileTypes?.join(',')"
                       (change)="onFileSelected($event, component.key)"
                       class="file-input"
                       [disabled]="getFieldDisabled(component)"
                       #fileInput>
                <div class="file-upload-ui" 
                     (click)="!getFieldDisabled(component) && fileInput.click()"
                     (dragover)="!getFieldDisabled(component) && onDragOver($event)"
                     (dragleave)="!getFieldDisabled(component) && onDragLeave($event)"
                     (drop)="!getFieldDisabled(component) && onDrop($event, component.key)"
                     [class.drag-over]="isDragging"
                     [class.disabled]="getFieldDisabled(component)">
                  <div class="file-upload-placeholder" *ngIf="!getFileName(component.key)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>{{ component.placeholder || 'Click to upload or drag and drop' }}</span>
                  </div>
                  <div class="file-info" *ngIf="getFileName(component.key)">
                    <span class="file-name">{{ getFileName(component.key) }}</span>
                    <button type="button" 
                            class="remove-file" 
                            (click)="removeFile(component.key, fileInput); $event.stopPropagation()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Select Input -->
              <div *ngIf="component.type === 'select'" class="select-wrapper">
                <div class="selected-options" (click)="openSelectDialog(component)">
                  <span *ngIf="!getSelectedLabels(component).length">
                    {{ component.placeholder || 'Select an option' }}
                  </span>
                  <span *ngIf="getSelectedLabels(component).length" class="selected-values">
                    {{ getSelectedLabels(component) }}
                  </span>
                  <span class="dropdown-icon"></span>
                </div>
              </div>

              <!-- DateTime Input -->
              <div *ngIf="component.type === 'datetime'" class="datetime-wrapper">
                <!-- Date Picker -->
                <div class="date-group" *ngIf="component.enableDate">
                  <input type="date"
                         [id]="component.key + '_date'"
                         [formControlName]="component.key + '_date'"
                         class="form-control"
                         [class.invalid]="shouldShowError(component.key + '_date')"
                         [disabled]="getFieldDisabled(component)"
                         #inputField>
                </div>

                <!-- Time Picker -->
                <div class="time-group" *ngIf="component.enableTime">
                  <input type="time"
                         [id]="component.key + '_time'"
                         [formControlName]="component.key + '_time'"
                         class="form-control"
                         [class.invalid]="shouldShowError(component.key + '_time')"
                         [disabled]="getFieldDisabled(component)"
                         #inputField>
                </div>
              </div>

              <!-- Number Input -->
              <div *ngIf="component.type === 'number'" class="input-group">
                <span *ngIf="component.prefix" class="input-group-text">{{ component.prefix }}</span>
                <input type="number"
                       [id]="component.key"
                       [formControlName]="component.key"
                       class="form-control"
                       [class.invalid]="shouldShowError(component.key)"
                       [placeholder]="component.placeholder || ''"
                       [disabled]="getFieldDisabled(component)"
                       #inputField>
                <span *ngIf="component.suffix" class="input-group-text">{{ component.suffix }}</span>
              </div>

              <!-- Text Input -->
              <input *ngIf="component.type === 'textfield'"
                     type="text"
                     [id]="component.key"
                     [formControlName]="component.key"
                     class="form-control"
                     [class.invalid]="shouldShowError(component.key)"
                     [placeholder]="component.placeholder || ''"
                     [disabled]="getFieldDisabled(component)"
                     #inputField>

              <!-- Textarea -->
              <textarea *ngIf="component.type === 'textarea'"
                       [id]="component.key"
                       [formControlName]="component.key"
                       class="form-control"
                       [class.invalid]="shouldShowError(component.key)"
                       [placeholder]="component.placeholder || ''"
                       [rows]="component.rows || 3"
                       [disabled]="getFieldDisabled(component)"
                       #inputField></textarea>

              <!-- Checkbox -->
              <div *ngIf="component.type === 'checkbox'" class="checkbox-wrapper">
                <input type="checkbox"
                       [id]="component.key"
                       [formControlName]="component.key"
                       class="form-check-input"
                       [class.invalid]="shouldShowError(component.key)"
                       [disabled]="getFieldDisabled(component)"
                       #inputField>
                <label class="form-check-label" [for]="component.key">
                  {{ component.label }}
                  <span class="required-star" *ngIf="getFieldRequired(component)">*</span>
                </label>
              </div>

              <!-- Radio Input -->
              <div *ngIf="component.type === 'radio'" class="radio-group" [ngClass]="{'radio-inline': component.inline}">
                <div *ngFor="let option of component.values" class="radio-wrapper">
                  <input type="radio"
                         [id]="component.key + '_' + option.value"
                         [name]="component.key"
                         [value]="option.value"
                         [formControlName]="component.key"
                         class="form-check-input"
                         [class.invalid]="shouldShowError(component.key)"
                         [disabled]="getFieldDisabled(component)">
                  <label class="form-check-label" [for]="component.key + '_' + option.value">
                    {{ option.label }}
                  </label>
                </div>
              </div>

              <!-- Error Message -->
              <div *ngIf="shouldShowError(component.key)" class="error-message">
                {{ getErrorMessage(component) }}
              </div>
            </div>
          </ng-container>

          <!-- Submit Button Group -->
          <div class="submit-button-group">
            <button type="submit" class="submit-button" [disabled]="isSubmitting">
              <span class="button-content">
                <span class="button-text">Submit Form</span>
                <span class="button-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </span>
              <div class="button-loader" *ngIf="isSubmitting">
                <div class="loader"></div>
              </div>
            </button>

            <button type="button" class="save-draft-button">
              Save as Draft
            </button>
          </div>
        </form>
      </div>
      <div *ngIf="!formData" class="no-data">
        <p>No form data available. Please upload a JSON file first.</p>
        <button (click)="goToUpload()" class="back-button">Go to Upload</button>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div *ngIf="showConfirmDialog" class="dialog-overlay" (click)="closeDialog()">
      <div class="form-data-dialog" (click)="$event.stopPropagation()">
        <h2>Confirm Submission</h2>
        <button class="dialog-close" (click)="closeDialog()">&times;</button>
        
        <div class="dialog-content">
          <div *ngFor="let field of getFormattedFields()" class="dialog-field">
            <strong>{{ field.label }}:</strong>
            <span>{{ field.value }}</span>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="submit-button" (click)="confirmSubmit()">
            Confirm
          </button>
          <button class="save-draft-button" (click)="closeDialog()">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Select Dialog -->
    <div *ngIf="showSelectDialog" class="dialog-overlay" (click)="closeSelectDialog()">
      <div class="select-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>{{ activeSelectComponent?.label || 'Select Options' }}</h3>
          <button class="dialog-close" (click)="closeSelectDialog()">&times;</button>
        </div>
        
        <div class="dialog-content">
          <div class="select-options">
            <div *ngFor="let option of activeSelectComponent?.data?.values" 
                 class="select-option" 
                 [class.selected]="isOptionSelected(activeSelectComponent, option.value)"
                 (click)="toggleOption(activeSelectComponent, option.value)">
              <span class="checkbox-indicator"></span>
              {{ option.label }}
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="submit-button" (click)="closeSelectDialog()">Done</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent implements OnInit {
  formData: any;
  form: FormGroup;
  fieldStates: { [key: string]: any } = {};
  isSubmitting = false;
  showValidation = false;
  showConfirmDialog = false;
  fileData: { [key: string]: File } = {};
  isDragging = false;
  private previousValues: any = {};
  private originalSelectOptions: { [key: string]: any[] } = {};
  openSelect: string | null = null;
  showSelectDialog = false;
  activeSelectComponent: any = null;

  constructor(
    private formDataService: FormDataService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.formDataService.formData$.subscribe(data => {
      if (data) {
        this.formData = data;
        this.storeOriginalSelectOptions();
        this.initializeForm();
        this.setupRuleEvaluation();
      }
    });
  }

  private storeOriginalSelectOptions() {
    console.log('Storing original select options');
    this.formData.data.components.forEach((component: any) => {
      if (component.type === 'select' && component.data?.values) {
        console.log('Storing options for', component.key, component.data.values);
        this.originalSelectOptions[component.key] = [...component.data.values];
      }
    });
    console.log('Stored original options:', this.originalSelectOptions);
  }

  private filterSelectOptions(component: any, filterRule: any, formValues: any) {
    console.log('Filtering select options:', {
      componentKey: component.key,
      dependentField: filterRule.dependentField,
      formValues,
      originalOptions: this.originalSelectOptions[component.key]
    });

    if (!this.originalSelectOptions[component.key]) {
      console.warn('No original options found for', component.key);
      return;
    }

    const dependentValue = formValues[filterRule.dependentField];
    const originalOptions = this.originalSelectOptions[component.key];

    console.log('Dependent value:', dependentValue);

    // Reset if no dependent value
    if (!dependentValue && dependentValue !== 0) {
      console.log('No dependent value, resetting', component.key);
      this.resetSelect(component);
      this.resetDependentSelects(component.key);
      return;
    }

    // Filter options based on the dependent value
    const filteredOptions = originalOptions.filter(option => {
      if (!option.value) {
        console.log('Keeping placeholder option:', option);
        return true; // Keep placeholder options
      }

      // Check if the option should be shown based on the dependent value
      const shouldKeep = option.relatedWith === dependentValue;
      console.log('Filtering option:', {
        value: option.value,
        relatedWith: option.relatedWith,
        dependentValue,
        shouldKeep
      });
      return shouldKeep;
    });

    console.log('Filtered options:', filteredOptions);

    // Update the component's options
    component.data.values = filteredOptions;

    // If the current selection is not in filtered options, reset this and dependent fields
    const control = this.form.get(component.key);
    if (control) {
      const currentValue = control.value;
      console.log('Current value check:', {
        componentKey: component.key,
        currentValue,
        hasValidOption: filteredOptions.some(opt => opt.value === currentValue)
      });

      if (currentValue && !filteredOptions.some(opt => opt.value === currentValue)) {
        console.log('Resetting due to invalid selection');
        this.resetSelect(component);
        this.resetDependentSelects(component.key);
      } else if (currentValue) {
        console.log('Filtering dependent fields for', component.key);
        this.filterDependentFields(component.key, currentValue);
      }
    }
  }

  private filterDependentFields(parentKey: string, parentValue: any) {
    console.log('Finding dependent fields for', parentKey);
    
    // Find all components that depend on this field
    const dependentComponents = this.formData.data.components.filter((comp: any) => {
      const hasDependency = comp.type === 'select' && 
        comp.conditional?.json?.some((rule: { type: string; dependentField: string }) => 
          rule.type === 'filter' && rule.dependentField === parentKey
        );
      console.log('Checking component:', {
        key: comp.key,
        hasDependency
      });
      return hasDependency;
    });

    console.log('Found dependent components:', dependentComponents.map((c: any) => c.key));

    // Apply filtering to each dependent component
    dependentComponents.forEach((comp: any) => {
      const filterRule = comp.conditional.json.find((rule: { type: string; dependentField: string }) => 
        rule.type === 'filter' && rule.dependentField === parentKey
      );
      
      if (filterRule) {
        console.log('Applying filter rule:', {
          component: comp.key,
          rule: filterRule
        });
        // Create a temporary form values object with the current parent value
        const tempFormValues = { ...this.form.value, [parentKey]: parentValue };
        this.filterSelectOptions(comp, filterRule, tempFormValues);
      }
    });
  }

  private resetSelect(component: any) {
    // Reset form control
    const control = this.form.get(component.key);
    if (control) {
      control.setValue('', { emitEvent: false });
    }

    // Reset component data while preserving original values
    if (component.data) {
      const originalValues = [...this.originalSelectOptions[component.key]];
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

    // Reset validation states
    if (component.validate) {
      component.validate.customMessage = '';
      component.validate.custom = '';
      component.validate.customPrivate = false;
      component.validate.json = '';
    }
  }

  private resetDependentSelects(parentKey: string) {
    // Find all select components that depend on this one
    const dependentComponents = this.formData.data.components.filter((comp: any) => 
      comp.type === 'select' && 
      comp.conditional?.json?.some((rule: { type: string; dependsOn: string }) => 
        rule.type === 'filter' && rule.dependsOn === parentKey
      )
    );

    // Reset each dependent select
    dependentComponents.forEach((comp: any) => {
      this.resetSelect(comp);
      // Recursively reset components that depend on this one
      this.resetDependentSelects(comp.key);
    });
  }

  initializeForm() {
    const group: any = {};
    
    this.formData.data.components.forEach((component: any) => {
      if (component.type === 'button') return;

      this.fieldStates[component.key] = {
        hidden: false,
        required: component.validate?.required || false,
        disabled: component.disabled || false
      };

      let defaultValue = component.defaultValue || '';
      let validators = [];

      if (component.validate?.required) {
        validators.push(Validators.required);
      }

      switch (component.type) {
        case 'checkbox':
          defaultValue = component.defaultValue || false;
          break;
        case 'number':
          if (component.validate?.min !== undefined) {
            validators.push(Validators.min(component.validate.min));
          }
          if (component.validate?.max !== undefined) {
            validators.push(Validators.max(component.validate.max));
          }
          break;
        case 'datetime':
          if (component.enableDate) {
            group[component.key + '_date'] = ['', component.validate?.required ? [Validators.required] : []];
          }
          if (component.enableTime) {
            group[component.key + '_time'] = ['', component.validate?.required ? [Validators.required] : []];
          }
          return;
        case 'textfield':
        case 'textarea':
          if (component.validate?.minLength) {
            validators.push(Validators.minLength(component.validate.minLength));
          }
          if (component.validate?.maxLength) {
            validators.push(Validators.maxLength(component.validate.maxLength));
          }
          if (component.validate?.pattern) {
            validators.push(Validators.pattern(component.validate.pattern));
          }
          break;
        case 'file':
          defaultValue = '';
          break;
      }

      group[component.key] = [defaultValue, validators];
    });

    this.form = this.fb.group(group);

    // Subscribe to individual form control value changes
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.valueChanges.subscribe(value => {
          // Evaluate rules for all components that might depend on this field
          this.formData.data.components.forEach((component: any) => {
            if (component.conditional?.json) {
              const dependsOnThisField = component.conditional.json.some(
                (rule: any) => rule.dependsOn === key
              );
              if (dependsOnThisField) {
                this.evaluateRules(component, this.form.value);
              }
            }
          });
        });
      }
    });

    // Initial rule evaluation
    this.formData.data.components.forEach((component: any) => {
      if (component.conditional?.json) {
        this.evaluateRules(component, this.form.value);
      }
    });
  }

  onFileSelected(event: any, key: string) {
    const file = event.target.files[0];
    if (file) {
      this.fileData[key] = file;
      this.form.get(key)?.setValue(file.name);
      this.form.get(key)?.markAsTouched();
    }
  }

  getFileName(key: string): string {
    return this.fileData[key]?.name || '';
  }

  removeFile(key: string, fileInput: HTMLInputElement) {
    delete this.fileData[key];
    this.form.get(key)?.setValue('');
    fileInput.value = '';
  }

  shouldShowError(key: string): boolean {
    const control = this.form.get(key);
    return control ? (control.invalid && (this.showValidation || control.touched)) : false;
  }

  getErrorMessage(component: any): string {
    const control = this.form.get(component.key);
    if (!control) return '';

    if (control.hasError('required')) {
      return `${component.label} is required`;
    }
    if (control.hasError('min')) {
      return `${component.label} must be at least ${component.validate.min}`;
    }
    if (control.hasError('max')) {
      return `${component.label} must be at most ${component.validate.max}`;
    }
    if (control.hasError('minlength')) {
      return `${component.label} must be at least ${component.validate.minLength} characters`;
    }
    if (control.hasError('maxlength')) {
      return `${component.label} must be at most ${component.validate.maxLength} characters`;
    }
    if (control.hasError('pattern')) {
      return `${component.label} has an invalid format`;
    }
    return '';
  }

  getFormattedFields() {
    const formData = this.form.value;
    return Object.entries(formData).map(([key, value]) => {
      const component = this.formData.data.components.find((comp: any) => comp.key === key);
      if (!component) return null;

      let displayValue = value;
      if (component.type === 'select') {
        if (component.multiple && Array.isArray(value)) {
          // Handle multiple selections
          displayValue = value
            .map(v => component.data.values.find((opt: any) => opt.value === v)?.label || v)
            .join(', ');
        } else {
          // Handle single selection
          const option = component.data.values.find((opt: any) => opt.value === value);
          displayValue = option ? option.label : value;
        }
      } else if (component.type === 'checkbox') {
        displayValue = value ? 'Yes' : 'No';
      } else if (component.type === 'file') {
        displayValue = this.fileData[key]?.name || 'No file selected';
      }

      return {
        label: component.label,
        value: displayValue || 'Not provided'
      };
    }).filter(field => field !== null);
  }

  onSubmit() {
    this.showValidation = true;
    
    if (this.form.valid) {
      this.showConfirmDialog = true;
    } else {
      const firstInvalidControl = Object.keys(this.form.controls)
        .find(key => this.form.controls[key].invalid);
      
      if (firstInvalidControl) {
        const element = document.getElementById(firstInvalidControl);
        if (element) {
          element.focus();
        }
      }
    }
  }

  closeDialog() {
    this.showConfirmDialog = false;
    this.isSubmitting = false;
  }

  confirmSubmit() {
    this.isSubmitting = true;
    const formData = new FormData();
    
    // Add regular form fields
    Object.entries(this.form.value).forEach(([key, value]) => {
      if (this.fileData[key]) {
        formData.append(key, this.fileData[key]);
      } else {
        formData.append(key, value as string);
      }
    });

    console.log('Form submitted:', Object.fromEntries(formData));
    this.closeDialog();
  }

  getFieldStyles(component: any) {
    return {
      display: this.fieldStates[component.key]?.hidden ? 'none' : 'block'
    };
  }

  goToUpload() {
    this.router.navigate(['/']);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent, key: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.fileData[key] = file;
      this.form.get(key)?.setValue(file.name);
      this.form.get(key)?.markAsTouched();
    }
  }

  formatDateTime(component: any, formValue: any): string {
    if (!component.enableDate && !component.enableTime) return '';
    
    let parts = [];
    if (component.enableDate && formValue[component.key + '_date']) {
      parts.push(formValue[component.key + '_date']);
    }
    if (component.enableTime && formValue[component.key + '_time']) {
      parts.push(formValue[component.key + '_time']);
    }
    return parts.join(' ');
  }

  setupRuleEvaluation() {
    // Subscribe to value changes of all form controls
    this.form.valueChanges.subscribe(values => {
      // Find which field changed
      const changedField = Object.keys(values).find(key => 
        values[key] !== this.previousValues[key]
      );

      if (changedField) {
        // Only evaluate rules for components that depend on the changed field
        this.formData.data.components.forEach((component: any) => {
          if (component.conditional?.json) {
            const dependsOnChangedField = component.conditional.json.some(
              (rule: any) => rule.dependsOn === changedField
            );
            if (dependsOnChangedField) {
              this.evaluateRules(component, values);
            }
          }
        });
      }

      // Update previous values
      this.previousValues = { ...values };
    });
  }

  evaluateRules(component: any, formValues: any) {
    if (!component.conditional?.json) return;
    
    const rules = component.conditional.json;
    let showResult = true;
    let requiredResult = false;
    
    console.log('Evaluating rules for component:', component.key);
    console.log('Current form values:', formValues);
    console.log('Rules:', rules);
    
    rules.forEach((rule: { 
      dependentField: string; 
      type: string; 
      operation: string; 
      value: any;
      compareOn?: string;
    }) => {
      const dependentValue = formValues[rule.dependentField];

      // Handle filter rule type
      if (rule.type === 'filter') {
        this.filterSelectOptions(component, rule, formValues);
        return;
      }

      let ruleResult = false;

      // Handle empty value cases
      if (!dependentValue && dependentValue !== 0) {
        if (rule.type === 'show') {
          showResult = false;
        }
        return;
      }

      // Convert values for comparison
      const ruleValue = rule.value;
      let compareValue = dependentValue;

      // For numeric comparisons, ensure we're comparing numbers
      if (['lt', 'le', 'gt', 'ge'].includes(rule.operation)) {
        compareValue = parseFloat(dependentValue);
      }

      switch (rule.operation) {
        case 'eq':
          ruleResult = compareValue === ruleValue;
          break;
        case 'ne':
          ruleResult = compareValue !== ruleValue;
          break;
        case 'lt':
          ruleResult = compareValue < parseFloat(ruleValue);
          break;
        case 'le':
          ruleResult = compareValue <= parseFloat(ruleValue);
          break;
        case 'gt':
          ruleResult = compareValue > parseFloat(ruleValue);
          break;
        case 'ge':
          ruleResult = compareValue >= parseFloat(ruleValue);
          break;
        case 'contains':
          const upperCompareValue = String(compareValue || '').toUpperCase();
          const upperRuleValue = String(ruleValue || '').toUpperCase();
          ruleResult = upperCompareValue.includes(upperRuleValue);
          break;
      }

      // Apply the rule effect
      switch (rule.type) {
        case 'show':
          showResult = showResult && ruleResult;
          break;
        case 'hide':
          showResult = showResult && !ruleResult;
          break;
        case 'required':
          requiredResult = requiredResult || ruleResult;
          break;
        case 'disable':
          this.fieldStates[component.key].disabled = ruleResult;
          break;
        case 'enable':
          this.fieldStates[component.key].disabled = !ruleResult;
          break;
      }
    });

    // Apply final results
    console.log('Final results for', component.key, ':', {
      show: showResult,
      required: requiredResult
    });

    this.applyRule(component, 'show', showResult);
    if (rules.some((rule: { type: string }) => rule.type === 'required')) {
      this.applyRule(component, 'required', requiredResult);
    }
  }

  private applyRule(component: any, ruleType: string, result: boolean) {
    // Ensure the field state exists
    if (!this.fieldStates[component.key]) {
      this.fieldStates[component.key] = {
        hidden: false,
        disabled: false,
        required: component.validate?.required || false
      };
    }

    const control = this.form.get(component.key);
    if (!control) return;

    switch (ruleType) {
      case 'show':
        this.fieldStates[component.key].hidden = !result;
        if (!result) {
          // Clear value when hiding
          control.setValue('', { emitEvent: false });
        }
        break;
      case 'hide':
        this.fieldStates[component.key].hidden = result;
        if (result) {
          // Clear value when hiding
          control.setValue('', { emitEvent: false });
        }
        break;
      case 'disable':
        this.fieldStates[component.key].disabled = result;
        if (result) {
          control.disable({ emitEvent: false });
        } else {
          control.enable({ emitEvent: false });
        }
        break;
      case 'enable':
        this.fieldStates[component.key].disabled = !result;
        if (result) {
          control.enable({ emitEvent: false });
        } else {
          control.disable({ emitEvent: false });
        }
        break;
      case 'required':
        this.fieldStates[component.key].required = result;
        this.updateValidators(component, control, result);
        break;
    }
  }

  private updateValidators(component: any, control: any, required: boolean) {
    const validators = [];
    
    if (required) {
      validators.push(Validators.required);
    }
    
    // Preserve other validators
    if (component.validate?.pattern) {
      validators.push(Validators.pattern(component.validate.pattern));
    }
    if (component.validate?.minLength) {
      validators.push(Validators.minLength(component.validate.minLength));
    }
    if (component.validate?.maxLength) {
      validators.push(Validators.maxLength(component.validate.maxLength));
    }
    
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  // Update the template binding for disabled state
  getFieldDisabled(component: any): boolean {
    return this.fieldStates[component.key]?.disabled || false;
  }

  // Update the template binding for required state
  getFieldRequired(component: any): boolean {
    return this.fieldStates[component.key]?.required || false;
  }

  // Get formatted selected labels
  getSelectedLabels(component: any): string {
    const value = this.form.get(component.key)?.value;
    if (!value) return '';
    
    const values = Array.isArray(value) ? value : [value];
    return values
      .map(v => component.data?.values.find((opt: any) => opt.value === v)?.label || v)
      .join(', ');
  }

  // Toggle select dropdown
  toggleSelect(event: Event, selectElement: HTMLSelectElement) {
    event.stopPropagation();
    if (this.openSelect === selectElement.id) {
      this.openSelect = null;
    } else {
      this.openSelect = selectElement.id;
      selectElement.focus();
    }
  }

  // Handle select blur
  onSelectBlur() {
    // Add a small delay to allow for option selection
    setTimeout(() => {
      this.openSelect = null;
    }, 200);
  }

  // Add click handler to close select when clicking outside
  @HostListener('document:click')
  onDocumentClick() {
    this.openSelect = null;
  }

  openSelectDialog(component: any) {
    if (this.getFieldDisabled(component)) return;
    this.activeSelectComponent = component;
    this.showSelectDialog = true;
  }

  closeSelectDialog() {
    this.showSelectDialog = false;
    this.activeSelectComponent = null;
  }

  isOptionSelected(component: any, value: any): boolean {
    const currentValue = this.form.get(component.key)?.value;
    if (component.multiple) {
      return Array.isArray(currentValue) && currentValue.includes(value);
    }
    return currentValue === value;
  }

  toggleOption(component: any, value: any) {
    const control = this.form.get(component.key);
    if (!control) return;

    if (component.multiple) {
      const currentValues = Array.isArray(control.value) ? control.value : [];
      const valueIndex = currentValues.indexOf(value);
      
      if (valueIndex === -1) {
        control.setValue([...currentValues, value]);
      } else {
        control.setValue(currentValues.filter((v: any) => v !== value));
      }
    } else {
      control.setValue(value);
      this.closeSelectDialog();
    }
  }
}
