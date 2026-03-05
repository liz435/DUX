import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DynamicFormSchema, FormValues, Field } from "@/types/dynamic-ui";
import { TextFieldComponent } from "./fields/TextFieldComponent";
import { NumberFieldComponent } from "./fields/NumberFieldComponent";
import { SliderFieldComponent } from "./fields/SliderFieldComponent";
import { SingleChoiceFieldComponent } from "./fields/SingleChoiceFieldComponent";
import { MultipleChoiceFieldComponent } from "./fields/MultipleChoiceFieldComponent";
import { BooleanFieldComponent } from "./fields/BooleanFieldComponent";

const TYPE_MAP: Record<string, Field["type"]> = {
  "short-answer": "text",
  "short_answer": "text",
  "free-text": "text",
  "free_text": "text",
  "textarea": "text",
  "string": "text",
  "input": "text",
  "radio": "single-choice",
  "select": "single-choice",
  "single_choice": "single-choice",
  "dropdown": "single-choice",
  "checkbox": "multiple-choice",
  "multiple_choice": "multiple-choice",
  "toggle": "boolean",
  "true-false": "boolean",
  "true_false": "boolean",
  "range": "slider",
  "integer": "number",
  "float": "number",
};

function normalizeField(raw: any): Field {
  const type = TYPE_MAP[raw.type] ?? raw.type ?? "text";
  const label = raw.label || raw.question || raw.text || raw.title || "";
  return { ...raw, type, label };
}

interface DynamicUIProps {
  schema: DynamicFormSchema;
  onSubmit: (values: FormValues) => void | Promise<void>;
  submitLabel?: string;
  className?: string;
  initialValues?: FormValues;
  disabled?: boolean;
}

export const DynamicUI: React.FC<DynamicUIProps> = ({
  schema,
  onSubmit,
  submitLabel = "Submit",
  className = "",
  initialValues = {},
  disabled = false,
}) => {
  const fields = schema.fields.map(normalizeField);

  const getDefaultValues = () => {
    const defaultValues: FormValues = {};
    fields.forEach((field) => {
      if (initialValues[field.id] !== undefined) {
        defaultValues[field.id] = initialValues[field.id];
      } else if ("defaultValue" in field && field.defaultValue !== undefined) {
        defaultValues[field.id] = field.defaultValue;
      }
    });
    return defaultValues;
  };

  const [values, setValues] = useState<FormValues>(getDefaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors.length) setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields
      .filter((field) => field.required && (values[field.id] === undefined || values[field.id] === null || values[field.id] === ''))
      .map((field) => field.label);
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: Field) => {
    const value = values[field.id];
    const onChange = (val: any) => handleFieldChange(field.id, val);
    switch (field.type) {
      case "text":
        return <TextFieldComponent key={field.id} field={field} value={value} onChange={onChange} />;
      case "number":
        return <NumberFieldComponent key={field.id} field={field} value={value} onChange={onChange} />;
      case "slider":
        return <SliderFieldComponent key={field.id} field={field} value={value} onChange={onChange} />;
      case "single-choice":
        return <SingleChoiceFieldComponent key={field.id} field={field} value={value} onChange={onChange} />;
      case "multiple-choice":
        return <MultipleChoiceFieldComponent key={field.id} field={field} value={value || []} onChange={onChange} />;
      case "boolean":
        return <BooleanFieldComponent key={field.id} field={field} value={value} onChange={onChange} />;
      default: {
        const fallback = field as unknown as Field;
        return <TextFieldComponent key={fallback.id} field={{ ...fallback, type: "text" } as any} value={value} onChange={onChange} />;
      }
    }
  };

  return (
    <div className={`rounded-2xl border bg-card shadow-sm overflow-hidden ${className}`}>
      {(schema.title || schema.description) && (
        <div className="px-6 py-5 border-b bg-muted/30">
          {schema.title && (
            <h2 className="text-base font-semibold text-foreground">{schema.title}</h2>
          )}
          {schema.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{schema.description}</p>
          )}
        </div>
      )}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((field) => (
            <div key={field.id}>{renderField(field)}</div>
          ))}
          {errors.length > 0 && (
            <p className="text-xs text-destructive">
              Please fill in: {errors.join(", ")}
            </p>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || disabled}
            className="w-full h-11 rounded-xl font-medium border-2"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </form>
      </div>
    </div>
  );
};
