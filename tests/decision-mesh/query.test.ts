import { describe, expect, it } from "vitest";

import {
  buildAgentPacket,
  buildProjectMeshPacket,
  explainNode,
  findRequiredAgents,
  findRisks,
  getRelevantSubgraph,
  loadProjectDecisionMeshFromRoot,
  loadDecisionMeshFromRoot,
  selectCapabilities
} from "../../src/lib/decision-mesh";

const mesh = loadDecisionMeshFromRoot(process.cwd());

describe("Decision Mesh queries", () => {
  it("loads the seed mesh with required reasoning fields", () => {
    expect(mesh.nodes.length).toBeGreaterThanOrEqual(8);
    expect(mesh.edges.length).toBeGreaterThanOrEqual(8);

    const fileUpload = mesh.nodes.find((node) => node.id === "file_upload");

    expect(fileUpload?.why).toContain("Upload");
    expect(fileUpload?.signals).toContain("avatar");
    expect(fileUpload?.required_checks).toContain("reject_unauthenticated");
  });

  it("finds upload, auth, storage, security, frontend, and QA context for avatar uploads", () => {
    const result = getRelevantSubgraph(mesh, {
      task: "Add authenticated avatar upload",
      agent: "backend",
      max_nodes: 7
    });

    expect(result.relevant_nodes.map((node) => node.id)).toEqual([
      "file_upload",
      "frontend_form",
      "qa_upload_tests",
      "security_upload",
      "auth_required",
      "user_profile",
      "storage_provider"
    ]);
    expect(result.required_agents).toEqual(["backend", "frontend", "security", "qa"]);
    expect(result.excluded).toContain("payments_checkout");
  });

  it("builds a compact backend packet without returning the full graph", () => {
    const packet = buildAgentPacket(mesh, {
      task: "Add authenticated avatar upload",
      agent: "backend",
      token_budget: 8000
    });

    expect(packet.agent).toBe("backend");
    expect(packet.task).toBe("Add authenticated avatar upload");
    expect(packet.relevant_nodes).toContain("file_upload");
    expect(packet.required_agents).toEqual(["backend", "frontend", "security", "qa"]);
    expect(packet.must_read).toContain("src/auth/session.ts");
    expect(packet.must_read).toContain("src/storage/index.ts");
    expect(packet.required_checks).toContain("reject_unauthenticated");
    expect(packet.required_checks).toContain("validate_file_size");
    expect(packet.must_not_assume).toContain("Do not assume S3.");
    expect(packet.relevant_nodes.length).toBeLessThan(mesh.nodes.length);
  });

  it("explains a node with its connected risks and outbound requirements", () => {
    const explanation = explainNode(mesh, "file_upload");

    expect(explanation.id).toBe("file_upload");
    expect(explanation.why).toContain("untrusted user content");
    expect(explanation.required_agents).toEqual(["backend", "frontend", "security", "qa"]);
    expect(explanation.connections.map((edge) => edge.to)).toContain("security_upload");
    expect(explanation.connected_risks).toContain("security_upload");
  });

  it("finds required agents and reasons for checkout work", () => {
    const result = findRequiredAgents(mesh, {
      task: "Change subscription checkout"
    });

    expect(result.required_agents).toEqual(["architect", "backend", "frontend", "security", "business", "qa"]);
    expect(result.reason).toContain("Checkout affects revenue and payment flow.");
  });

  it("finds task-specific risks and stop conditions", () => {
    const result = findRisks(mesh, {
      task: "Add public file upload endpoint"
    });

    expect(result.risks.map((risk) => risk.id)).toContain("file_upload");
    expect(result.risks.map((risk) => risk.id)).toContain("public_api");
    expect(result.stop_conditions).toContain("missing_auth_check");
    expect(result.stop_conditions).toContain("public_endpoint_without_rate_limit");
  });

  it("routes strategic reasoning work to the reasoning strategy node", () => {
    const result = getRelevantSubgraph(mesh, {
      task: "Use frontier reasoning for deep research, architecture review, security audit, and local worker routing",
      agent: "architect",
      max_nodes: 4
    });

    expect(result.relevant_nodes[0]?.id).toBe("reasoning_strategy");
    expect(result.required_agents).toContain("architect");
    expect(result.required_agents).toContain("security");
    expect(findRisks(mesh, { task: "Use non local worker for boilerplate coding" }).stop_conditions).toContain(
      "non_local_worker_dependency"
    );
  });

  it("routes prompt library work through prompt policy and blocks unverified prompt adoption", () => {
    const result = getRelevantSubgraph(mesh, {
      task: "Add a GPT Claude Gemini Qwen prompt library with prompt evals, source authority, and version rollback",
      agent: "architect",
      max_nodes: 5
    });

    expect(result.relevant_nodes.map((node) => node.id)).toContain("prompt_library_policy");
    expect(result.required_agents).toEqual(expect.arrayContaining(["architect", "qa"]));
    const promptNode = result.relevant_nodes.find((node) => node.id === "prompt_library_policy");
    expect(promptNode?.required_checks).toEqual(
      expect.arrayContaining(["prompt_metadata_complete", "prompt_eval_defined", "official_provider_docs_verified"])
    );
    expect(findRisks(mesh, { task: "Adopt leaked system prompts without evals" }).stop_conditions).toEqual(
      expect.arrayContaining(["leaked_system_prompt_used", "prompt_without_eval"])
    );
  });

  it("routes protective supervision work through currentness, handoff, progress, and blocker guardrails", () => {
    const result = getRelevantSubgraph(mesh, {
      task: "Add a protective currentness sentinel that compiles agent output into next-agent handoff packets and tracks progress blockers",
      agent: "architect",
      max_nodes: 5
    });

    expect(result.relevant_nodes.map((node) => node.id)).toContain("protective_supervision_policy");
    expect(result.required_agents).toEqual(expect.arrayContaining(["architect", "qa"]));
    const protectiveNode = result.relevant_nodes.find((node) => node.id === "protective_supervision_policy");
    expect(protectiveNode?.required_checks).toEqual(
      expect.arrayContaining(["agent_output_normalized", "progress_state_updated", "blocker_owner_declared"])
    );
    expect(
      findRisks(mesh, { task: "Pass raw agent output as next prompt without blocker owner" }).stop_conditions
    ).toEqual(expect.arrayContaining(["raw_agent_output_used_as_next_prompt", "blocker_without_owner"]));
  });

  it("returns an empty subgraph when no task signal matches", () => {
    const result = getRelevantSubgraph(mesh, {
      task: "Polish the archival naming convention",
      agent: "architect",
      max_nodes: 4
    });

    expect(result.relevant_nodes).toEqual([]);
    expect(result.relevant_edges).toEqual([]);
    expect(result.required_agents).toEqual([]);
    expect(result.excluded.length).toBe(mesh.nodes.length);
  });

  it("keeps exact node matches ahead of neighboring expansion", () => {
    const result = getRelevantSubgraph(mesh, {
      task: "Update prompt library, compact context, token policy, and model spend",
      agent: "architect",
      max_nodes: 3
    });

    expect(result.relevant_nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(["prompt_library_policy", "context_economy_policy", "model_spend_policy"])
    );
  });

  it("routes per-project mesh lifecycle work to the project mesh node", () => {
    const result = getRelevantSubgraph(mesh, {
      task: "Create a separate decision mesh for a new project during architecture onboarding and update it after completion",
      agent: "architect",
      max_nodes: 4
    });

    expect(result.relevant_nodes[0]?.id).toBe("project_mesh_lifecycle");
    expect(findRisks(mesh, { task: "Project has no mesh during architecture start" }).stop_conditions).toContain(
      "missing_project_mesh"
    );
  });

  it("selects service capabilities through the existing Decision Mesh layer", () => {
    const result = selectCapabilities(mesh, {
      task: "Optimize a slow website with SEO issues, broken links, and poor Core Web Vitals"
    });

    expect(result.capabilities).toEqual(expect.arrayContaining(["optimization_mesh", "seo_mesh"]));
    expect(result.avoided_capabilities).toContain("three_d_experience_addon");
    expect(result.required_agents).toEqual(expect.arrayContaining(["seo_performance", "frontend"]));
    expect(result.relevant_nodes).toEqual(expect.arrayContaining(["optimization_mesh", "seo_mesh"]));
  });

  it("does not fall back unknown capability requests to optimization or SEO", () => {
    const result = selectCapabilities(mesh, {
      task: "Polish the archival naming convention"
    });

    expect(result.capabilities).toEqual([]);
    expect(result.optional_capabilities).toEqual([]);
    expect(result.avoided_capabilities).toEqual([]);
    expect(result.relevant_nodes).toEqual([]);
    expect(result.required_checks).toEqual([]);
    expect(result.stop_conditions).toEqual([]);
  });

  it("routes diagnostics through observability with project/control-plane separation checks", () => {
    const result = selectCapabilities(mesh, {
      task: "Inspect logs, tracing, runtime errors, and bottlenecks while separating Autopilot from project issues"
    });

    expect(result.capabilities).toContain("observability_mesh");
    expect(result.required_checks).toEqual(
      expect.arrayContaining([
        "problem_scope_classified",
        "autopilot_vs_project_boundary",
        "redacted_log_summary",
        "baseline_metric",
        "suspect_layer_identified"
      ])
    );
    expect(findRisks(mesh, { task: "Copy raw project logs into Autopilot" }).stop_conditions).toContain(
      "raw_project_logs_copied_to_autopilot"
    );
  });

  it("builds a compact project-specific mesh packet", () => {
    const projectMesh = loadProjectDecisionMeshFromRoot(process.cwd(), "radeq");
    const packet = buildProjectMeshPacket(projectMesh, {
      project_slug: "radeq",
      task: "Change lead capture form validation and D1 storage behavior",
      agent: "backend_database",
      max_nodes: 4
    });

    expect(packet.project_slug).toBe("radeq");
    expect(packet.relevant_nodes).toContain("lead_capture_pipeline");
    expect(packet.rules.map((rule) => rule.id)).toContain("RAD-LEADS-001");
    expect(packet.rules.find((rule) => rule.id === "RAD-LEADS-001")).toMatchObject({
      severity: "blocker",
      instruction: expect.stringContaining("Client and server validation")
    });
    expect(packet.required_checks).toContain("server_validation");
    expect(packet.stop_conditions).toContain("missing_server_validation");
  });

  it("keeps Radeq runtime diagnostics inside the Radeq project mesh", () => {
    const projectMesh = loadProjectDecisionMeshFromRoot(process.cwd(), "radeq");
    const packet = buildProjectMeshPacket(projectMesh, {
      project_slug: "radeq",
      task: "Diagnose Radeq Cloudflare deploy logs, client console errors, D1 lead API failures, and Core Web Vitals bottlenecks",
      agent: "qa",
      max_nodes: 4
    });

    expect(packet.relevant_nodes).toContain("runtime_observability_boundary");
    expect(packet.required_checks).toEqual(
      expect.arrayContaining(["project_slug_confirmed", "redacted_log_summary", "suspect_layer_identified"])
    );
    expect(packet.stop_conditions).toContain("raw_project_logs_copied_to_autopilot");
  });

  it("keeps Autopilot prompt library work inside the control-plane project mesh", () => {
    const projectMesh = loadProjectDecisionMeshFromRoot(process.cwd(), "autopilot-control-plane");
    const packet = buildProjectMeshPacket(projectMesh, {
      project_slug: "autopilot-control-plane",
      task: "Plan prompt library adoption for GPT Claude Gemini Qwen with evals and source authority",
      agent: "architect",
      max_nodes: 4
    });

    expect(packet.relevant_nodes).toContain("prompt_library_boundary");
    expect(packet.rules.map((rule) => rule.id)).toEqual(expect.arrayContaining(["ACP-PROMPT-001"]));
    expect(packet.must_not_assume).toEqual(
      expect.arrayContaining(["Do not treat public prompt packs as source of truth."])
    );
    expect(packet.required_checks).toEqual(
      expect.arrayContaining(["prompt_metadata_complete", "prompt_eval_defined", "official_provider_docs_verified"])
    );
    expect(packet.stop_conditions).toContain("paid_prompt_management_tool_required");
  });

  it("keeps Autopilot protective supervision inside the control-plane project mesh", () => {
    const projectMesh = loadProjectDecisionMeshFromRoot(process.cwd(), "autopilot-control-plane");
    const packet = buildProjectMeshPacket(projectMesh, {
      project_slug: "autopilot-control-plane",
      task: "Run protective supervision for currentness, agent handoff packets, progress ledger state, blockers, and waiting dependencies",
      agent: "architect",
      max_nodes: 5
    });

    expect(packet.relevant_nodes).toContain("protective_supervision_boundary");
    expect(packet.required_checks).toEqual(
      expect.arrayContaining(["official_docs_or_context7_for_currentness", "agent_output_normalized"])
    );
    expect(packet.stop_conditions).toContain("duplicate_runtime_queue");
  });

  it("routes Codex lifecycle hooks through report-first control-plane boundaries", () => {
    const rootMesh = loadDecisionMeshFromRoot(process.cwd());
    const subgraph = getRelevantSubgraph(rootMesh, {
      task: "Add Codex hooks for session start, tool risk checks, compaction continuity, and stop evidence",
      agent: "architect",
      max_nodes: 6
    });

    const hookNode = subgraph.relevant_nodes.find((node) => node.id === "codex_hooks_guardrail");

    expect(hookNode).toBeDefined();
    expect(hookNode?.stop_conditions).toContain("hook_stores_raw_sensitive_content");

    const projectMesh = loadProjectDecisionMeshFromRoot(process.cwd(), "autopilot-control-plane");
    const packet = buildProjectMeshPacket(projectMesh, {
      project_slug: "autopilot-control-plane",
      task: "Implement project-local Codex hooks as redacted report-first lifecycle guardrails",
      agent: "architect",
      max_nodes: 5
    });

    expect(packet.relevant_nodes).toContain("codex_hooks_boundary");
    expect(packet.required_checks).toEqual(
      expect.arrayContaining(["exact_hook_definition_trusted", "runtime_activation_evidence_separate"])
    );
    expect(packet.stop_conditions).toContain("runtime_activation_claim_without_evidence");
  });
});
