import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import {
  PDOS_PROJECT_TYPES,
  PDOS_RECIPE_IDS,
  routeProductDesignOs,
  type PdosChangeRequestContext,
  type PdosProjectType,
  type PdosRecipeId,
  type PdosRiskLevel,
  type PdosRouteRequest
} from "../product-design-os/scripts/route-product-design-os";
import {
  scoreProductDesignOs,
  type PdosScoreInput
} from "../product-design-os/scripts/score-product-design-os";
import {
  searchArchitectureLibrary,
  selectDesignReviewRoute
} from "../src/data/delivery-system/designIntelligence";
import { selectGraphicRoute } from "../src/data/delivery-system/graphicAgent";
import { selectLocalWorkerRoute } from "../src/data/delivery-system/localWorkers";
import { selectReasoningModelRoute } from "../src/data/delivery-system/modelPolicy";
import { selectProtectiveSupervisionRoute } from "../src/data/delivery-system/protectiveSupervision";
import { selectTokenEfficiencyRoute } from "../src/data/delivery-system/tokenEfficiency";
import {
  buildAgentPacket,
  buildProjectMeshPacket,
  explainNode,
  findRequiredAgents,
  findRisks,
  getRelevantSubgraph,
  loadDecisionMeshFromRoot,
  loadProjectDecisionMeshFromRoot,
  selectCapabilities
} from "../src/lib/decision-mesh";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const mesh = loadDecisionMeshFromRoot(projectRoot);

const server = new McpServer({
  name: "autopilot-decision-mesh",
  version: "0.1.0"
});

server.registerTool(
  "select_capabilities",
  {
    title: "Select Autopilot Capabilities",
    description: "Route a task to Autopilot capability modules before building a compact agent packet.",
    inputSchema: {
      task: z.string().min(1),
      max_nodes: z.number().int().min(1).max(24).optional()
    }
  },
  async (input) => toJsonText(selectCapabilities(mesh, toCapabilitySelectionInput(input)))
);

