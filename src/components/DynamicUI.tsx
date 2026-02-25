import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DynamicFormSchema, FormValues, Field } from "@/types/dynamic-ui";
import { TextFieldComponent } from "./fields/TextFieldComponent";
import { NumberFieldComponent } from "./fields/NumberFieldComponent";
import { SliderFieldComponent } from "./fields/SliderFieldComponent";
import { SingleChoiceFieldComponent } from "./fields/SingleChoiceFieldComponent";
import { MultipleChoiceFieldComponent } from "./fields/MultipleChoiceFieldComponent";
import { BooleanFieldComponent } from "./fields/BooleanFieldComponent";

interface DynamicUIProps {
  schema: DynamicFormSchema;
  onSubmit: (values: FormValues) => void | Promise<void>;
  submitLabel?: string;
  className?: string;
  initialValues?: FormValues;
}

export const DynamicUI: React.FC<DynamicUIProps> = ({
  schema,
  onSubmit,
  submitLabel = "Submit",
  className = "",
  initialValues = {},
}) => {
  // Initialize with default values from schema
  const getDefaultValues = () => {
    const defaultValues: FormValues = {};
    schema.fields.forEach((field) => {
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

  const handleFieldChange = (fieldId: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = schema.fields
      .filter((field) => field.required && !values[field.id])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(", ")}`);
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

    switch (field.type) {
      case "text":
        return (
          <TextFieldComponent
            key={field.id}
            field={field}
            value={value}
            onChange={(val) => handleFieldChange(field.id, val)}
          />
        );
      case "number":
        return (
          <NumberFieldComponent
            key={field.id}
            field={field}
            value={value}
            onChange={(val) => handleFieldChange(field.id, val)}
          />
        );
      case "slider":
        return (
          <SliderFieldComponent
            key={field.id}
            field={field}
            value={value}
            onChange={(val) => handleFieldChange(field.id, val)}
          />
        );
      case "single-choice":
        return (
          <SingleChoiceFieldComponent
            key={field.id}
            field={field}
            value={value}
            onChange={(val) => handleFieldChange(field.id, val)}
          />
        );
      case "multiple-choice":
        return (
          <MultipleChoiceFieldComponent
            key={field.id}
            field={field}
            value={value || []}
            onChange={(val) => handleFieldChange(field.id, val)}
          />
        );
      case "boolean":
        return (
          <BooleanFieldComponent
            key={field.id}
            field={field}
            value={value}
            onChange={(val) => handleFieldChange(field.id, val)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        {schema.title && <CardTitle>{schema.title}</CardTitle>}
        {schema.description && (
          <CardDescription>{schema.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {schema.fields.map((field) => (
            <div key={field.id}>{renderField(field)}</div>
          ))}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
