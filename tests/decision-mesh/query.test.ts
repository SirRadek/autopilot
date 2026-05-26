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
      "auth_required",
      "storage_provider",
      "security_upload",
      "qa_upload_tests",
      "user_profile",
      "frontend_form"
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
    expect(packet.required_checks).toContain("server_validation");
    expect(packet.stop_conditions).toContain("missing_server_validation");
  });
});
