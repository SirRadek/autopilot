import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

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
