export type ModelPolicyLayer =
  | "orchestrator"
  | "architect"
  | "reviewer"
  | "tester"
  | "micro_worker"
  | "bounded_coding"
  | "memory_summarizer"
  | "copywriter";

export type ReasoningProviderId =
  | "deterministic_tools"
  | "qwen_local"
  | "openai_gpt"
  | "anthropic_claude_subscription"
  | "gemini_cli"
  | "deepseek_api_or_self_hosted";

export type ReasoningTaskLaneId =
  | "deterministic_verification"
  | "local_routine_worker"
  | "bounded_coding_worker"
  | "structured_tool_reasoning"
  | "long_context_synthesis"
  | "multimodal_design_review"
  | "architecture_security_review"
  | "agent_validation"
  | "sensitive_private_context";

export type ReasoningAccessMode =
  | "deterministic"
  | "local"
  | "session_cli"
  | "subscription_cli"
  | "subscription_interactive"
  | "api_or_self_hosted";

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

export interface ReasoningProviderPolicy {
  readonly id: ReasoningProviderId;
  readonly provider: string;
  readonly accessMode: ReasoningAccessMode;
  readonly bestFor: readonly string[];
  readonly avoidFor: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
  readonly sourceIds: readonly string[];
}

export interface ReasoningTaskLanePolicy {
  readonly id: ReasoningTaskLaneId;
  readonly taskSignals: readonly string[];
  readonly preferredProviders: readonly ReasoningProviderId[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
}

export interface CredentialedAdvisoryProviderPolicy {
  readonly id: string;
  readonly provider: string;
  readonly tool: string;
  readonly accessMode: "subscription_interactive";
  readonly registration: "optional";
  readonly costGuard: string;
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
  readonly route: "local_worker_default" | "free_cloud_advisory_review" | "external_advisory_review";
  readonly taskLanes: readonly ReasoningTaskLaneId[];
  readonly providerPolicies: readonly ReasoningProviderId[];
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
    "subscription_entitlement_confirmed_for_subscription_tools",
    "google_ai_subscription_entitlement_confirmed_for_gemini_cli",
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
    "subscription_entitlement_unverified",
    "google_ai_subscription_entitlement_unverified",
    "api_credit_path_requested_without_owner_decision",
    "gemini_api_key_or_paid_api_path_requested_without_owner_decision",
    "private_data_not_redacted",
    "model_output_used_as_source_of_truth",
    "technology_claim_without_context7_or_official_docs",
    "gemini_claim_adopted_without_verification"
  ]
} as const satisfies ReasoningEscalationPolicy;

