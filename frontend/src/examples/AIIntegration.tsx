import { DynamicUI } from "../components/DynamicUI";
// import { useChat } from "ai/react"; // Install 'ai' package to use: npm install ai
import { useState } from "react";
import type { DynamicFormSchema, FormValues } from "../types/dynamic-ui";

/**
 * Example of integrating DynamicUI with Vercel AI SDK
 * 
 * This shows how an AI agent can dynamically generate forms
 * and process user responses in a conversational flow
 * 
 * NOTE: To use these examples, install the AI SDK:
 * npm install ai @ai-sdk/react
 */

export function AIAgentForm() {
  // Uncomment when you have the 'ai' package installed:
  // const { messages, append, isLoading } = useChat({
  //   api: "/api/chat", // Your AI endpoint
  // });
  
  // Mock data for the example:
  const messages: any[] = [];
  const append = async (_message: any) => {};
  const isLoading = false;

  // Example: AI-generated schema based on conversation context
  const dynamicSchema: DynamicFormSchema = {
    title: "Tell me about yourself",
    description: "The AI agent needs some information",
    fields: [
      {
        id: "experience",
        type: "slider",
        label: "Years of Experience",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 5,
      },
      {
        id: "skills",
        type: "multiple-choice",
        label: "Your Skills",
        options: [
          { value: "react", label: "React" },
          { value: "typescript", label: "TypeScript" },
          { value: "python", label: "Python" },
          { value: "ai", label: "AI/ML" },
        ],
      },
      {
        id: "availability",
        type: "single-choice",
        label: "Availability",
        required: true,
        options: [
          { value: "fulltime", label: "Full-time" },
          { value: "parttime", label: "Part-time" },
          { value: "contract", label: "Contract" },
        ],
      },
    ],
  };

  const handleSubmit = async (values: FormValues) => {
    // Send the form data to the AI agent
    await append({
      role: "user",
      content: JSON.stringify(values),
    });
  };

  return (
    <div className="space-y-4">
      {/* Chat messages */}
      <div className="space-y-2">
        {messages.map((message: any) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.role === "user" ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <p className="font-bold">{message.role === "user" ? "You" : "AI"}</p>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      {/* Dynamic form */}
      <DynamicUI
        schema={dynamicSchema}
        onSubmit={handleSubmit}
        submitLabel={isLoading ? "Sending..." : "Send to AI"}
      />
    </div>
  );
}

/**
 * Example: AI agent that dynamically changes form based on previous answers
 */
export function AdaptiveAIForm() {
  const [currentSchema, setCurrentSchema] = useState<DynamicFormSchema>({
    title: "Getting Started",
    fields: [
      {
        id: "userType",
        type: "single-choice",
        label: "I am a...",
        required: true,
        options: [
          { value: "developer", label: "Developer" },
          { value: "designer", label: "Designer" },
          { value: "manager", label: "Manager" },
        ],
      },
    ],
  });

  const handleSubmit = async (values: FormValues) => {
    // Based on response, AI generates next set of questions
    if (values.userType === "developer") {
      setCurrentSchema({
        title: "Developer Details",
        fields: [
          {
            id: "languages",
            type: "multiple-choice",
            label: "Programming Languages",
            options: [
              { value: "js", label: "JavaScript" },
              { value: "python", label: "Python" },
              { value: "go", label: "Go" },
              { value: "rust", label: "Rust" },
            ],
          },
          {
            id: "experience",
            type: "slider",
            label: "Years of Experience",
            min: 0,
            max: 30,
            defaultValue: 5,
          },
        ],
      });
    } else if (values.userType === "designer") {
      setCurrentSchema({
        title: "Designer Details",
        fields: [
          {
            id: "tools",
            type: "multiple-choice",
            label: "Design Tools",
            options: [
              { value: "figma", label: "Figma" },
              { value: "sketch", label: "Sketch" },
              { value: "adobe", label: "Adobe XD" },
            ],
          },
          {
            id: "specialty",
            type: "single-choice",
            label: "Specialty",
            options: [
              { value: "ui", label: "UI Design" },
              { value: "ux", label: "UX Research" },
              { value: "both", label: "Both" },
            ],
          },
        ],
      });
    }

    // Send to AI for processing
    console.log("User submitted:", values);
  };

  return (
    <DynamicUI
      schema={currentSchema}
      onSubmit={handleSubmit}
      submitLabel="Continue"
    />
  );
}

/**
 * Example: Using with AI tool calls
 * The AI can request specific information through structured forms
 */
export function AIToolCallForm({
  toolCall,
  onComplete,
}: {
  toolCall: {
    name: string;
    parameters: DynamicFormSchema;
  };
  onComplete: (result: FormValues) => void;
}) {
  return (
    <div className="border rounded-lg p-4 bg-amber-50">
      <p className="text-sm text-muted-foreground mb-4">
        🤖 The AI needs additional information to continue:
      </p>
      <DynamicUI
        schema={toolCall.parameters}
        onSubmit={onComplete}
        submitLabel="Provide Information"
      />
    </div>
  );
}
