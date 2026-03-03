import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { MultipleChoiceField } from "@/types/dynamic-ui";

interface MultipleChoiceFieldComponentProps {
  field: MultipleChoiceField;
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultipleChoiceFieldComponent: React.FC<MultipleChoiceFieldComponentProps> = ({
  field,
  value = [],
  onChange,
}) => {
  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
        )}
      </div>
      <div className="grid gap-2">
        {field.options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={`${field.id}-${option.value}`}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all duration-150 ${
                checked
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <Checkbox
                id={`${field.id}-${option.value}`}
                checked={checked}
                onCheckedChange={() => handleToggle(option.value)}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${checked ? "text-primary" : "text-foreground"}`}>
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