export const reasoningProviderPolicies = [
  {
    id: "deterministic_tools",
    provider: "local",
    accessMode: "deterministic",
    bestFor: ["repository search", "tests", "typecheck", "schema validation", "diff checks"],
    avoidFor: ["semantic architecture judgment", "ambiguous business decisions"],
    requiredChecks: ["local_command_scope_known", "no_secret_exfiltration", "results_recorded"],
    stopConditions: ["destructive_command_without_owner_approval", "unknown_workspace_boundary"],
    sourceIds: ["local-agents-md", "decision-mesh-policy"]
  },
  {
    id: "qwen_local",
    provider: "qwen",
    accessMode: "local",
    bestFor: ["small file-local code drafts", "routine test drafts", "handoff summaries", "bounded refactor drafts"],
    avoidFor: ["architecture approval", "security approval", "business decisions", "final delivery approval"],
    requiredChecks: ["local_runtime_available", "bounded_file_scope", "independent_review", "test_evidence"],
    stopConditions: ["local_model_unavailable", "private_secret_in_prompt", "broad_ambiguous_scope"],
    sourceIds: ["qwen-chat-template", "qwen-function-calling", "qwen2-5-7b-model-card", "qwen2-5-coder-14b-model-card"]
  },
  {
    id: "openai_gpt",
    provider: "openai",
    accessMode: "api_or_self_hosted",
    bestFor: ["structured outputs", "tool orchestration", "deep reasoning review", "Codex coding supervision"],
    avoidFor: ["unredacted private context without approval", "routine boilerplate loops", "unchecked pricing assumptions"],
    requiredChecks: [
      "provider_availability_verified",
      "cost_or_entitlement_confirmed",
      "redacted_context_only",
      "official_provider_docs_verified",
      "local_verification_required"
    ],
    stopConditions: [
      "provider_availability_unverified",
      "paid_model_or_credit_required_without_owner_decision",
      "private_data_not_redacted",
      "model_output_used_as_source_of_truth"
    ],
    sourceIds: ["openai-reasoning-best-practices", "openai-structured-outputs", "openai-prompt-engineering"]
  },
  {
    id: "anthropic_claude_subscription",
    provider: "anthropic",
    accessMode: "subscription_interactive",
    bestFor: ["architecture second opinion", "security critique", "planning critique", "agent validation", "edge-case review"],
    avoidFor: ["API-credit execution without owner decision", "default routine worker", "local automation loops"],
    requiredChecks: [
      "provider_availability_verified",
      "subscription_entitlement_confirmed",
      "authentication_state_verified_without_token_disclosure",
      "redacted_context_only",
      "official_provider_docs_verified",
      "bounded_scope_declared",
      "local_verification_required"
    ],
    stopConditions: [
      "provider_availability_unverified",
      "subscription_entitlement_unverified",
      "api_credit_path_requested_without_owner_decision",
      "private_data_not_redacted",
      "model_output_used_as_source_of_truth",
      "remote_mutation_without_approval"
    ],
    sourceIds: [
      "anthropic-claude-code-setup",
      "anthropic-claude-code-authentication",
      "anthropic-claude-code-memory",
      "anthropic-tool-use",
      "anthropic-context-windows"
    ]
  },
  {
    id: "gemini_cli",
    provider: "google",
    accessMode: "subscription_cli",
    bestFor: ["long-context brainstorming", "multimodal critique", "architecture alternatives", "edge-case ideation"],
    avoidFor: [
      "source-of-truth claims",
      "unredacted private context",
      "Gemini API key or paid API path without owner decision",
      "free-tier assumption for owner subscription usage"
    ],
    requiredChecks: [
      "provider_availability_verified",
      "google_ai_subscription_entitlement_confirmed_for_gemini_cli",
      "authentication_state_verified_without_token_disclosure",
      "redacted_context_only",
      "gemini_brainstorm_claims_labeled_and_verified",
      "context7_or_official_docs_verified",
      "local_verification_required"
    ],
    stopConditions: [
      "provider_availability_unverified",
      "google_ai_subscription_entitlement_unverified",
      "gemini_api_key_or_paid_api_path_requested_without_owner_decision",
      "private_data_not_redacted",
      "gemini_claim_adopted_without_verification"
    ],
    sourceIds: [
      "gemini-code-assist-quotas",
      "gemini-subscriptions",
      "gemini-models",
      "gemini-long-context",
      "gemini-multimodal-prompt-design",
      "gemini-prompt-design-strategies"
    ]
  },
  {
    id: "deepseek_api_or_self_hosted",
    provider: "deepseek",
    accessMode: "api_or_self_hosted",
    bestFor: ["cost-aware coding critique", "JSON output", "reasoning-model comparison", "function calling when supported"],
    avoidFor: ["routine local loops", "tool-calling assumptions on unsupported reasoning models", "unverified hosted cost"],
    requiredChecks: [
      "provider_availability_verified",
      "cost_or_self_hosting_confirmed",
      "redacted_context_only",
      "official_provider_docs_verified",
      "local_verification_required"
    ],
    stopConditions: [
      "provider_availability_unverified",
      "paid_model_or_credit_required_without_owner_decision",
      "private_data_not_redacted",
      "unsupported_tool_mode_assumed",
      "model_output_used_as_source_of_truth"
    ],
    sourceIds: ["deepseek-reasoning-model", "deepseek-json-output", "deepseek-function-calling"]
  }
] as const satisfies readonly ReasoningProviderPolicy[];

