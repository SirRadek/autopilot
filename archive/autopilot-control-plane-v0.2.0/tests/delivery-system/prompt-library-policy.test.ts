import { describe, expect, it } from "vitest";

import { promptLibraryPolicy, selectPromptLibraryRoute } from "../../src/data/delivery-system/promptLibrary";

describe("prompt library policy", () => {
  it("keeps the local Git Markdown library as source of truth", () => {
    expect(promptLibraryPolicy.sourceOfTruth).toBe("local_git_markdown_library");
    expect(promptLibraryPolicy.authorityOrder[0]).toBe("official_provider_docs");
    expect(promptLibraryPolicy.authorityOrder).toContain("local_evals_and_verified_outputs");
    expect(promptLibraryPolicy.forbiddenSources).toContain("leaked_system_prompts");
    expect(promptLibraryPolicy.forbiddenSources).toContain("model_output_as_prompt_authority");
  });

  it("requires metadata, evals, versioning, and rollback for prompt adoption", () => {
    expect(promptLibraryPolicy.requiredMetadata).toEqual(
      expect.arrayContaining(["id", "model_family", "version", "sources", "evals"])
    );
    expect(promptLibraryPolicy.requiredChecks).toEqual(
      expect.arrayContaining([
        "official_provider_docs_verified",
        "prompt_metadata_complete",
        "prompt_eval_defined",
        "model_output_eval_recorded_before_prompt_change",
        "prompt_or_input_delta_recorded",
        "weekly_eval_records_required_for_batch_tuning",
        "role_scope_declared",
        "token_efficiency_route_selected",
        "plugin_capability_verified",
        "github_task_normalized",
        "asset_or_library_source_verified",
        "version_change_logged",
        "rollback_path_exists"
      ])
    );
    expect(promptLibraryPolicy.stopConditions).toContain("prompt_without_eval");
    expect(promptLibraryPolicy.stopConditions).toContain("prompt_change_without_model_output_eval_record");
    expect(promptLibraryPolicy.stopConditions).toContain("prompt_rerun_without_delta");
    expect(promptLibraryPolicy.stopConditions).toContain("weekly_prompt_tuning_without_eval_records");
    expect(promptLibraryPolicy.stopConditions).toContain("paid_prompt_management_tool_required");
    expect(promptLibraryPolicy.stopConditions).toContain("raw_github_issue_used_as_prompt");
    expect(promptLibraryPolicy.stopConditions).toContain("plugin_invoked_without_availability_check");
  });

  it("routes Gemini prompt work as advisory brainstorming with verification gates", () => {
    const route = selectPromptLibraryRoute({
      task: "Use Gemini prompt variants for brainstorming and creative critique"
    });

    expect(route.route).toBe("advisory_brainstorm_prompt");
    expect(route.providers).toContain("google");
    expect(route.requiredChecks).toContain("redacted_context_only");
    expect(route.stopConditions).toContain("model_output_used_as_source_of_truth");
  });

  it("routes Qwen prompts as bounded local worker prompts", () => {
    const route = selectPromptLibraryRoute({
      task: "Create a Qwen2.5 Coder 14B local worker prompt for minimal patch drafts"
    });

    expect(route.route).toBe("local_worker_prompt");
    expect(route.providers).toEqual(expect.arrayContaining(["qwen", "local"]));
    expect(route.notes.join(" ")).toContain("bounded");
  });

  it("requires eval workflow for prompt versioning and rollback work", () => {
    const route = selectPromptLibraryRoute({
      task: "Add prompt management, versioning, regression evals, and rollback labels"
    });

    expect(route.route).toBe("prompt_eval_required");
    expect(route.providers).toContain("local");
    expect(route.requiredChecks).toContain("prompt_eval_defined");
  });

  it("normalizes GitHub inputs before treating them as prompts", () => {
    const route = selectPromptLibraryRoute({
      task: "Turn a GitHub issue and PR review request into an agent prompt"
    });

    expect(route.route).toBe("github_control_surface_prompt");
    expect(route.requiredChecks).toContain("github_task_normalized");
    expect(route.stopConditions).toContain("raw_github_issue_used_as_prompt");
  });

  it("routes plugin, library, and asset prompts through capability and source checks", () => {
    const route = selectPromptLibraryRoute({
      task: "Use Figma plugin, GitHub library candidates, UI kit assets, and icons in a prompt"
    });

    expect(route.route).toBe("plugin_asset_library_prompt");
    expect(route.requiredChecks).toContain("plugin_capability_verified");
    expect(route.requiredChecks).toContain("asset_or_library_source_verified");
    expect(route.stopConditions).toContain("asset_or_library_without_source_review");
  });

  it("routes role prompts through scope and forbidden-action checks", () => {
    const route = selectPromptLibraryRoute({
      task: "Create a prompt for the Design Critic role and Visual Analyst agent scope"
    });

    expect(route.route).toBe("role_scope_prompt");
    expect(route.requiredChecks).toContain("role_scope_declared");
    expect(route.stopConditions).toContain("role_without_scope");
  });
});
