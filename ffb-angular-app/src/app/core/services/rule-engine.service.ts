import { Injectable } from '@angular/core';

export interface Condition {
  dependsOn: string;
  op: string;
  value: any;
  compareOn?: string;
}

export interface Rule {
  type: string;
  conditions: Condition[];
  value?: SelectOption[];
}

export interface SelectOption {
  value: any;
  label: string;
  relatedWith?: any;
}

@Injectable({
  providedIn: 'root'
})
export class RuleEngineService {
  constructor() { }

  evaluateCondition(condition: Condition, formValues: any, ruleType?: string): boolean {
    const fieldValue = formValues[condition.dependsOn];
    
    // Special handling for filter rules
    if (ruleType === 'filter') {
      return true; // Always evaluate filter rules, actual filtering happens in filterOptions
    }

    // Special handling for empty string checks
    if (condition.op === 'eq' && condition.value === '') {
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

  evaluateRules(rules: Rule[], formValues: any, allComponents?: any[], currentKey?: string): { [key: string]: boolean | SelectOption[] } {
    const results: { [key: string]: boolean | SelectOption[] } = {
      show: true,
      hide: false,
      enable: true,
      disable: false,
      required: false,
      optional: true,
      filteredOptions: []
    };

    if (!rules || !rules.length) {
      return results;
    }

    for (const rule of rules) {
      if (!rule.conditions || !rule.conditions.length) {
        continue;
      }

      const conditionsMet = rule.conditions.every(condition => 
        this.evaluateCondition(condition, formValues, rule.type)
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
        case 'filter':
          if (rule.conditions[0]) {
            const dependentValue = formValues[rule.conditions[0].dependsOn];
            results['filteredOptions'] = this.filterOptions(
              rule.value as SelectOption[], 
              dependentValue,
              allComponents,
              formValues,
              currentKey
            );
          }
          break;
      }
    }

    return results;
  }

  filterOptions(options: SelectOption[], dependentValue: any, allComponents?: any[], formValues?: any, currentKey?: string): SelectOption[] {
    // If parent value is empty/null/undefined, return empty array
    if (!dependentValue && dependentValue !== 0) {
      return [];
    }

    // If we have the full context, check the entire dependency chain
    if (allComponents && formValues && currentKey) {
      // Find the current component's dependencies
      const currentComponent = allComponents.find(comp => comp.key === currentKey);
      if (currentComponent) {
        // Check if any parent in the chain is empty
        let parentKey = currentComponent.conditional?.json?.[0]?.dependsOn;
        while (parentKey) {
          const parentValue = formValues[parentKey];
          if (!parentValue && parentValue !== 0) {
            return []; // Return empty if any parent is empty
          }

          // Get the parent component
          const parentComponent = allComponents.find(comp => comp.key === parentKey);
          if (parentComponent?.type === 'select') {
            // Check if the parent value exists in any relatedWith values
            const parentOptions = parentComponent.data?.values || [];
            const validParentValue = parentOptions.some((opt: SelectOption) => opt.value === parentValue);
            if (!validParentValue) {
              return []; // Return empty if parent value is not valid
            }
          }

          // Move to next parent in chain
          parentKey = parentComponent?.conditional?.json?.[0]?.dependsOn;
        }
      }
    }

    return options.filter(option => {
      if (!option.value) {
        return true; // Keep placeholder options
      }
      return option.relatedWith === dependentValue;
    });
  }

  resetDependentFields(parentKey: string, allComponents: any[], formValues: any): void {
    // Find all select components that depend on this one
    const dependentComponents = allComponents.filter(comp => 
      comp.type === 'select' && 
      comp.conditional?.json?.some((rule: any) => 
        rule.type === 'filter' && rule.dependsOn === parentKey
      )
    );

    // Reset each dependent select
    dependentComponents.forEach(comp => {
      formValues[comp.key] = '';
      // Recursively reset components that depend on this one
      this.resetDependentFields(comp.key, allComponents, formValues);
    });
  }
}