export const reasoningTaskLanePolicies = [
  {
    id: "deterministic_verification",
    taskSignals: ["test", "typecheck", "schema", "diff check", "audit", "build"],
    preferredProviders: ["deterministic_tools"],
    requiredChecks: ["local_command_scope_known", "results_recorded"],
    stopConditions: ["destructive_command_without_owner_approval"]
  },
  {
    id: "local_routine_worker",
    taskSignals: ["boilerplate", "dto", "small patch", "routine summarization", "indexing"],
    preferredProviders: ["deterministic_tools", "qwen_local"],
    requiredChecks: ["local_worker_default", "bounded_file_scope", "independent_review"],
    stopConditions: ["cloud_model_for_routine_worker_loop", "frontier_used_for_simple_worker_task"]
  },
  {
    id: "bounded_coding_worker",
    taskSignals: ["bounded implementation", "focused bugfix", "refactor", "test generation"],
    preferredProviders: ["qwen_local", "deterministic_tools"],
    requiredChecks: ["bounded_file_scope", "test_evidence", "supervisor_reviews_diff_or_claims"],
    stopConditions: ["broad_ambiguous_scope", "model_output_used_as_source_of_truth"]
  },
  {
    id: "structured_tool_reasoning",
    taskSignals: ["structured output", "json", "tool use", "function calling", "mcp schema"],
    preferredProviders: ["openai_gpt", "deepseek_api_or_self_hosted", "deterministic_tools"],
    requiredChecks: ["official_provider_docs_verified", "schema_validation_required", "local_verification_required"],
    stopConditions: ["unsupported_tool_mode_assumed", "technology_claim_without_context7_or_official_docs"]
  },
  {
    id: "long_context_synthesis",
    taskSignals: ["long context", "large document", "research synthesis", "broad planning"],
    preferredProviders: ["gemini_cli", "anthropic_claude_subscription", "openai_gpt"],
    requiredChecks: ["redacted_context_only", "context7_or_official_docs_verified", "factual_claims_verified"],
    stopConditions: ["private_data_not_redacted", "model_output_used_as_source_of_truth"]
  },
  {
    id: "multimodal_design_review",
    taskSignals: ["multimodal", "screenshot", "visual", "ux critique", "design critique"],
    preferredProviders: ["gemini_cli", "anthropic_claude_subscription", "openai_gpt"],
    requiredChecks: ["redacted_context_only", "accessibility_claims_verified", "local_visual_evidence_required"],
    stopConditions: ["private_data_not_redacted", "visual_claim_without_evidence"]
  },
  {
    id: "architecture_security_review",
    taskSignals: ["architecture", "security", "audit", "threat", "privacy", "edge case"],
    preferredProviders: ["openai_gpt", "anthropic_claude_subscription", "gemini_cli", "deepseek_api_or_self_hosted"],
    requiredChecks: ["redacted_context_only", "independent_review", "factual_claims_verified", "local_verification_required"],
    stopConditions: ["model_output_used_as_source_of_truth", "private_data_not_redacted"]
  },
  {
    id: "agent_validation",
    taskSignals: ["agent validation", "supervisor", "handoff", "routing", "orchestration"],
    preferredProviders: ["openai_gpt", "anthropic_claude_subscription", "gemini_cli", "qwen_local"],
    requiredChecks: ["handoff_packet_normalized", "forbidden_actions_declared", "local_verification_required"],
    stopConditions: ["raw_agent_output_chained_as_prompt", "model_output_used_as_source_of_truth"]
  },
  {
    id: "sensitive_private_context",
    taskSignals: ["secret", "credential", "customer data", "private repo", "sensitive"],
    preferredProviders: ["deterministic_tools", "qwen_local"],
    requiredChecks: ["local_only_by_default", "secret_redaction_verified", "owner_exception_required_for_cloud"],
    stopConditions: ["private_data_not_redacted", "cloud_model_for_sensitive_context_without_owner_exception"]
  }
] as const satisfies readonly ReasoningTaskLanePolicy[];

