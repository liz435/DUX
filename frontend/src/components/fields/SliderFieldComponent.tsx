import React from "react";
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
  const currentValue = value ?? field.defaultValue ?? field.min;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label htmlFor={field.id} className="text-sm font-semibold text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <span className="text-sm font-semibold text-primary tabular-nums">{currentValue}</span>
      </div>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
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
