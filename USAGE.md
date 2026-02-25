# Usage Guide: AI Dynamic UI

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Field Types Reference](#field-types-reference)
3. [Integration with AI Agents](#integration-with-ai-agents)
4. [Styling & Customization](#styling--customization)
5. [Advanced Patterns](#advanced-patterns)

## Basic Usage

### Simple Form
```tsx
import { DynamicUI, DynamicFormSchema, FormValues } from 'ai-dynamic-ui';

const schema: DynamicFormSchema = {
  title: "User Profile",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      min: 18,
    },
  ],
};

function MyForm() {
  const handleSubmit = (values: FormValues) => {
    console.log(values);
  };

  return <DynamicUI schema={schema} onSubmit={handleSubmit} />;
}
```

## Field Types Reference

### Text Field
Best for: short text input, names, emails, etc.
```typescript
{
  id: "email",
  type: "text",
  label: "Email Address",
  placeholder: "you@example.com",
  description: "We'll never share your email",
  required: true,
  defaultValue: ""
}
```

### Number Field
Best for: ages, quantities, prices
```typescript
{
  id: "quantity",
  type: "number",
  label: "Quantity",
  min: 1,
  max: 100,
  step: 1,
  defaultValue: 1,
  required: true
}
```

### Slider Field
Best for: ranges, ratings, percentages
```typescript
{
  id: "satisfaction",
  type: "slider",
  label: "Satisfaction Level",
  description: "Rate from 1 to 10",
  min: 1,
  max: 10,
  step: 1,
  defaultValue: 7
}
```

### Single Choice (Radio)
Best for: mutually exclusive options
```typescript
{
  id: "plan",
  type: "single-choice",
  label: "Select a Plan",
  required: true,
  options: [
    { value: "free", label: "Free", description: "$0/month" },
    { value: "pro", label: "Pro", description: "$9/month" },
    { value: "enterprise", label: "Enterprise", description: "Contact us" }
  ]
}
```

### Multiple Choice (Checkboxes)
Best for: selecting multiple options
```typescript
{
  id: "interests",
  type: "multiple-choice",
  label: "Interests",
  options: [
    { value: "sports", label: "Sports" },
    { value: "music", label: "Music" },
    { value: "tech", label: "Technology" }
  ],
  defaultValue: ["tech"]
}
```

### Boolean (Switch)
Best for: yes/no, on/off, enable/disable
```typescript
{
  id: "notifications",
  type: "boolean",
  label: "Enable Notifications",
  description: "Receive email updates",
  defaultValue: true
}
```

## Integration with AI Agents

### With Vercel AI SDK
```tsx
import { useChat } from 'ai/react';
import { DynamicUI } from 'ai-dynamic-ui';

function AIChat() {
  const { messages, append } = useChat();

  // AI generates this schema dynamically
  const schema = parseAIResponse(messages[messages.length - 1]);

  const handleSubmit = async (values: FormValues) => {
    await append({
      role: 'user',
      content: JSON.stringify(values)
    });
  };

  return <DynamicUI schema={schema} onSubmit={handleSubmit} />;
}
```

### Progressive Disclosure Pattern
```tsx
function SmartForm() {
  const [schemas, setSchemas] = useState<DynamicFormSchema[]>([initialSchema]);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (values: FormValues) => {
    // Send to AI
    const nextSchema = await getNextQuestions(values);
    
    if (nextSchema) {
      setSchemas([...schemas, nextSchema]);
      setCurrentStep(currentStep + 1);
    }
  };

  return <DynamicUI schema={schemas[currentStep]} onSubmit={handleSubmit} />;
}
```

### AI Tool Calling
```tsx
// AI agent requests specific information
const toolCallSchema: DynamicFormSchema = {
  title: "Additional Information Needed",
  description: "The AI needs more details to help you",
  fields: [
    // Dynamically generated based on AI's needs
  ]
};
```

## Styling & Customization

### Custom CSS Classes
```tsx
<DynamicUI
  schema={schema}
  onSubmit={handleSubmit}
  className="max-w-md mx-auto shadow-lg"
/>
```

### Theme Customization
The components use CSS variables. Override in your CSS:
```css
:root {
  --radius: 0.75rem;
  --primary: 222.2 47.4% 11.2%;
  /* ... other variables */
}
```

### Custom Submit Button
```tsx
<DynamicUI
  schema={schema}
  onSubmit={handleSubmit}
  submitLabel="🚀 Launch"
/>
```

## Advanced Patterns

### Conditional Fields
```tsx
function ConditionalForm() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [schema, setSchema] = useState(basicSchema);

  useEffect(() => {
    if (showAdvanced) {
      setSchema({
        ...basicSchema,
        fields: [...basicSchema.fields, ...advancedFields]
      });
    }
  }, [showAdvanced]);

  return (
    <>
      <button onClick={() => setShowAdvanced(!showAdvanced)}>
        Toggle Advanced
      </button>
      <DynamicUI schema={schema} onSubmit={handleSubmit} />
    </>
  );
}
```

### Prefilling Values
```tsx
<DynamicUI
  schema={schema}
  initialValues={{
    name: "John Doe",
    age: 30,
    notifications: true
  }}
  onSubmit={handleSubmit}
/>
```

### Multi-Step Forms
```tsx
function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const schemas = [step1Schema, step2Schema, step3Schema];

  const handleSubmit = (values: FormValues) => {
    setFormData({ ...formData, ...values });
    
    if (step < schemas.length - 1) {
      setStep(step + 1);
    } else {
      // Final submission
      submitToAPI(formData);
    }
  };

  return (
    <>
      <div className="progress-bar">
        Step {step + 1} of {schemas.length}
      </div>
      <DynamicUI
        schema={schemas[step]}
        initialValues={formData}
        onSubmit={handleSubmit}
        submitLabel={step < schemas.length - 1 ? "Next" : "Submit"}
      />
    </>
  );
}
```

### Validation
```tsx
const schema: DynamicFormSchema = {
  fields: [
    {
      id: "email",
      type: "text",
      label: "Email",
      required: true,
      // Built-in validation through required field
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      min: 18,  // Built-in min/max validation
      max: 120,
      required: true
    }
  ]
};
```

### Dynamic Schema Generation
```tsx
// Generate schema from AI response
function parseAIToolCall(toolCall: any): DynamicFormSchema {
  return {
    title: toolCall.title,
    description: toolCall.description,
    fields: toolCall.parameters.map((param: any) => ({
      id: param.name,
      type: mapAITypeToFieldType(param.type),
      label: param.label,
      required: param.required,
      ...param.options && { options: param.options }
    }))
  };
}
```

## Best Practices

1. **Keep it Simple**: Start with required fields only
2. **Progressive Disclosure**: Show advanced options only when needed
3. **Clear Labels**: Use descriptive labels and descriptions
4. **Sensible Defaults**: Pre-fill common values
5. **Validation**: Use built-in validation (required, min/max)
6. **Loading States**: Handle async submissions properly
7. **Error Handling**: Provide clear feedback on submission errors

## Examples

See the `/examples` folder for:
- AI Model Configuration
- Survey Forms
- E-commerce Filters
- User Registration
- Image Generation Settings

## Support

For issues, questions, or contributions, visit our GitHub repository.
