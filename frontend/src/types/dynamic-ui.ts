// Base field interface
export interface BaseField {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
}

// Text input field
export interface TextField extends BaseField {
  type: "text";
  placeholder?: string;
  defaultValue?: string;
}

// Number input field
export interface NumberField extends BaseField {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  placeholder?: string;
}

// Slider field
export interface SliderField extends BaseField {
  type: "slider";
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
}

// Single choice (radio) field
export interface SingleChoiceField extends BaseField {
  type: "single-choice";
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  defaultValue?: string;
}

// Multiple choice (checkbox) field
export interface MultipleChoiceField extends BaseField {
  type: "multiple-choice";
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  defaultValue?: string[];
}

// Boolean (toggle) field
export interface BooleanField extends BaseField {
  type: "boolean";
  defaultValue?: boolean;
}

// Union of all field types
export type Field =
  | TextField
  | NumberField
  | SliderField
  | SingleChoiceField
  | MultipleChoiceField
  | BooleanField;

// Form schema
export interface DynamicFormSchema {
  title?: string;
  description?: string;
  fields: Field[];
  correct_answer?: Record<string, any>;
  explanation?: string;
}

// Form values type
export type FormValues = Record<string, any>;

// Submission result
export interface SubmissionResult {
  success: boolean;
  data?: FormValues;
  error?: string;
}
