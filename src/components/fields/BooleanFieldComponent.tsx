import React from "react";
import { Label } from "@/components/ui/label";
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
    <div className="flex items-center justify-between space-x-2">
      <div className="space-y-0.5 flex-1">
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
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
