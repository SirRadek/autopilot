export interface ProjectMeshPolicy {
  readonly autopilotMeshScope: "autopilot_operations_only";
  readonly projectMeshRequired: boolean;
  readonly projectMeshPathPattern: string;
  readonly creationTriggers: readonly string[];
  readonly updateTriggers: readonly string[];
  readonly stopConditions: readonly string[];
}

export const projectMeshPolicy = {
  autopilotMeshScope: "autopilot_operations_only",
  projectMeshRequired: true,
  projectMeshPathPattern: "docs/projects/<project-slug>/decision-mesh/",
  creationTriggers: [
    "project_architecture_started",
    "project_onboarded_without_mesh",
    "implementation_requested_for_project"
  ],
  updateTriggers: [
    "meaningful_work_slice_completed",
    "architecture_impact_recorded",
    "new_dependency_or_risk_found",
    "new_stop_condition_found",
    "agent_routing_changed"
  ],
  stopConditions: [
    "missing_project_mesh",
    "project_mesh_not_updated_after_work",
    "autopilot_mesh_used_as_product_mesh"
  ]
} as const satisfies ProjectMeshPolicy;
