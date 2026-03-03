export interface HierarchyNode {
  id: string
  label: string
  type: "root" | "category" | "topic" | "item" | "insight"
  summary?: string
  aiInsight?: string
  tags?: string[]
  confidence?: number
  children?: HierarchyNode[]
  metadata?: {
    source?: string
    lastUpdated?: string
    relevance?: number
  }
}

export const hierarchyData: HierarchyNode = {
  id: "root",
  label: "Knowledge Base",
  type: "root",
  summary: "A structured overview of your organization's knowledge graph, organized by AI into semantic clusters.",
  aiInsight: "3 high-priority topics detected across 12 active categories. Recommendation: Review Infrastructure items flagged for attention.",
  tags: ["Enterprise", "Active"],
  children: [
    {
      id: "engineering",
      label: "Engineering",
      type: "category",
      summary: "Core engineering practices, architecture decisions, and technical infrastructure.",
      aiInsight: "Code complexity has increased 18% this quarter. Consider scheduling a refactoring sprint.",
      tags: ["Core", "High Activity"],
      confidence: 0.94,
      children: [
        {
          id: "architecture",
          label: "System Architecture",
          type: "topic",
          summary: "Microservices topology and service mesh configurations.",
          aiInsight: "Latency between Payment and Auth services spiked. Potential circular dependency detected.",
          tags: ["Critical"],
          confidence: 0.89,
          metadata: { source: "Architecture Review Board", lastUpdated: "2 hours ago", relevance: 0.95 },
          children: [
            {
              id: "microservices",
              label: "Microservices",
              type: "item",
              summary: "42 active services across 3 clusters. Service mesh managed by Istio.",
              confidence: 0.92,
              metadata: { source: "Kubernetes Dashboard", lastUpdated: "15 min ago", relevance: 0.88 },
            },
            {
              id: "api-gateway",
              label: "API Gateway",
              type: "item",
              summary: "Kong-based gateway handling 2.4M requests/day. Rate limiting active.",
              confidence: 0.97,
              metadata: { source: "API Monitoring", lastUpdated: "5 min ago", relevance: 0.91 },
            },
            {
              id: "data-layer",
              label: "Data Layer",
              type: "item",
              summary: "PostgreSQL primary with Redis caching. Read replicas in 3 regions.",
              aiInsight: "Cache hit ratio dropped to 78%. Consider reviewing cache invalidation strategy.",
              tags: ["Attention"],
              confidence: 0.85,
              metadata: { source: "Database Metrics", lastUpdated: "30 min ago", relevance: 0.93 },
            },
          ],
        },
        {
          id: "devops",
          label: "DevOps & CI/CD",
          type: "topic",
          summary: "Deployment pipelines, monitoring, and infrastructure automation.",
          tags: ["Stable"],
          confidence: 0.96,
          metadata: { source: "DevOps Team", lastUpdated: "1 hour ago", relevance: 0.82 },
          children: [
            {
              id: "pipelines",
              label: "Build Pipelines",
              type: "item",
              summary: "Average build time: 4m 23s. 98.7% success rate over last 30 days.",
              confidence: 0.98,
              metadata: { source: "GitHub Actions", lastUpdated: "10 min ago", relevance: 0.75 },
            },
            {
              id: "monitoring",
              label: "Observability Stack",
              type: "item",
              summary: "Grafana + Prometheus for metrics. Sentry for error tracking. 99.97% uptime.",
              confidence: 0.95,
              metadata: { source: "SRE Dashboard", lastUpdated: "Real-time", relevance: 0.88 },
            },
          ],
        },
        {
          id: "frontend",
          label: "Frontend Systems",
          type: "topic",
          summary: "Client-side architecture, design system, and performance optimization.",
          confidence: 0.91,
          metadata: { source: "Frontend Guild", lastUpdated: "3 hours ago", relevance: 0.79 },
          children: [
            {
              id: "design-system",
              label: "Design System",
              type: "item",
              summary: "127 components published. 94% adoption rate across products.",
              confidence: 0.93,
              metadata: { source: "Storybook", lastUpdated: "Yesterday", relevance: 0.72 },
            },
            {
              id: "performance",
              label: "Web Performance",
              type: "item",
              summary: "Core Web Vitals: LCP 1.8s, FID 45ms, CLS 0.05. All green.",
              aiInsight: "LCP trending upward. Bundle size increased 12% since last deploy.",
              tags: ["Watch"],
              confidence: 0.88,
              metadata: { source: "Lighthouse CI", lastUpdated: "1 hour ago", relevance: 0.85 },
            },
          ],
        },
      ],
    },
    {
      id: "product",
      label: "Product Strategy",
      type: "category",
      summary: "Product roadmap, feature planning, and user research insights.",
      aiInsight: "User engagement metrics suggest Feature X should be prioritized for Q3.",
      tags: ["Strategic"],
      confidence: 0.87,
      children: [
        {
          id: "roadmap",
          label: "Roadmap Q3 2026",
          type: "topic",
          summary: "12 features planned. 4 in development, 3 in design review.",
          tags: ["Active"],
          confidence: 0.82,
          metadata: { source: "Product Board", lastUpdated: "Today", relevance: 0.91 },
          children: [
            {
              id: "feature-x",
              label: "Collaborative Editing",
              type: "item",
              summary: "Real-time document collaboration. CRDT-based. Target: 50K concurrent users.",
              aiInsight: "Market analysis shows 3 competitors launched similar features. Speed to market is critical.",
              tags: ["Priority"],
              confidence: 0.79,
              metadata: { source: "Product Brief", lastUpdated: "Yesterday", relevance: 0.95 },
            },
            {
              id: "feature-y",
              label: "AI Assistant v2",
              type: "item",
              summary: "Context-aware AI with memory. RAG pipeline integration.",
              confidence: 0.91,
              metadata: { source: "AI Team", lastUpdated: "3 days ago", relevance: 0.88 },
            },
          ],
        },
        {
          id: "research",
          label: "User Research",
          type: "topic",
          summary: "Qualitative and quantitative research findings from 340 user interviews.",
          confidence: 0.84,
          metadata: { source: "Research Team", lastUpdated: "1 week ago", relevance: 0.76 },
          children: [
            {
              id: "personas",
              label: "User Personas",
              type: "item",
              summary: "5 primary personas identified. Developer and Designer segments show highest growth.",
              confidence: 0.86,
              metadata: { source: "UX Research", lastUpdated: "2 weeks ago", relevance: 0.7 },
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      type: "category",
      summary: "Team structure, processes, and operational metrics.",
      tags: ["Internal"],
      confidence: 0.9,
      children: [
        {
          id: "team",
          label: "Team Health",
          type: "topic",
          summary: "48 engineers across 8 squads. Average tenure: 2.3 years.",
          aiInsight: "Team velocity in Squad Alpha has decreased 15%. May correlate with recent reorganization.",
          tags: ["Monitor"],
          confidence: 0.83,
          metadata: { source: "People Ops", lastUpdated: "This week", relevance: 0.68 },
          children: [
            {
              id: "hiring",
              label: "Hiring Pipeline",
              type: "item",
              summary: "12 open roles. Average time-to-hire: 34 days. Offer acceptance rate: 82%.",
              confidence: 0.91,
              metadata: { source: "Greenhouse", lastUpdated: "Today", relevance: 0.65 },
            },
            {
              id: "onboarding",
              label: "Onboarding Program",
              type: "item",
              summary: "30-60-90 day program. 4.6/5.0 satisfaction score from recent cohort.",
              confidence: 0.94,
              metadata: { source: "HR Dashboard", lastUpdated: "Last month", relevance: 0.58 },
            },
          ],
        },
        {
          id: "security",
          label: "Security & Compliance",
          type: "topic",
          summary: "SOC 2 Type II compliant. Zero critical vulnerabilities in last audit.",
          tags: ["Compliant"],
          confidence: 0.97,
          metadata: { source: "Security Team", lastUpdated: "Last audit: 2 weeks ago", relevance: 0.92 },
          children: [
            {
              id: "vulnerabilities",
              label: "Vulnerability Management",
              type: "item",
              summary: "0 critical, 3 medium, 12 low severity findings. All within SLA.",
              confidence: 0.96,
              metadata: { source: "Snyk", lastUpdated: "Real-time", relevance: 0.9 },
            },
          ],
        },
      ],
    },
  ],
}
