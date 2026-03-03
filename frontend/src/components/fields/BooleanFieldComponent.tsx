import React from "react";
import { Switch } from "@/components/ui/switch";
import type { BooleanField } from "@/types/dynamic-ui";

interface BooleanFieldComponentProps {
  field: BooleanField;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const BooleanFieldComponent: React.FC<BooleanFieldComponentProps> = ({
  field,
  value,
  onChange,
}) => {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
        value ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="space-y-0.5 flex-1 pr-4">
        <label htmlFor={field.id} className="text-sm font-semibold text-foreground cursor-pointer">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
      <Switch
        id={field.id}
        checked={value ?? false}
        onCheckedChange={onChange}
      />
    </div>
  );
};
