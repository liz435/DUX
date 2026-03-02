import { DynamicUI } from "./components/DynamicUI";
import type { DynamicFormSchema, FormValues } from "./types/dynamic-ui";
import { useState } from "react";

// Define schema outside component to prevent recreation on every render
const aiAgentSchema: DynamicFormSchema = {
  title: "AI Agent Configuration",
  description: "Configure your AI agent's behavior and parameters",
  fields: [
    {
      id: "agentName",
      type: "text",
      label: "Agent Name",
      placeholder: "Enter agent name",
      description: "Give your AI agent a unique name",
      required: true,
    },
    {
      id: "temperature",
      type: "slider",
      label: "Temperature",
      description: "Controls randomness in responses (0 = focused, 1 = creative)",
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 0.7,
    },
    {
      id: "maxTokens",
      type: "number",
      label: "Max Tokens",
      description: "Maximum number of tokens to generate",
      min: 50,
      max: 4000,
      step: 50,
      defaultValue: 1000,
      required: true,
    },
    {
      id: "model",
      type: "single-choice",
      label: "AI Model",
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
          description: "Fast and efficient for most tasks",
        },
        {
          value: "claude-3",
          label: "Claude 3",
          description: "Great for long-form content",
        },
      ],
    },
    {
      id: "features",
      type: "multiple-choice",
      label: "Enabled Features",
      description: "Select features to enable for this agent",
      options: [
        {
          value: "web-search",
          label: "Web Search",
          description: "Allow agent to search the web for information",
        },
        {
          value: "code-execution",
          label: "Code Execution",
          description: "Allow agent to execute code snippets",
        },
        {
          value: "file-access",
          label: "File Access",
          description: "Allow agent to read and write files",
        },
        {
          value: "memory",
          label: "Long-term Memory",
          description: "Enable conversation memory across sessions",
        },
      ],
      defaultValue: ["memory"],
    },
    {
      id: "streaming",
      type: "boolean",
      label: "Enable Streaming",
      description: "Stream responses in real-time",
      defaultValue: true,
    },
    {
      id: "systemPrompt",
      type: "text",
      label: "System Prompt",
      placeholder: "You are a helpful assistant...",
      description: "Define the agent's behavior and personality",
    },
  ],
};

function App() {
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);

  const handleSubmit = (values: FormValues) => {
    console.log("Form submitted:", values);
    setSubmittedData(values);
    // Here you would typically send this to your AI agent / API
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">AI Dynamic UI</h1>
          <p className="text-muted-foreground">
            A flexible UI system that adapts to AI agent needs
          </p>
        </div>

        <DynamicUI
          schema={aiAgentSchema}
          onSubmit={handleSubmit}
          submitLabel="Configure Agent"
        />

        {submittedData && (
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-3">Submitted Data:</h3>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
