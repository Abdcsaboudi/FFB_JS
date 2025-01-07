import { Injectable } from '@angular/core';

export interface Condition {
  dependsOn: string;
  op: string;
  value: any;
}

export interface Rule {
  type: string;
  conditions: Condition[];
}

@Injectable({
  providedIn: 'root'
})
export class RuleEngineService {
  constructor() { }

  evaluateCondition(condition: Condition, formValues: any): boolean {
    const fieldValue = formValues[condition.dependsOn];
    
    // Special handling for empty string checks
    if (condition.op === 'eq' && condition.value === '') {
      // Check if the field value is empty (empty string, null, or undefined)
      return !fieldValue && fieldValue !== 0;
    }

    // Handle null/undefined field values
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    switch (condition.op) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'le':
        return fieldValue <= condition.value;
      case 'ge':
        return fieldValue >= condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      default:
        return false;
    }
  }

  evaluateRules(rules: Rule[], formValues: any): { [key: string]: boolean } {
    const results: { [key: string]: boolean } = {
      show: true,
      hide: false,
      enable: true,
      disable: false,
      required: false,
      optional: true
    };

    if (!rules || !rules.length) {
      return results;
    }

    for (const rule of rules) {
      if (!rule.conditions || !rule.conditions.length) {
        continue;
      }

      const conditionsMet = rule.conditions.every(condition => 
        this.evaluateCondition(condition, formValues)
      );

      switch (rule.type) {
        case 'show':
          results['show'] = conditionsMet;
          results['hide'] = !conditionsMet;
          break;
        case 'hide':
          results['hide'] = conditionsMet;
          results['show'] = !conditionsMet;
          break;
        case 'enable':
          results['enable'] = conditionsMet;
          results['disable'] = !conditionsMet;
          break;
        case 'disable':
          results['disable'] = conditionsMet;
          results['enable'] = !conditionsMet;
          break;
        case 'required':
          results['required'] = conditionsMet;
          results['optional'] = !conditionsMet;
          break;
        case 'optional':
          results['optional'] = conditionsMet;
          results['required'] = !conditionsMet;
          break;
      }
    }

    return results;
  }
}
