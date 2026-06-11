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

export interface ReasoningEscalationPolicy {
  defaultWorkerLayer: "local_swarm";
  strategicLayer: "frontier_reasoning";
  localDefaultUse: readonly string[];
  freeCloudAdvisoryUse: readonly string[];
  docsVerificationProviders: readonly string[];
  frontierEscalationUse: readonly string[];
  frontierForbiddenUse: readonly string[];
  requiredChecks: readonly string[];
  stopConditions: readonly string[];
}

export interface CredentialedAdvisoryProviderPolicy {
  readonly id: string;
  readonly provider: string;
  readonly tool: string;
  readonly registration: "optional";
  readonly allowedUse: readonly string[];
  readonly forbiddenUse: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
  readonly sourceDocs: readonly string[];
}

export interface ReasoningModelRouteInput {
  readonly task: string;
}

export interface ReasoningModelRouteResult {
  readonly route: "local_worker_default" | "free_cloud_advisory_review";
  readonly advisoryProviders: readonly string[];
  readonly docsVerificationProviders: readonly string[];
  readonly allowedUse: readonly string[];
  readonly forbiddenUse: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
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

export const reasoningEscalationPolicy = {
  defaultWorkerLayer: "local_swarm",
  strategicLayer: "frontier_reasoning",
  localDefaultUse: [
    "boilerplate coding",
    "bounded worker tasks",
    "autocomplete",
    "embeddings",
    "RAG retrieval",
    "indexing",
    "automation loops",
    "routine summarization"
  ],
  freeCloudAdvisoryUse: [
    "brainstorming",
    "architecture second opinion",
    "design critique",
    "security critique",
    "planning critique",
    "agent validation",
    "edge-case review",
    "research synthesis"
  ],
  docsVerificationProviders: [
    "context7_when_available",
    "official_docs_fallback",
    "local_files",
    "tests",
    "controlled_browser_evidence"
  ],
  frontierEscalationUse: [
    "deep research",
    "architecture review",
    "security audit",
    "code review",
    "agent validation",
    "strategic planning",
    "orchestration design",
    "edge-case reasoning",
    "cross-domain tradeoff analysis"
  ],
  frontierForbiddenUse: [
    "autocomplete",
    "boilerplate coding",
    "embeddings",
    "routine summarization",
    "simple tasks",
    "local automation loops",
    "unreviewed worker execution"
  ],
  requiredChecks: [
    "provider_availability_verified",
    "free_tier_or_no_cost_confirmed",
    "redacted_context_only",
    "context7_or_official_docs_verified",
    "gemini_brainstorm_claims_labeled_and_verified",
    "factual_claims_verified",
    "smallest_safe_model_class",
    "disclose_model_choice_when_risk_affects_delivery"
  ],
  stopConditions: [
    "non_local_worker_dependency",
    "cloud_model_for_routine_worker_loop",
    "frontier_used_for_simple_worker_task",
    "provider_availability_unverified",
    "paid_model_or_credit_required",
    "private_data_not_redacted",
    "model_output_used_as_source_of_truth",
    "technology_claim_without_context7_or_official_docs",
    "gemini_claim_adopted_without_verification"
  ]
} as const satisfies ReasoningEscalationPolicy;

export const credentialedAdvisoryProviderPolicies = [
  {
    id: "claude_code",
    provider: "anthropic",
    tool: "claude",
    registration: "optional",
    allowedUse: [
      "architecture second opinion",
      "security critique",
      "planning critique",
      "agent validation",
      "edge-case review",
      "bounded repo session after owner scope"
    ],
    forbiddenUse: [
      "default routine worker",
      "local automation loops",
      "final approval",
      "governance approval",
      "unredacted private context",
      "unbounded autonomous execution",
      "remote mutation without explicit approval"
    ],
    requiredChecks: [
      "provider_availability_verified",
      "authentication_state_verified_without_token_disclosure",
      "owner_cost_decision_for_credentialed_provider",
      "redacted_context_only",
      "official_provider_docs_verified",
      "bounded_scope_declared",
      "local_verification_required",
      "disclose_model_choice_when_risk_affects_delivery"
    ],
    stopConditions: [
      "provider_availability_unverified",
      "authentication_missing",
      "paid_model_or_credit_required_without_owner_decision",
      "private_data_not_redacted",
      "model_output_used_as_source_of_truth",
      "cloud_model_for_routine_worker_loop",
      "remote_mutation_without_approval"
    ],
    sourceDocs: [
      "https://code.claude.com/docs/en/setup",
      "https://code.claude.com/docs/en/iam",
      "https://code.claude.com/docs/en/memory"
    ]
  }
] as const satisfies readonly CredentialedAdvisoryProviderPolicy[];

export function selectReasoningModelRoute(input: ReasoningModelRouteInput): ReasoningModelRouteResult {
  const normalizedTask = normalize(input.task);
  const isRoutine = hasAny(normalizedTask, [
    "autocomplete",
    "boilerplate",
    "dto",
    "embeddings",
    "indexing",
    "automation loop",
    "routine summarization",
    "simple task"
  ]);
  const benefitsFromAdvisory = hasAny(normalizedTask, [
    "brainstorm",
    "critique",
    "review",
    "architecture",
    "security",
    "audit",
    "planning",
    "edge case",
    "research",
    "reasoning",
    "validation"
  ]);

  if (benefitsFromAdvisory && !isRoutine) {
    return {
      route: "free_cloud_advisory_review",
      advisoryProviders: ["gemini_cli", "provider_neutral_free_cloud_model", "local_llm_when_available"],
      docsVerificationProviders: reasoningEscalationPolicy.docsVerificationProviders,
      allowedUse: reasoningEscalationPolicy.freeCloudAdvisoryUse,
      forbiddenUse: reasoningEscalationPolicy.frontierForbiddenUse,
      requiredChecks: reasoningEscalationPolicy.requiredChecks,
      stopConditions: reasoningEscalationPolicy.stopConditions
    };
  }

  return {
    route: "local_worker_default",
    advisoryProviders: ["local_worker", "local_llm_when_available"],
    docsVerificationProviders: reasoningEscalationPolicy.docsVerificationProviders,
    allowedUse: reasoningEscalationPolicy.localDefaultUse,
    forbiddenUse: [
      "architecture decisions",
      "business decisions",
      "governance approval",
      "security approval",
      "unbounded autonomous execution",
      "final delivery approval"
    ],
    requiredChecks: [
      "local_worker_default",
      "smallest_safe_model_class",
      "disclose_model_choice_when_risk_affects_delivery"
    ],
    stopConditions: [
      "cloud_model_for_routine_worker_loop",
      "frontier_used_for_simple_worker_task",
      "model_output_used_as_source_of_truth"
    ]
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]/g, " ");
}

function hasAny(normalizedTask: string, terms: readonly string[]): boolean {
  return terms.some((term) => normalizedTask.includes(normalize(term)));
}