server.registerTool(
  "select_graphic_route",
  {
    title: "Select Graphic Production Route",
    description:
      "Return a read-only Graphic Production Agent route for static graphics, motion, physics, models, or storyboards.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(selectGraphicRoute(input))
);

server.registerTool(
  "select_design_review_route",
  {
    title: "Select Design Review Route",
    description:
      "Return a read-only Visual Analyst and Design Critic route for visual analysis, critique, research, and handoff.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(selectDesignReviewRoute(input))
);

server.registerTool(
  "search_architecture_library",
  {
    title: "Search Autopilot Architecture Library",
    description:
      "Return read-only candidate technologies from Autopilot's LLM/ML architecture library without approving adoption.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(searchArchitectureLibrary(input))
);

server.registerTool(
  "select_reasoning_model_route",
  {
    title: "Select Reasoning Model Route",
    description:
      "Return a read-only model-routing recommendation for local workers, Gemini, or other free/no-cost advisory reasoning models.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(selectReasoningModelRoute(input))
);

server.registerTool(
  "select_local_worker_route",
  {
    title: "Select Local Worker Route",
    description:
      "Return a read-only local worker routing recommendation for Qwen2.5-Coder, deterministic tooling, tests, search, and summarization.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(selectLocalWorkerRoute(input))
);

server.registerTool(
  "select_token_efficiency_route",
  {
    title: "Select Token Efficiency Route",
    description:
      "Return a read-only Caveman/compact routing profile for minimal context, deterministic-first work, and paid-token avoidance.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(selectTokenEfficiencyRoute(input))
);

server.registerTool(
  "select_protective_supervision_route",
  {
    title: "Select Protective Supervision Route",
    description:
      "Return a read-only protective supervision route for currentness checks, agent handoff compilation, progress tracking, and blocker review.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(selectProtectiveSupervisionRoute(input))
);

server.registerTool(
  "route_product_design_os",
  {
    title: "Route Product & Design OS Intake",
    description:
      "Return a read-only Product & Design OS route for project intake or change-request triage, with optional Markdown report output.",
    inputSchema: {
      text: z.string().min(1).optional(),
      project_type: z.string().min(1).optional(),
      primary_goal: z.string().min(1).optional(),
      target_users: z.array(z.string().min(1)).optional(),
      critical_user_action: z.string().min(1).optional(),
      content_or_data: z.array(z.string().min(1)).optional(),
      must_have: z.array(z.string().min(1)).optional(),
      must_not_do: z.array(z.string().min(1)).optional(),
      logic_priority: z.number().int().min(1).max(10).optional(),
      design_priority: z.number().int().min(1).max(10).optional(),
      motion_level: z.number().int().min(0).max(10).optional(),
      risk_level: z.enum(["low", "medium", "high", "critical"]).optional(),
      change_request: z.string().min(1).optional(),
      change_context: z
        .object({
          project_type: z.string().min(1).optional(),
          selected_recipe: z.string().min(1).optional(),
          primary_goal: z.string().min(1).optional(),
          critical_user_action: z.string().min(1).optional(),
          logic_priority: z.number().int().min(1).max(10).optional(),
          design_priority: z.number().int().min(1).max(10).optional(),
          motion_level: z.number().int().min(0).max(10).optional(),
          risk_level: z.enum(["low", "medium", "high", "critical"]).optional()
        })
        .optional(),
      format: z.enum(["json", "markdown"]).optional()
    }
  },
  async (input) => {
    const result = routeProductDesignOs(toPdosRouteRequest(input));
    return input.format === "markdown" ? toText(result.report_markdown) : toJsonText(result);
  }
);

server.registerTool(
  "score_product_design_os",
  {
    title: "Score Product & Design OS Candidates",
    description:
      "Return a read-only deterministic Product & Design OS score report for recipes, patterns, and assets using local registries.",
    inputSchema: {
      text: z.string().min(1).optional(),
      project_type: z.string().min(1).optional(),
      primary_goal: z.string().min(1).optional(),
      target_users: z.array(z.string().min(1)).optional(),
      critical_user_action: z.string().min(1).optional(),
      content_or_data: z.array(z.string().min(1)).optional(),
      must_have: z.array(z.string().min(1)).optional(),
      must_not_do: z.array(z.string().min(1)).optional(),
      logic_priority: z.number().int().min(1).max(10).optional(),
      design_priority: z.number().int().min(1).max(10).optional(),
      motion_level: z.number().int().min(0).max(10).optional(),
      risk_level: z.enum(["low", "medium", "high", "critical"]).optional(),
      limit: z.number().int().min(1).max(10).optional(),
      format: z.enum(["json", "markdown"]).optional()
    }
  },
  async (input) => {
    const result = scoreProductDesignOs(toPdosScoreInput(input), projectRoot);
    return input.format === "markdown" ? toText(result.report_markdown) : toJsonText(result);
  }
);

server.registerTool(
  "get_relevant_subgraph",
  {
    title: "Get Relevant Decision Mesh Subgraph",
    description: "Return a compact read-only Decision Mesh subgraph for a task and optional agent role.",
    inputSchema: {
      task: z.string().min(1),
      agent: z.string().min(1).optional(),
      max_nodes: z.number().int().min(1).max(24).optional()
    }
  },
  async (input) => toJsonText(getRelevantSubgraph(mesh, toRelevantSubgraphInput(input)))
);

server.registerTool(
  "build_agent_packet",
  {
    title: "Build Decision Mesh Agent Packet",
    description: "Return compact task guidance for one agent role without loading the full mesh.",
    inputSchema: {
      task: z.string().min(1),
      agent: z.string().min(1),
      token_budget: z.number().int().min(1000).max(32000).optional()
    }
  },
  async (input) => toJsonText(buildAgentPacket(mesh, toAgentPacketInput(input)))
);

server.registerTool(
  "build_project_mesh_packet",
  {
    title: "Build Project Decision Mesh Packet",
    description: "Return compact task guidance from a supervised project's own Decision Mesh.",
    inputSchema: {
      project_slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
      task: z.string().min(1),
      agent: z.string().min(1).optional(),
      max_nodes: z.number().int().min(1).max(24).optional()
    }
  },
  async (input) => {
    const projectMesh = loadProjectDecisionMeshFromRoot(projectRoot, input.project_slug);
    return toJsonText(buildProjectMeshPacket(projectMesh, toProjectMeshPacketInput(input)));
  }
);

server.registerTool(
  "explain_node",
  {
    title: "Explain Decision Mesh Node",
    description: "Explain why a node exists and which risks, checks, agents, and edges connect to it.",
    inputSchema: {
      node_id: z.string().min(1)
    }
  },
  async ({ node_id }) => toJsonText(explainNode(mesh, node_id))
);

server.registerTool(
  "find_required_agents",
  {
    title: "Find Required Agents",
    description: "Return likely required agents and reasons for a task.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(findRequiredAgents(mesh, input))
);

server.registerTool(
  "find_risks",
  {
    title: "Find Decision Mesh Risks",
    description: "Return relevant risk nodes and stop conditions for a task.",
    inputSchema: {
      task: z.string().min(1)
    }
  },
  async (input) => toJsonText(findRisks(mesh, input))
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function toJsonText(value: unknown): { content: { type: "text"; text: string }[] } {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function toText(value: string): { content: { type: "text"; text: string }[] } {
  return {
    content: [
      {
        type: "text",
        text: value
      }
    ]
  };
}

function toPdosRouteRequest(input: {
  text?: string | undefined;
  project_type?: string | undefined;
  primary_goal?: string | undefined;
  target_users?: string[] | undefined;
  critical_user_action?: string | undefined;
  content_or_data?: string[] | undefined;
  must_have?: string[] | undefined;
  must_not_do?: string[] | undefined;
  logic_priority?: number | undefined;
  design_priority?: number | undefined;
  motion_level?: number | undefined;
  risk_level?: PdosRiskLevel | undefined;
  change_request?: string | undefined;
  change_context?: {
    project_type?: string | undefined;
    selected_recipe?: string | undefined;
    primary_goal?: string | undefined;
    critical_user_action?: string | undefined;
    logic_priority?: number | undefined;
    design_priority?: number | undefined;
    motion_level?: number | undefined;
    risk_level?: PdosRiskLevel | undefined;
  } | undefined;
}): PdosRouteRequest {
  const output: {
    text?: string;
    project_type?: string;
    primary_goal?: string;
    target_users?: string[];
    critical_user_action?: string;
    content_or_data?: string[];
    must_have?: string[];
    must_not_do?: string[];
    logic_priority?: number;
    design_priority?: number;
    motion_level?: number;
    risk_level?: PdosRiskLevel;
    change_request?: string;
    change_context?: PdosChangeRequestContext;
  } = {};

  if (input.text !== undefined) output.text = input.text;
  if (input.project_type !== undefined) output.project_type = input.project_type;
  if (input.primary_goal !== undefined) output.primary_goal = input.primary_goal;
  if (input.target_users !== undefined) output.target_users = input.target_users;
  if (input.critical_user_action !== undefined) output.critical_user_action = input.critical_user_action;
  if (input.content_or_data !== undefined) output.content_or_data = input.content_or_data;
  if (input.must_have !== undefined) output.must_have = input.must_have;
  if (input.must_not_do !== undefined) output.must_not_do = input.must_not_do;
  if (input.logic_priority !== undefined) output.logic_priority = input.logic_priority;
  if (input.design_priority !== undefined) output.design_priority = input.design_priority;
  if (input.motion_level !== undefined) output.motion_level = input.motion_level;
  if (input.risk_level !== undefined) output.risk_level = input.risk_level;
  if (input.change_request !== undefined) output.change_request = input.change_request;
  if (input.change_context !== undefined) output.change_context = toPdosChangeContext(input.change_context);

  return output;
}

function toPdosChangeContext(input: {
  project_type?: string | undefined;
  selected_recipe?: string | undefined;
  primary_goal?: string | undefined;
  critical_user_action?: string | undefined;
  logic_priority?: number | undefined;
  design_priority?: number | undefined;
  motion_level?: number | undefined;
  risk_level?: PdosRiskLevel | undefined;
}): PdosChangeRequestContext {
  const output: {
    project_type?: PdosProjectType;
    selected_recipe?: PdosRecipeId;
    primary_goal?: string;
    critical_user_action?: string;
    logic_priority?: number;
    design_priority?: number;
    motion_level?: number;
    risk_level?: PdosRiskLevel;
  } = {};

  if (isPdosProjectType(input.project_type)) output.project_type = input.project_type;
  if (isPdosRecipeId(input.selected_recipe)) output.selected_recipe = input.selected_recipe;
  if (input.primary_goal !== undefined) output.primary_goal = input.primary_goal;
  if (input.critical_user_action !== undefined) output.critical_user_action = input.critical_user_action;
  if (input.logic_priority !== undefined) output.logic_priority = input.logic_priority;
  if (input.design_priority !== undefined) output.design_priority = input.design_priority;
  if (input.motion_level !== undefined) output.motion_level = input.motion_level;
  if (input.risk_level !== undefined) output.risk_level = input.risk_level;

  return output;
}

function toPdosScoreInput(input: {
  text?: string | undefined;
  project_type?: string | undefined;
  primary_goal?: string | undefined;
  target_users?: string[] | undefined;
  critical_user_action?: string | undefined;
  content_or_data?: string[] | undefined;
  must_have?: string[] | undefined;
  must_not_do?: string[] | undefined;
  logic_priority?: number | undefined;
  design_priority?: number | undefined;
  motion_level?: number | undefined;
  risk_level?: PdosRiskLevel | undefined;
  limit?: number | undefined;
}): PdosScoreInput {
  const output: {
    text?: string;
    project_type?: string;
    primary_goal?: string;
    target_users?: string[];
    critical_user_action?: string;
    content_or_data?: string[];
    must_have?: string[];
    must_not_do?: string[];
    logic_priority?: number;
    design_priority?: number;
    motion_level?: number;
    risk_level?: PdosRiskLevel;
    limit?: number;
  } = {};

  if (input.text !== undefined) output.text = input.text;
  if (input.project_type !== undefined) output.project_type = input.project_type;
  if (input.primary_goal !== undefined) output.primary_goal = input.primary_goal;
  if (input.target_users !== undefined) output.target_users = input.target_users;
  if (input.critical_user_action !== undefined) output.critical_user_action = input.critical_user_action;
  if (input.content_or_data !== undefined) output.content_or_data = input.content_or_data;
  if (input.must_have !== undefined) output.must_have = input.must_have;
  if (input.must_not_do !== undefined) output.must_not_do = input.must_not_do;
  if (input.logic_priority !== undefined) output.logic_priority = input.logic_priority;
  if (input.design_priority !== undefined) output.design_priority = input.design_priority;
  if (input.motion_level !== undefined) output.motion_level = input.motion_level;
  if (input.risk_level !== undefined) output.risk_level = input.risk_level;
  if (input.limit !== undefined) output.limit = input.limit;

  return output;
}

function isPdosProjectType(value: string | undefined): value is PdosProjectType {
  return value !== undefined && PDOS_PROJECT_TYPES.includes(value as PdosProjectType);
}

function isPdosRecipeId(value: string | undefined): value is PdosRecipeId {
  return value !== undefined && PDOS_RECIPE_IDS.includes(value as PdosRecipeId);
}

function toRelevantSubgraphInput(input: {
  task: string;
  agent?: string | undefined;
  max_nodes?: number | undefined;
}): { task: string; agent?: string; max_nodes?: number } {
  const output: { task: string; agent?: string; max_nodes?: number } = { task: input.task };

  if (input.agent !== undefined) {
    output.agent = input.agent;
  }

  if (input.max_nodes !== undefined) {
    output.max_nodes = input.max_nodes;
  }

  return output;
}

function toAgentPacketInput(input: {
  task: string;
  agent: string;
  token_budget?: number | undefined;
}): { task: string; agent: string; token_budget?: number } {
  const output: { task: string; agent: string; token_budget?: number } = {
    task: input.task,
    agent: input.agent
  };

  if (input.token_budget !== undefined) {
    output.token_budget = input.token_budget;
  }

  return output;
}

function toCapabilitySelectionInput(input: {
  task: string;
  max_nodes?: number | undefined;
}): { task: string; max_nodes?: number } {
  const output: { task: string; max_nodes?: number } = { task: input.task };

  if (input.max_nodes !== undefined) {
    output.max_nodes = input.max_nodes;
  }

  return output;
}

function toProjectMeshPacketInput(input: {
  project_slug: string;
  task: string;
  agent?: string | undefined;
  max_nodes?: number | undefined;
}): { project_slug: string; task: string; agent?: string; max_nodes?: number } {
  const output: { project_slug: string; task: string; agent?: string; max_nodes?: number } = {
    project_slug: input.project_slug,
    task: input.task
  };

  if (input.agent !== undefined) {
    output.agent = input.agent;
  }

  if (input.max_nodes !== undefined) {
    output.max_nodes = input.max_nodes;
  }

  return output;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
