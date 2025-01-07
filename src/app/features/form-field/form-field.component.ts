import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css']
})
export class FormFieldComponent {
  @Input() component: any;
  @Input() control!: FormControl;
  @Input() fieldState: any;

  get isDisabled(): boolean {
    return !this.fieldState?.enabled;
  }

  get showError(): boolean {
    return this.control?.touched && !this.fieldState?.valid;
  }

  get fieldType(): string {
    switch (this.component?.type?.toLowerCase()) {
      case 'text':
      case 'email':
      case 'number':
      case 'tel':
      case 'url':
        return this.component.type.toLowerCase();
      case 'textarea':
        return 'textarea';
      case 'select':
        return 'select';
      case 'radio':
        return 'radio';
      case 'checkbox':
        return 'checkbox';
      default:
        return 'text';
    }
  }
} 