import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, FormControl } from '@angular/forms';
import { FormDataService } from '../../services/form-data.service';
import { RuleEngineService } from '../../core/services/rule-engine.service';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';

interface FormComponent {
  key: string;
  type: string;
  validate?: {
    required?: boolean;
  };
  disabled?: boolean;
  defaultValue?: any;
  conditional?: {
    json?: any[];
  };
  data?: {
    values: any[];
  };
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
                       #fileInput>
                <div class="file-upload-ui" 
                     (click)="!form.get(component.key)?.disabled && fileInput.click()"
                     (dragover)="!form.get(component.key)?.disabled && onDragOver($event)"
                     (dragleave)="!form.get(component.key)?.disabled && onDragLeave($event)"
                     (drop)="!form.get(component.key)?.disabled && onDrop($event, component.key)"
                     [class.drag-over]="isDragging"
                     [class.disabled]="form.get(component.key)?.disabled">
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
                <div class="selected-options" (click)="!form.get(component.key)?.disabled && openSelectDialog(component)">
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
                         #inputField>
                </div>

                <!-- Time Picker -->
                <div class="time-group" *ngIf="component.enableTime">
                  <input type="time"
                         [id]="component.key + '_time'"
                         [formControlName]="component.key + '_time'"
                         class="form-control"
                         [class.invalid]="shouldShowError(component.key + '_time')"
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
                     #inputField>

              <!-- Textarea -->
              <textarea *ngIf="component.type === 'textarea'"
                       [id]="component.key"
                       [formControlName]="component.key"
                       class="form-control"
                       [class.invalid]="shouldShowError(component.key)"
                       [placeholder]="component.placeholder || ''"
                       [rows]="component.rows || 3"
                       #inputField></textarea>

              <!-- Checkbox -->
              <div *ngIf="component.type === 'checkbox'" class="checkbox-wrapper">
                <input type="checkbox"
                       [id]="component.key"
                       [formControlName]="component.key"
                       class="form-check-input"
                       [class.invalid]="shouldShowError(component.key)"
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
                         [class.invalid]="shouldShowError(component.key)">
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
          <!-- Search Input -->
          <div class="search-container" *ngIf="activeSelectComponent?.searchEnabled">
            <input type="text" 
                   [(ngModel)]="searchText" 
                   placeholder="Search options..."
                   class="search-input"
                   (input)="onSearch($event)">
            <span class="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>

          <div class="select-options">
            <div *ngFor="let option of getFilteredOptions()" 
                 class="select-option" 
                 [class.selected]="isOptionSelected(activeSelectComponent, option.value)"
                 (click)="toggleOption(activeSelectComponent, option.value)">
              <span class="checkbox-indicator"></span>
              {{ option.label }}
            </div>
            <div *ngIf="getFilteredOptions().length === 0" class="no-results">
              No matching options found
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
  private isEvaluatingRules = false;
  openSelect: string | null = null;
  showSelectDialog = false;
  activeSelectComponent: any = null;
  searchText: string = '';

  constructor(
    private formDataService: FormDataService,
    private ruleEngine: RuleEngineService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.formDataService.formData$.subscribe(data => {
      if (data) {
        this.formData = data;
        this.initializeForm();
      }
    });
  }

