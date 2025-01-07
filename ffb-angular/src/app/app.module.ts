import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DynamicFormComponent } from './features/dynamic-form/dynamic-form.component';
import { JsonUploadComponent } from './features/json-upload/json-upload.component';
import { FormFieldComponent } from './features/form-field/form-field.component';

@NgModule({
  declarations: [
    AppComponent,
    DynamicFormComponent,
    JsonUploadComponent,
    FormFieldComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { } 