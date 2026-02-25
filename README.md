# AI Dynamic UI

A flexible, type-safe React component library for building dynamic user interfaces that adapt to AI agent needs. Built with Vite, Vercel AI SDK, and shadcn/ui.

## Features

- 🎨 **Adaptive UI Components** - Automatically render appropriate UI based on field types
- 🤖 **AI-Ready** - Designed to work seamlessly with AI agents and the Vercel AI SDK
- 📝 **Type-Safe** - Fully typed with TypeScript
- 🎯 **Multiple Input Types** - Text, numbers, sliders, single choice, multiple choice, and boolean
- 🎨 **Beautiful UI** - Built with shadcn/ui and Tailwind CSS
- 📦 **Easy to Import** - Use as standalone components in your React projects

## Installation

```bash
npm install ai-dynamic-ui
```

### Peer Dependencies

Make sure you have the following installed:

```bash
npm install react react-dom
```

## Quick Start

```tsx
import { DynamicUI } from 'ai-dynamic-ui';
import type { DynamicFormSchema, FormValues } from 'ai-dynamic-ui';

function App() {
  const schema: DynamicFormSchema = {
    title: "User Preferences",
    description: "Configure your preferences",
    fields: [
      {
        id: "name",
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: true,
      },
      {
        id: "age",
        type: "number",
        label: "Age",
        min: 18,
        max: 100,
      },
      {
        id: "theme",
        type: "single-choice",
        label: "Theme",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ],
      },
    ],
  };

  const handleSubmit = (values: FormValues) => {
    console.log("Submitted:", values);
    // Send to your AI agent or API
  };

  return <DynamicUI schema={schema} onSubmit={handleSubmit} />;
}
```

## Field Types

### Text Field

```typescript
{
  id: "username",
  type: "text",
  label: "Username",
  placeholder: "Enter username",
  description: "Your unique username",
  required: true,
  defaultValue: "user123"
}
```

### Number Field

```typescript
{
  id: "age",
  type: "number",
  label: "Age",
  min: 0,
  max: 120,
  step: 1,
  defaultValue: 25,
  required: true
}
```

### Slider Field

```typescript
{
  id: "temperature",
  type: "slider",
  label: "Temperature",
  description: "AI response creativity",
  min: 0,
  max: 1,
  step: 0.1,
  defaultValue: 0.7
}
```

### Single Choice (Radio)

```typescript
{
  id: "model",
  type: "single-choice",
  label: "AI Model",
  options: [
    {
      value: "gpt-4",
      label: "GPT-4",
      description: "Most capable"
    },
    {
      value: "gpt-3.5",
      label: "GPT-3.5",
      description: "Fast and efficient"
    }
  ],
  required: true
}
```

### Multiple Choice (Checkbox)

```typescript
{
  id: "features",
  type: "multiple-choice",
  label: "Features",
  options: [
    { value: "search", label: "Web Search" },
    { value: "memory", label: "Memory" },
    { value: "code", label: "Code Execution" }
  ],
  defaultValue: ["memory"]
}
```

### Boolean (Switch)

```typescript
{
  id: "streaming",
  type: "boolean",
  label: "Enable Streaming",
  description: "Stream responses in real-time",
  defaultValue: true
}
```

## Component API

### DynamicUI Props

```typescript
interface DynamicUIProps {
  schema: DynamicFormSchema;           // Form configuration
  onSubmit: (values: FormValues) => void | Promise<void>;  // Submit handler
  submitLabel?: string;                // Custom submit button text
  className?: string;                  // Additional CSS classes
  initialValues?: FormValues;          // Pre-populate form values
}
```

### DynamicFormSchema

```typescript
interface DynamicFormSchema {
  title?: string;         // Form title
  description?: string;   // Form description
  fields: Field[];        // Array of field configurations
}
```

## Importing Individual Components

You can also import and use individual field components:

```tsx
import {
  TextFieldComponent,
  NumberFieldComponent,
  SliderFieldComponent,
  SingleChoiceFieldComponent,
  MultipleChoiceFieldComponent,
  BooleanFieldComponent
} from 'ai-dynamic-ui';
```

## Styling

This library uses Tailwind CSS and shadcn/ui. Make sure your project has Tailwind CSS configured. Import the styles:

```tsx
import 'ai-dynamic-ui/styles.css';
```

## Integration with Vercel AI SDK

The DynamicUI component works seamlessly with AI agents:

```tsx
import { useChat } from 'ai/react';
import { DynamicUI } from 'ai-dynamic-ui';

function AIChat() {
  const { messages, append } = useChat();

  const handleSubmit = async (values: FormValues) => {
    await append({
      role: 'user',
      content: JSON.stringify(values)
    });
  };

  return (
    <DynamicUI
      schema={aiGeneratedSchema}
      onSubmit={handleSubmit}
    />
  );
}
```

## Example: AI Configuration Form

```tsx
const aiConfigSchema: DynamicFormSchema = {
  title: "AI Agent Configuration",
  description: "Customize your AI agent's behavior",
  fields: [
    {
      id: "model",
      type: "single-choice",
      label: "Model",
      options: [
        { value: "gpt-4", label: "GPT-4" },
        { value: "claude-3", label: "Claude 3" }
      ],
      required: true
    },
    {
      id: "temperature",
      type: "slider",
      label: "Creativity",
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.7
    },
    {
      id: "features",
      type: "multiple-choice",
      label: "Capabilities",
      options: [
        { value: "search", label: "Web Search" },
        { value: "code", label: "Code Execution" },
        { value: "memory", label: "Long-term Memory" }
      ]
    },
    {
      id: "streaming",
      type: "boolean",
      label: "Enable Streaming",
      defaultValue: true
    }
  ]
};
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build library
npm run build

# Run linter
npm run lint
```

## Tech Stack

- ⚡ **Vite** - Fast build tool
- ⚛️ **React 19** - UI library
- 📘 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Styling
- 🎭 **shadcn/ui** - UI components
- 🤖 **Vercel AI SDK** - AI integration
- 🔍 **Zod** - Schema validation

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
# DUX
