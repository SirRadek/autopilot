export type ModelPolicyLayer =
  | "orchestrator"
  | "architect"
  | "reviewer"
  | "tester"
  | "micro_worker"
  | "bounded_coding"
  | "memory_summarizer"
  | "copywriter";

export interface ModelPolicyRule {
  layer: ModelPolicyLayer;
  preferredCapability: string;
  allowedUse: string;
  forbiddenUse: string;
}

export const modelPolicyRules = [
  {
    layer: "orchestrator",
    preferredCapability: "strong reasoning",
    allowedUse: "dependency planning and routing",
    forbiddenUse: "self-approval or governance bypass"
  },
  {
    layer: "architect",
    preferredCapability: "strong architecture reasoning",
    allowedUse: "system design and boundary review",
    forbiddenUse: "silent architecture changes"
  },
  {
    layer: "reviewer",
    preferredCapability: "independent critique",
    allowedUse: "quality, security, architecture, and UX review",
    forbiddenUse: "approving own implementation"
  },
  {
    layer: "tester",
    preferredCapability: "verification reasoning",
    allowedUse: "test strategy, regression checks, and failure summaries",
    forbiddenUse: "changing business scope"
  },
  {
    layer: "micro_worker",
    preferredCapability: "bounded code generation",
    allowedUse: "small isolated tasks such as tests, DTOs, utilities, and focused bugfixes",
    forbiddenUse: "architecture, governance, or business decisions"
  },
  {
    layer: "bounded_coding",
    preferredCapability: "focused implementation",
    allowedUse: "bounded implementation with explicit ownership",
    forbiddenUse: "unbounded autonomous execution"
  },
  {
    layer: "memory_summarizer",
    preferredCapability: "low-cost summarization",
    allowedUse: "summaries, lessons, and run memory compaction",
    forbiddenUse: "final approval"
  },
  {
    layer: "copywriter",
    preferredCapability: "language quality",
    allowedUse: "UX copy, documentation wording, and localization review",
    forbiddenUse: "scope or architecture approval"
  }
] as const satisfies readonly ModelPolicyRule[];