export const credentialedAdvisoryProviderPolicies = [
  {
    id: "claude_code",
    provider: "anthropic",
    tool: "claude",
    accessMode: "subscription_interactive",
    registration: "optional",
    costGuard: "uses_owner_subscription_entitlement_not_api_credit",
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
      "subscription_entitlement_confirmed",
      "no_api_budget_or_credit_claim",
      "redacted_context_only",
      "official_provider_docs_verified",
      "bounded_scope_declared",
      "local_verification_required",
      "disclose_model_choice_when_risk_affects_delivery"
    ],
    stopConditions: [
      "provider_availability_unverified",
      "authentication_missing",
      "subscription_entitlement_unverified",
      "api_credit_path_requested_without_owner_decision",
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
    const taskLanes = selectTaskLanes(normalizedTask);
    const providerPolicies = selectProviderPolicies(taskLanes);
    return {
      route: "external_advisory_review",
      taskLanes,
      providerPolicies,
      advisoryProviders: selectAdvisoryProviders(normalizedTask, providerPolicies),
      docsVerificationProviders: reasoningEscalationPolicy.docsVerificationProviders,
      allowedUse: reasoningEscalationPolicy.freeCloudAdvisoryUse,
      forbiddenUse: reasoningEscalationPolicy.frontierForbiddenUse,
      requiredChecks: unique([
        ...reasoningEscalationPolicy.requiredChecks,
        ...requiredChecksForProviders(providerPolicies),
        ...requiredChecksForTaskLanes(taskLanes)
      ]),
      stopConditions: unique([
        ...reasoningEscalationPolicy.stopConditions,
        ...stopConditionsForProviders(providerPolicies),
        ...stopConditionsForTaskLanes(taskLanes)
      ])
    };
  }

  return {
    route: "local_worker_default",
    taskLanes: ["local_routine_worker"],
    providerPolicies: ["deterministic_tools", "qwen_local"],
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

function selectTaskLanes(normalizedTask: string): ReasoningTaskLaneId[] {
  const matches = reasoningTaskLanePolicies
    .filter((lane) => hasAny(normalizedTask, lane.taskSignals))
    .map((lane) => lane.id);

  return matches.length > 0 ? unique(matches) : ["architecture_security_review"];
}

function selectProviderPolicies(taskLanes: readonly ReasoningTaskLaneId[]): ReasoningProviderId[] {
  return unique(
    taskLanes.flatMap((laneId) => {
      const lane = reasoningTaskLanePolicies.find((candidate) => candidate.id === laneId);
      return lane ? [...lane.preferredProviders] : [];
    })
  );
}

function selectAdvisoryProviders(
  normalizedTask: string,
  providerPolicies: readonly ReasoningProviderId[]
): readonly string[] {
  const providers = providerPolicies.filter((provider) => {
    if (provider === "anthropic_claude_subscription") {
      return hasAny(normalizedTask, ["claude", "anthropic", "subscription"]);
    }

    if (provider === "openai_gpt") {
      return hasAny(normalizedTask, ["openai", "gpt", "structured output", "function calling", "tool use"]);
    }

    if (provider === "deepseek_api_or_self_hosted") {
      return hasAny(normalizedTask, ["deepseek", "json", "function calling", "cost aware"]);
    }

    return provider === "gemini_cli" || provider === "qwen_local" || provider === "deterministic_tools";
  });

  const normalizedProviders = providers.length > 0 ? providers : providerPolicies;
  const advisoryProviders = normalizedProviders.map((provider) =>
    provider === "deterministic_tools" ? "local_deterministic_tools" : provider
  );

  if (advisoryProviders.includes("gemini_cli")) {
    return unique([
      ...advisoryProviders,
      "provider_neutral_subscription_or_free_advisory_model",
      "local_llm_when_available"
    ]);
  }

  return unique([...advisoryProviders, "local_llm_when_available"]);
}

function requiredChecksForProviders(providerIds: readonly ReasoningProviderId[]): string[] {
  return providerIds.flatMap((providerId) => {
    const provider = reasoningProviderPolicies.find((candidate) => candidate.id === providerId);
    return provider ? [...provider.requiredChecks] : [];
  });
}

function stopConditionsForProviders(providerIds: readonly ReasoningProviderId[]): string[] {
  return providerIds.flatMap((providerId) => {
    const provider = reasoningProviderPolicies.find((candidate) => candidate.id === providerId);
    return provider ? [...provider.stopConditions] : [];
  });
}

function requiredChecksForTaskLanes(taskLaneIds: readonly ReasoningTaskLaneId[]): string[] {
  return taskLaneIds.flatMap((laneId) => {
    const lane = reasoningTaskLanePolicies.find((candidate) => candidate.id === laneId);
    return lane ? [...lane.requiredChecks] : [];
  });
}

function stopConditionsForTaskLanes(taskLaneIds: readonly ReasoningTaskLaneId[]): string[] {
  return taskLaneIds.flatMap((laneId) => {
    const lane = reasoningTaskLanePolicies.find((candidate) => candidate.id === laneId);
    return lane ? [...lane.stopConditions] : [];
  });
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]/g, " ");
}

function hasAny(normalizedTask: string, terms: readonly string[]): boolean {
  return terms.some((term) => normalizedTask.includes(normalize(term)));
}
