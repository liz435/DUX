import type { DynamicFormSchema } from "../types/dynamic-ui";

// Example 1: AI Model Configuration
export const aiModelConfigSchema: DynamicFormSchema = {
  title: "AI Model Configuration",
  description: "Configure your AI model parameters",
  fields: [
    {
      id: "model",
      type: "single-choice",
      label: "Model",
      description: "Select the AI model to use",
      required: true,
      options: [
        {
          value: "gpt-4",
          label: "GPT-4",
          description: "Most capable model, best for complex tasks",
        },
        {
          value: "gpt-3.5-turbo",
          label: "GPT-3.5 Turbo",
          description: "Fast and efficient",
        },
        {
          value: "claude-3",
          label: "Claude 3",
          description: "Great for long-form content",
        },
      ],
    },
    {
      id: "temperature",
      type: "slider",
      label: "Temperature",
      description: "Controls randomness (0 = deterministic, 1 = creative)",
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.7,
    },
    {
      id: "maxTokens",
      type: "number",
      label: "Max Tokens",
      description: "Maximum length of the response",
      min: 100,
      max: 4000,
      step: 100,
      defaultValue: 1000,
    },
  ],
};

// Example 2: Survey Form
export const surveySchema: DynamicFormSchema = {
  title: "Customer Feedback Survey",
  description: "Help us improve our service",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Name",
      placeholder: "Your name",
      required: true,
    },
    {
      id: "email",
      type: "text",
      label: "Email",
      placeholder: "your@email.com",
      required: true,
    },
    {
      id: "rating",
      type: "slider",
      label: "Overall Satisfaction",
      description: "Rate your experience from 1 to 10",
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 7,
    },
    {
      id: "preferredContact",
      type: "single-choice",
      label: "Preferred Contact Method",
      options: [
        { value: "email", label: "Email" },
        { value: "phone", label: "Phone" },
        { value: "sms", label: "SMS" },
      ],
      defaultValue: "email",
    },
    {
      id: "interests",
      type: "multiple-choice",
      label: "Areas of Interest",
      options: [
        { value: "ai", label: "Artificial Intelligence" },
        { value: "web", label: "Web Development" },
        { value: "mobile", label: "Mobile Apps" },
        { value: "data", label: "Data Science" },
      ],
    },
    {
      id: "newsletter",
      type: "boolean",
      label: "Subscribe to Newsletter",
      description: "Receive updates and tips",
      defaultValue: true,
    },
  ],
};

// Example 3: E-commerce Product Filters
export const productFilterSchema: DynamicFormSchema = {
  title: "Filter Products",
  description: "Customize your search",
  fields: [
    {
      id: "priceMin",
      type: "number",
      label: "Min Price",
      min: 0,
      placeholder: "0",
    },
    {
      id: "priceMax",
      type: "number",
      label: "Max Price",
      min: 0,
      placeholder: "1000",
    },
    {
      id: "category",
      type: "single-choice",
      label: "Category",
      options: [
        { value: "electronics", label: "Electronics" },
        { value: "clothing", label: "Clothing" },
        { value: "books", label: "Books" },
        { value: "home", label: "Home & Garden" },
      ],
    },
    {
      id: "features",
      type: "multiple-choice",
      label: "Features",
      options: [
        { value: "freeShipping", label: "Free Shipping" },
        { value: "onSale", label: "On Sale" },
        { value: "newArrival", label: "New Arrival" },
        { value: "inStock", label: "In Stock" },
      ],
    },
    {
      id: "primeOnly",
      type: "boolean",
      label: "Prime Members Only",
      defaultValue: false,
    },
  ],
};

// Example 4: User Registration
export const registrationSchema: DynamicFormSchema = {
  title: "Create Account",
  description: "Join our community",
  fields: [
    {
      id: "username",
      type: "text",
      label: "Username",
      placeholder: "Choose a username",
      required: true,
    },
    {
      id: "email",
      type: "text",
      label: "Email",
      placeholder: "your@email.com",
      required: true,
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      min: 13,
      max: 120,
      required: true,
    },
    {
      id: "role",
      type: "single-choice",
      label: "I am a...",
      required: true,
      options: [
        { value: "developer", label: "Developer" },
        { value: "designer", label: "Designer" },
        { value: "manager", label: "Product Manager" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "skills",
      type: "multiple-choice",
      label: "Skills",
      options: [
        { value: "react", label: "React" },
        { value: "typescript", label: "TypeScript" },
        { value: "python", label: "Python" },
        { value: "design", label: "UI/UX Design" },
      ],
    },
    {
      id: "terms",
      type: "boolean",
      label: "Accept Terms & Conditions",
      required: true,
    },
  ],
};

// Example 5: AI Image Generation Settings
export const imageGenerationSchema: DynamicFormSchema = {
  title: "Generate Image",
  description: "Configure your AI-generated image",
  fields: [
    {
      id: "prompt",
      type: "text",
      label: "Prompt",
      placeholder: "Describe the image you want to create",
      required: true,
    },
    {
      id: "style",
      type: "single-choice",
      label: "Art Style",
      required: true,
      options: [
        { value: "realistic", label: "Realistic" },
        { value: "anime", label: "Anime" },
        { value: "cartoon", label: "Cartoon" },
        { value: "abstract", label: "Abstract" },
        { value: "3d", label: "3D Render" },
      ],
    },
    {
      id: "quality",
      type: "slider",
      label: "Quality",
      description: "Higher quality takes longer to generate",
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 7,
    },
    {
      id: "aspectRatio",
      type: "single-choice",
      label: "Aspect Ratio",
      options: [
        { value: "1:1", label: "Square (1:1)" },
        { value: "16:9", label: "Landscape (16:9)" },
        { value: "9:16", label: "Portrait (9:16)" },
        { value: "4:3", label: "Classic (4:3)" },
      ],
      defaultValue: "1:1",
    },
    {
      id: "enhancePrompt",
      type: "boolean",
      label: "Enhance Prompt",
      description: "Let AI improve your prompt automatically",
      defaultValue: true,
    },
  ],
};
