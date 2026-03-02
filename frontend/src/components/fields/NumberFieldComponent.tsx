import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NumberField } from "@/types/dynamic-ui";

interface NumberFieldComponentProps {
  field: NumberField;
  value: number;
  onChange: (value: number) => void;
}

export const NumberFieldComponent: React.FC<NumberFieldComponentProps> = ({
  field,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <Input
        id={field.id}
        type="number"
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        required={field.required}
      />
    </div>
  );
};
