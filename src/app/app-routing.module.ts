import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JsonUploadComponent } from './features/json-upload/json-upload.component';
import { DynamicFormComponent } from './features/dynamic-form/dynamic-form.component';

const routes: Routes = [
  { path: '', component: JsonUploadComponent },
  { path: 'form', component: DynamicFormComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 