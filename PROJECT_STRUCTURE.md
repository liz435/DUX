# AI Dynamic UI - Project Structure

## Overview
A flexible React component library for building dynamic user interfaces that adapt to AI agent needs. Components automatically render based on field type definitions, making it perfect for AI-driven applications.

## Project Structure

```
ai-dynamic-ui/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── slider.tsx
│   │   │   └── switch.tsx
│   │   ├── fields/          # Custom field components
│   │   │   ├── TextFieldComponent.tsx
│   │   │   ├── NumberFieldComponent.tsx
│   │   │   ├── SliderFieldComponent.tsx
│   │   │   ├── SingleChoiceFieldComponent.tsx
│   │   │   ├── MultipleChoiceFieldComponent.tsx
│   │   │   └── BooleanFieldComponent.tsx
│   │   └── DynamicUI.tsx    # Main component
│   ├── types/
│   │   └── dynamic-ui.ts    # TypeScript type definitions
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   ├── examples/
│   │   ├── schemas.ts       # Example schema definitions
│   │   └── AIIntegration.tsx # AI SDK integration examples
│   ├── index.ts             # Main export file
│   ├── App.tsx              # Demo application
│   └── index.css            # Global styles with Tailwind
├── public/
├── README.md                # Main documentation
├── USAGE.md                 # Detailed usage guide
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── components.json          # shadcn/ui config

```

## Key Files

### Main Component
- **DynamicUI.tsx**: The core component that renders forms dynamically based on schema

### Field Components
Each field type has its own component:
- Text input for short text
- Number input with min/max
- Slider for ranges
- Radio buttons for single choice
- Checkboxes for multiple choice
- Switch for boolean values

### Type Definitions
All TypeScript types are in `types/dynamic-ui.ts`:
- `DynamicFormSchema`: The main schema interface
- `Field`: Union type of all field types
- `FormValues`: Key-value pairs for form data
- Individual field interfaces for each type

### Export Structure
`index.ts` exports:
- Main DynamicUI component
- All individual field components (for custom use)
- All TypeScript types
- Utility functions

## Features Implemented

✅ **6 Field Types**
- Text
- Number
- Slider
- Single Choice (Radio)
- Multiple Choice (Checkbox)
- Boolean (Switch)

✅ **Full TypeScript Support**
- Type-safe schemas
- Type inference
- Strict mode enabled

✅ **Validation**
- Required fields
- Min/max for numbers
- Field-level validation

✅ **Styling**
- Tailwind CSS
- shadcn/ui components
- Dark mode support
- Customizable via CSS variables

✅ **AI Integration Ready**
- Works with Vercel AI SDK
- Dynamic schema generation
- Tool calling support
- Progressive disclosure patterns

✅ **Export Ready**
- Properly configured package.json
- All components exportable
- Can be imported as a library
- NPM publish ready

## Usage

### As a Package
```tsx
import { DynamicUI } from 'ai-dynamic-ui';
import type { DynamicFormSchema } from 'ai-dynamic-ui';

const schema: DynamicFormSchema = { /* ... */ };
<DynamicUI schema={schema} onSubmit={handleSubmit} />
```

### Development
```bash
npm install
npm run dev      # Start dev server on localhost:5174
npm run build    # Build for production
npm run lint     # Run linter
```

## Examples Included

1. **AI Model Configuration** - Configure model parameters like temperature, max tokens
2. **Survey Form** - Customer feedback with ratings and multiple choice
3. **E-commerce Filters** - Product filtering with price ranges
4. **User Registration** - Account creation with validation
5. **Image Generation** - AI image settings with quality sliders

## Integration Patterns

- **Vercel AI SDK**: useChat hook integration
- **Progressive Disclosure**: Multi-step forms based on previous answers
- **Tool Calling**: AI agent requesting specific information
- **Conditional Fields**: Dynamic field visibility
- **Prefilling**: Initial values support

## Tech Stack

- ⚡ Vite 7
- ⚛️ React 19
- 📘 TypeScript 5
- 🎨 Tailwind CSS 4
- 🎭 shadcn/ui
- 🤖 Vercel AI SDK
- 🔍 Zod (for future validation)

## Next Steps

To use this in another project:
1. Publish to npm: `npm publish`
2. Or use as local package: `npm link`
3. Or copy src/ files directly into your project

The library is fully functional and ready to use!
