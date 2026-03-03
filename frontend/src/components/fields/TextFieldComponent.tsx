import React from "react";
import { Input } from "@/components/ui/input";
import type { TextField } from "@/types/dynamic-ui";

interface TextFieldComponentProps {
  field: TextField;
  value: string;
  onChange: (value: string) => void;
}

export const TextFieldComponent: React.FC<TextFieldComponentProps> = ({
  field,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={field.id} className="text-sm font-semibold text-foreground">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <Input
        id={field.id}
        type="text"
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        className="h-11 rounded-xl border-2 border-border focus:border-primary transition-colors"
      />
    </div>
  );
};