  initializeForm() {
    const group: any = {};
    
    // First pass: create form controls
    this.formData.data.components.forEach((component: FormComponent) => {
      if (component.type === 'button') return;

      // Store original select options
      if (component.type === 'select' && component.data?.values) {
        this.originalSelectOptions[component.key] = [...component.data.values];
      }

      this.fieldStates[component.key] = {
        hidden: false,
        required: component.validate?.required || false,
        disabled: component.disabled || false
      };

      const controlConfig = {
        value: component.defaultValue || '',
        disabled: component.disabled || false
      };

      group[component.key] = new FormControl(controlConfig);
    });

    this.form = this.fb.group(group);

    // Second pass: set up value change subscriptions with debounce
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.valueChanges
          .pipe(debounceTime(100))
          .subscribe(value => {
            if (!this.isEvaluatingRules) {
              this.handleFieldChange(key, value);
            }
          });
      }
    });

    // Initial rule evaluation with delay
    setTimeout(() => {
      this.evaluateAllRules();
    }, 0);
  }

  private handleFieldChange(changedField: string, value: any) {
    this.isEvaluatingRules = true;
    try {
      // Get all dependent fields in the chain
      const allDependentFields = this.getAllDependentFields(changedField);
      
      // Reset all dependent fields that have filter rules
      allDependentFields.forEach(field => {
        const hasFilterRule = field.conditional?.json?.some(rule => rule.type === 'filter' && rule.dependsOn === changedField);
        if (hasFilterRule) {
          const control = this.form.get(field.key);
          if (control) {
            // Reset the form control value
            control.setValue('', { emitEvent: true });  // This will trigger valueChanges for cascading resets
          }
        }
      });

      // Then evaluate rules for the changed field's dependents
      const directDependents = this.formData.data.components.filter((component: FormComponent) =>
        component.conditional?.json?.some(rule => rule.dependsOn === changedField)
      );

      directDependents.forEach((component: FormComponent) => {
        this.evaluateRules(component, this.form.value);
      });
    } finally {
      this.isEvaluatingRules = false;
    }
  }

  private getAllDependentFields(parentKey: string, processed: Set<string> = new Set()): FormComponent[] {
    if (processed.has(parentKey)) {
      return [];
    }
    processed.add(parentKey);

    // Find immediate dependents
    const directDependents = this.formData.data.components.filter((component: FormComponent) =>
      component.conditional?.json?.some(rule => rule.dependsOn === parentKey)
    );

    // Get all nested dependents
    const allDependents = [...directDependents];
    directDependents.forEach((component: FormComponent) => {
      const nestedDependents = this.getAllDependentFields(component.key, processed);
      allDependents.push(...nestedDependents);
    });

    return allDependents;
  }

  private evaluateAllRules() {
    this.isEvaluatingRules = true;
    try {
      this.formData.data.components.forEach((component: FormComponent) => {
        if (component.conditional?.json) {
          this.evaluateRules(component, this.form.value);
        }
      });
    } finally {
      this.isEvaluatingRules = false;
    }
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
      // Find which fields changed
      const changedFields = Object.keys(values).filter(key => 
        values[key] !== this.previousValues[key]
      );

      if (changedFields.length > 0) {
        // Evaluate rules for all components that depend on the changed fields
        this.formData.data.components.forEach((component: any) => {
          if (component.conditional?.json) {
            const dependsOnChangedField = component.conditional.json.some(
              (rule: any) => changedFields.includes(rule.dependsOn)
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

    // Initial rule evaluation
    this.formData.data.components.forEach((component: any) => {
      if (component.conditional?.json) {
        this.evaluateRules(component, this.form.value);
      }
    });
  }

  evaluateRules(component: FormComponent, formValues: any) {
    if (!component.conditional?.json?.length) {
      return;
    }

    // Map the conditional rules to our rule engine format
    const rules = component.conditional.json.map((rule: any) => {
      if (rule.type === 'filter' && component.type === 'select') {
        return {
          type: rule.type,
          conditions: [{
            dependsOn: rule.dependsOn,
            op: rule.op || 'eq',
            value: rule.value,
            compareOn: rule.compareOn
          }],
          value: this.originalSelectOptions[component.key]
        };
      }

      return {
        type: rule.type,
        conditions: [{
          dependsOn: rule.dependsOn,
          op: rule.op,
          value: rule.value,
          compareOn: rule.compareOn
        }]
      };
    });

    const ruleResults = this.ruleEngine.evaluateRules(
      rules, 
      formValues,
      this.formData.data.components,
      component.key
    );

    // Apply visibility rules
    if (ruleResults['hide']) {
      this.hideField(component);
    } else if (ruleResults['show']) {
      this.showField(component);
    }

    // Apply enabled/disabled rules
    if (ruleResults['disable']) {
      this.disableField(component);
    } else if (ruleResults['enable']) {
      this.enableField(component);
    }

    // Apply required/optional rules
    if (ruleResults['required']) {
      this.makeFieldRequired(component);
    } else if (ruleResults['optional']) {
      this.makeFieldOptional(component);
    }

    // Apply filter rules for select components
    if (component.type === 'select' && Array.isArray(ruleResults['filteredOptions'])) {
      this.updateSelectOptions(component, ruleResults['filteredOptions'] as any[]);
    }
  }

  private hideField(component: any) {
    const control = this.form.get(component.key);
    if (control) {
      this.fieldStates[component.key] = { ...this.fieldStates[component.key], hidden: true };
      if (component.clearOnHide) {
        control.setValue(null);
      }
    }
  }

  private showField(component: any) {
    if (this.form.get(component.key)) {
      this.fieldStates[component.key] = { ...this.fieldStates[component.key], hidden: false };
    }
  }

  private disableField(component: any) {
    const control = this.form.get(component.key);
    if (control) {
      control.disable({ emitEvent: false });
      this.fieldStates[component.key] = { ...this.fieldStates[component.key], disabled: true };
    }
  }

  private enableField(component: any) {
    const control = this.form.get(component.key);
    if (control) {
      control.enable({ emitEvent: false });
      this.fieldStates[component.key] = { ...this.fieldStates[component.key], disabled: false };
    }
  }

  private makeFieldRequired(component: any) {
    const control = this.form.get(component.key);
    if (control) {
      this.fieldStates[component.key] = { ...this.fieldStates[component.key], required: true };
      this.updateValidators(component, control, true);
    }
  }

  private makeFieldOptional(component: any) {
    const control = this.form.get(component.key);
    if (control) {
      this.fieldStates[component.key] = { ...this.fieldStates[component.key], required: false };
      this.updateValidators(component, control, false);
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
    this.searchText = ''; // Reset search when opening dialog
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

  onSearch(event: Event) {
    // The search is handled automatically through the getFilteredOptions method
    // but you could add additional logic here if needed
  }

  getFilteredOptions(): any[] {
    if (!this.activeSelectComponent?.data?.values) return [];
    
    const options = this.activeSelectComponent.data.values;
    if (!this.searchText || !this.activeSelectComponent.searchEnabled) {
      return options;
    }

    const searchTerm = this.searchText.toLowerCase();
    return options.filter((option: any) => 
      option.label.toLowerCase().includes(searchTerm)
    );
  }

  private updateSelectOptions(component: any, filteredOptions: any[]) {
    // Update the component's data values with filtered options
    component.data.values = filteredOptions;

    // If the current selection is not in filtered options, reset the field
    const currentValue = this.form.get(component.key)?.value;
    if (currentValue && !filteredOptions.some(opt => opt.value === currentValue)) {
      this.form.get(component.key)?.setValue('', { emitEvent: false });
    }
  }
}
