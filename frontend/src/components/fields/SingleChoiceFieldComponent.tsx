import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SingleChoiceField } from "@/types/dynamic-ui";

interface SingleChoiceFieldComponentProps {
  field: SingleChoiceField;
  value: string;
  onChange: (value: string) => void;
}

export const SingleChoiceFieldComponent: React.FC<
  SingleChoiceFieldComponentProps
> = ({ field, value, onChange }) => {
  return (
    <div className="space-y-3">
      <Label>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <RadioGroup value={value} onValueChange={onChange}>
        {field.options.map((option) => (
          <div key={option.value} className="flex items-start space-x-2">
            <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
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
      </RadioGroup>
    </div>
  );
};
