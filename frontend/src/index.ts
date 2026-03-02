// Main component
export { DynamicUI } from "./components/DynamicUI";

// Field components (for custom usage)
export { TextFieldComponent } from "./components/fields/TextFieldComponent";
export { NumberFieldComponent } from "./components/fields/NumberFieldComponent";
export { SliderFieldComponent } from "./components/fields/SliderFieldComponent";
export { SingleChoiceFieldComponent } from "./components/fields/SingleChoiceFieldComponent";
export { MultipleChoiceFieldComponent } from "./components/fields/MultipleChoiceFieldComponent";
export { BooleanFieldComponent } from "./components/fields/BooleanFieldComponent";

// Types
export type {
  BaseField,
  TextField,
  NumberField,
  SliderField,
  SingleChoiceField,
  MultipleChoiceField,
  BooleanField,
  Field,
  DynamicFormSchema,
  FormValues,
  SubmissionResult,
} from "./types/dynamic-ui";

// Utilities
export { cn } from "./lib/utils";
