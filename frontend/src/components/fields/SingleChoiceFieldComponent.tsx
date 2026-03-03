import React from "react";
import type { SingleChoiceField } from "@/types/dynamic-ui";

interface SingleChoiceFieldComponentProps {
  field: SingleChoiceField;
  value: string;
  onChange: (value: string) => void;
}

export const SingleChoiceFieldComponent: React.FC<SingleChoiceFieldComponentProps> = ({
  field,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <div className="flex gap-2">
        {field.options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-center cursor-pointer transition-all duration-150 ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm bg-black/20"
                  : "border-border hover:border-primary/40 hover:bg-muted/40 "
              }`}
            >
              <div className={`text-sm font-medium ${selected ? "text-primary-foreground" : "text-foreground"}`}>
                {option.label}
              </div>
              {option.description && (
                <div className={`text-xs mt-0.5 leading-tight ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{option.description}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
