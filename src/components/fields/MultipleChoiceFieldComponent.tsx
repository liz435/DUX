import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { MultipleChoiceField } from "@/types/dynamic-ui";

interface MultipleChoiceFieldComponentProps {
  field: MultipleChoiceField;
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultipleChoiceFieldComponent: React.FC<
  MultipleChoiceFieldComponentProps
> = ({ field, value = [], onChange }) => {
  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <Label>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <div className="space-y-2">
        {field.options.map((option) => (
          <div key={option.value} className="flex items-start space-x-2">
            <Checkbox
              id={`${field.id}-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor={`${field.id}-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
