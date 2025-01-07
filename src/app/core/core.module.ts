import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDataService } from './services/form-data.service';
import { RuleEngineService } from './services/rule-engine.service';
import { ValidationService } from './services/validation.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    FormDataService,
    RuleEngineService,
    ValidationService
  ]
})
export class CoreModule { } 