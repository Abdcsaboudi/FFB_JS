import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormDataService } from '../../core/services/form-data.service';

@Component({
  selector: 'app-json-upload',
  templateUrl: './json-upload.component.html',
  styleUrls: ['./json-upload.component.css']
})
export class JsonUploadComponent {
  constructor(
    private formDataService: FormDataService,
    private router: Router
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          this.formDataService.setFormData(jsonData);
          this.router.navigate(['/form']);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    }
  }
} 