import React from "react";
import { Circle, CheckCircle2 } from "lucide-react";
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
  // Use vertical layout for longer options (> 3 options or any label > 30 chars)
  const useVertical = field.options.length > 3 || field.options.some(o => o.label.length > 30);

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <div className={useVertical ? "space-y-2" : "flex gap-2"}>
        {field.options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`${useVertical ? 'w-full' : 'flex-1'} flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left cursor-pointer transition-all duration-200 ${
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {selected ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs mt-0.5 leading-tight text-muted-foreground">{option.description}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
