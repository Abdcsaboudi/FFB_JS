import { Component, OnInit } from '@angular/core';
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
                <span class="required-star" *ngIf="component.validate?.required">*</span>
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
                     (click)="fileInput.click()"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event, component.key)"
                     [class.drag-over]="isDragging">
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
              <select *ngIf="component.type === 'select'"
                      [id]="component.key"
                      [formControlName]="component.key"
                      class="form-control"
                      [class.invalid]="shouldShowError(component.key)"
                      #inputField>
                <option value="" [disabled]="true">{{ component.placeholder || 'Select an option' }}</option>
                <option *ngFor="let option of component.data?.values" [value]="option.value">
                  {{ option.label }}
                </option>
              </select>

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
                  <span class="required-star" *ngIf="component.validate?.required">*</span>
                </label>
              </div>

              <!-- Radio Input -->
              <div *ngIf="component.type === 'radio'" class="radio-group">
                <div *ngFor="let option of component.data?.values" class="radio-wrapper">
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
        this.initializeForm();
      }
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
          // Only add date control if enabled
          if (component.enableDate) {
            group[component.key + '_date'] = ['', component.validate?.required ? [Validators.required] : []];
          }
          // Only add time control if enabled
          if (component.enableTime) {
            group[component.key + '_time'] = ['', component.validate?.required ? [Validators.required] : []];
          }
          // Skip the rest of the switch for datetime
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
          // For file inputs, we'll store a string value in the form
          defaultValue = '';
          break;
      }

      group[component.key] = [defaultValue, validators];
    });

    this.form = this.fb.group(group);
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
        const option = component.data.values.find((opt: any) => opt.value === value);
        displayValue = option ? option.label : value;
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
}
