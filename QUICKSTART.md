# 🚀 Quick Start Guide

## Getting Started in 2 Minutes

### 1. View the Demo
```bash
cd ai-dynamic-ui
npm run dev
```
Open http://localhost:5174 to see a working demo with an AI agent configuration form.

### 2. Basic Usage

```tsx
import { DynamicUI } from './src/components/DynamicUI';

const schema = {
  title: "Quick Example",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Your Name",
      required: true,
    },
    {
      id: "rating",
      type: "slider",
      label: "Rating",
      min: 1,
      max: 10,
      defaultValue: 7,
    },
  ],
};

function App() {
  return (
    <DynamicUI 
      schema={schema} 
      onSubmit={(values) => console.log(values)} 
    />
  );
}
```

### 3. Try the Examples

Check `src/examples/schemas.ts` for 5 ready-to-use examples:
- AI Model Configuration
- Survey Form
- Product Filters
- User Registration
- Image Generation Settings

Simply import and use:
```tsx
import { aiModelConfigSchema } from './src/examples/schemas';

<DynamicUI schema={aiModelConfigSchema} onSubmit={handleSubmit} />
```

## Field Types Available

| Type | Use Case | Example |
|------|----------|---------|
| `text` | Names, emails, short text | Username |
| `number` | Ages, quantities | Age: 25 |
| `slider` | Ranges, ratings | Temperature: 0.7 |
| `single-choice` | One option | Payment method |
| `multiple-choice` | Multiple options | Skills |
| `boolean` | Yes/No, On/Off | Enable notifications |

## Key Features

✨ **Dynamic** - Forms adapt based on AI needs  
🎯 **Type-Safe** - Full TypeScript support  
🎨 **Beautiful** - shadcn/ui components  
🤖 **AI-Ready** - Works with Vercel AI SDK  
📦 **Modular** - Use as components or complete form  

## Common Use Cases

### 1. AI Agent Configuration
```tsx
const schema = {
  fields: [
    { id: "model", type: "single-choice", options: [...] },
    { id: "temperature", type: "slider", min: 0, max: 1 },
  ]
};
```

### 2. Dynamic Surveys
```tsx
const schema = {
  fields: [
    { id: "rating", type: "slider", min: 1, max: 10 },
    { id: "feedback", type: "text" },
  ]
};
```

### 3. User Preferences
```tsx
const schema = {
  fields: [
    { id: "theme", type: "single-choice", options: ["light", "dark"] },
    { id: "notifications", type: "boolean" },
  ]
};
```

## Documentation

- 📖 [README.md](./README.md) - Full documentation
- 📚 [USAGE.md](./USAGE.md) - Detailed usage guide
- 🏗️ [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Architecture overview

## Pro Tips

1. **Start Simple**: Begin with 2-3 fields
2. **Use Descriptions**: Help users understand each field
3. **Set Defaults**: Pre-fill common values
4. **Mark Required**: Use `required: true` for mandatory fields
5. **Progressive Disclosure**: Show advanced options only when needed

## Next Steps

- Customize the example in `src/App.tsx`
- Check out `src/examples/` for inspiration
- Read `USAGE.md` for advanced patterns
- Integrate with your AI agent using Vercel AI SDK

Happy building! 🎉
