import { Routes } from '@angular/router';
import { JsonUploadComponent } from './features/json-upload/json-upload.component';
import { DynamicFormComponent } from './features/dynamic-form/dynamic-form.component';

export const routes: Routes = [
  { path: '', component: JsonUploadComponent },
  { path: 'form', component: DynamicFormComponent },
  { path: '**', redirectTo: '' }
]; 