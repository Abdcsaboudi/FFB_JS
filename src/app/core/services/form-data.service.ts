import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormDataService {
  private formDataSubject = new BehaviorSubject<any>(null);
  private formValuesSubject = new BehaviorSubject<any>({});
  private fieldStatesSubject = new BehaviorSubject<any>({});

  constructor(private http: HttpClient) {}

  getFormData(): Observable<any> {
    return this.formDataSubject.asObservable();
  }

  setFormData(data: any): void {
    this.formDataSubject.next(data);
    this.initializeFieldStates(data.data.components);
  }

  getFormValues(): Observable<any> {
    return this.formValuesSubject.asObservable();
  }

  updateFormValue(fieldId: string, value: any): void {
    const currentValues = this.formValuesSubject.value;
    this.formValuesSubject.next({
      ...currentValues,
      [fieldId]: value
    });
  }

  getFieldStates(): Observable<any> {
    return this.fieldStatesSubject.asObservable();
  }

  updateFieldState(fieldId: string, state: any): void {
    const currentStates = this.fieldStatesSubject.value;
    this.fieldStatesSubject.next({
      ...currentStates,
      [fieldId]: state
    });
  }

  private initializeFieldStates(components: any[]): void {
    const states: any = {};
    components.forEach(component => {
      states[component.id] = {
        valid: true,
        enabled: true,
        visible: true,
        errors: []
      };
    });
    this.fieldStatesSubject.next(states);
  }
} 