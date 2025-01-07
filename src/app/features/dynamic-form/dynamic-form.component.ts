import { Component, OnInit } from '@angular/core';
import { FormDataService } from '../../core/services/form-data.service';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent implements OnInit {
  formData: any = null;

  constructor(private formDataService: FormDataService) {}

  ngOnInit(): void {
    this.formDataService.getFormData().subscribe(data => {
      this.formData = data;
    });
  }

  onSubmit(): void {
    console.log('Form submitted:', this.formData);
  }
} 