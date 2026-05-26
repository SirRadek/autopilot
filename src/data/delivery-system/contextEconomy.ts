export interface ContextUsagePolicy {
  readonly default: {
    readonly neverDumpFullProject: boolean;
    readonly preferRelevantSubgraph: boolean;
    readonly preferAgentPacket: boolean;
    readonly summarizeBeforeRestart: boolean;
  };
  readonly maxSessionTurns: Record<string, number>;
  readonly restartWhen: readonly string[];
  readonly beforeCallingModel: {
    readonly requiredSteps: readonly string[];
  };
  readonly avoid: readonly string[];
}

export interface SessionResetProtocol {
  readonly summaryIncludes: readonly string[];
  readonly summaryExcludes: readonly string[];
  readonly restartPromptTemplate: string;
}

export const contextUsagePolicy = {
  default: {
    neverDumpFullProject: true,
    preferRelevantSubgraph: true,
    preferAgentPacket: true,
    summarizeBeforeRestart: true
  },
  maxSessionTurns: {
    brainstorming: 15,
    coding: 10,
    review: 8,
    debugging: 12
  },
  restartWhen: [
    "topic_changed",
    "context_too_long",
    "agent_repeats_itself",
    "output_quality_drops",
    "task_scope_changed",
    "after_major_plan_completed"
  ],
  beforeCallingModel: {
    requiredSteps: ["classify_task", "select_capabilities", "select_context", "select_model", "build_agent_packet"]
  },
  avoid: [
    "full_repo_dump",
    "repeated_project_explanation",
    "long_unstructured_chat_history",
    "multiple_unrelated_tasks_in_one_session",
    "asking_frontier_model_for_boilerplate"
  ]
} as const satisfies ContextUsagePolicy;

export const sessionResetProtocol = {
  summaryIncludes: [
    "current_goal",
    "decisions_made",
    "open_questions",
    "files_changed",
    "risks",
    "next_actions"
  ],
  summaryExcludes: ["old_failed_branches", "irrelevant_discussion", "repeated_explanations"],
  restartPromptTemplate: [
    "Continue from this compressed state.",
    "Do not rely on previous conversation.",
    "Treat this summary as the source of truth.",
    "",
    "Goal:",
    "{{goal}}",
    "",
    "Decisions:",
    "{{decisions}}",
    "",
    "Current task:",
    "{{current_task}}",
    "",
    "Relevant files:",
    "{{files}}",
    "",
    "Risks:",
    "{{risks}}",
    "",
    "Next action:",
    "{{next_action}}"
  ].join("\n")
} as const satisfies SessionResetProtocol;
