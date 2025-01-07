export interface FormComponent {
  id: string;
  type: string;
  label: string;
  value?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  rules?: Rule[];
  validations?: Validation[];
  visible?: boolean;
  enabled?: boolean;
}

export interface Rule {
  condition: string;
  action: string;
  targetField: string;
  value?: any;
}

export interface Validation {
  type: string;
  message: string;
  value?: any;
}

export interface FieldState {
  visible: boolean;
  enabled: boolean;
  value: any;
  valid: boolean;
  errors: string[];
}

export interface FormData {
  statusCode: number;
  data: {
    components: FormComponent[];
  };
}

export interface FormValues {
  [key: string]: any;
}

export interface FieldStates {
  [key: string]: FieldState;
} 