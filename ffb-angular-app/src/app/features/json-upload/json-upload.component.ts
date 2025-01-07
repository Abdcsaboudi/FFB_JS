import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormDataService } from '../../services/form-data.service';

@Component({
  selector: 'app-json-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container">
      <div class="upload-content">
        <div class="upload-header">
          <h1>Form Builder</h1>
          <p class="subtitle">Upload your JSON configuration file to start building your dynamic form</p>
        </div>

        <div class="upload-area" 
             (click)="fileInput.click()"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             [class.drag-over]="isDragging">
          <input #fileInput 
                 type="file" 
                 accept=".json"
                 (change)="onFileSelected($event)" 
                 class="file-input">
          
          <div class="upload-placeholder" *ngIf="!selectedFile">
            <div class="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3>Choose a JSON file or drag it here</h3>
            <p>Supported format: .json</p>
          </div>

          <div class="file-info" *ngIf="selectedFile">
            <div class="file-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div class="file-details">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
            <button class="remove-file" 
                    (click)="removeFile($event)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="upload-actions">
          <button class="upload-button" 
                  [disabled]="!selectedFile || isLoading"
                  (click)="processFile()">
            <span class="button-content">
              <span>{{ isLoading ? 'Processing...' : 'Build Form' }}</span>
              <svg *ngIf="!isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
              <div class="spinner" *ngIf="isLoading"></div>
            </span>
          </button>
        </div>

        <div class="error-message" *ngIf="error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./json-upload.component.css']
})
export class JsonUploadComponent {
  selectedFile: File | null = null;
  isDragging = false;
  isLoading = false;
  error: string | null = null;

  constructor(
    private formDataService: FormDataService,
    private router: Router
  ) {}

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

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidJsonFile(file)) {
        this.selectedFile = file;
        this.error = null;
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.isValidJsonFile(file)) {
      this.selectedFile = file;
      this.error = null;
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.error = null;
  }

  isValidJsonFile(file: File): boolean {
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.error = 'Please select a valid JSON file';
      return false;
    }
    return true;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  processFile() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.error = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target?.result as string);
        this.formDataService.setFormData(jsonContent);
        this.router.navigate(['/form-builder']);
      } catch (error) {
        this.error = 'Invalid JSON format. Please check your file content.';
        this.isLoading = false;
      }
    };

    reader.onerror = () => {
      this.error = 'Error reading file. Please try again.';
      this.isLoading = false;
    };

    reader.readAsText(this.selectedFile);
  }
}
