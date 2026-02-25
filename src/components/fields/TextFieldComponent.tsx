import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <Input
        id={field.id}
        type="text"
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    </div>
  );
};
