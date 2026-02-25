import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { SliderField } from "@/types/dynamic-ui";

interface SliderFieldComponentProps {
  field: SliderField;
  value: number;
  onChange: (value: number) => void;
}

export const SliderFieldComponent: React.FC<SliderFieldComponentProps> = ({
  field,
  value,
  onChange,
}) => {
  // Ensure we always have a valid number value
  const currentValue = value ?? field.defaultValue ?? field.min;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <span className="text-sm font-medium">{currentValue}</span>
      </div>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <Slider
        id={field.id}
        min={field.min}
        max={field.max}
        step={field.step || 1}
        value={[currentValue]}
        onValueChange={(values) => onChange(values[0])}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{field.min}</span>
        <span>{field.max}</span>
      </div>
    </div>
  );
};
