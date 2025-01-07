import { Injectable } from '@angular/core';
import { FormDataService } from './form-data.service';

@Injectable({
  providedIn: 'root'
})
export class RuleEngineService {
  constructor(private formDataService: FormDataService) {}

  evaluateRules(component: any, components: any[], values: any, fieldStates: any): void {
    if (!component.rules || !component.rules.length) {
      return;
    }

    component.rules.forEach((rule: any) => {
      const conditionMet = this.evaluateCondition(rule.condition, values);
      if (conditionMet) {
        this.applyAction(rule.action, components, fieldStates);
      }
    });
  }

  private evaluateCondition(condition: any, values: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = values[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return fieldValue?.includes(value);
      case 'greaterThan':
        return fieldValue > value;
      case 'lessThan':
        return fieldValue < value;
      default:
        return false;
    }
  }

  private applyAction(action: any, components: any[], fieldStates: any): void {
    const { type, target, value } = action;
    const targetComponent = components.find(c => c.id === target);

    if (!targetComponent) {
      return;
    }

    switch (type) {
      case 'show':
        this.formDataService.updateFieldState(target, { ...fieldStates[target], visible: true });
        break;
      case 'hide':
        this.formDataService.updateFieldState(target, { ...fieldStates[target], visible: false });
        break;
      case 'enable':
        this.formDataService.updateFieldState(target, { ...fieldStates[target], enabled: true });
        break;
      case 'disable':
        this.formDataService.updateFieldState(target, { ...fieldStates[target], enabled: false });
        break;
      case 'setValue':
        this.formDataService.updateFormValue(target, value);
        break;
    }
  }
} 