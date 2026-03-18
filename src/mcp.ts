/**
 * MCP Tool to A2A Skill mapping utilities.
 *
 * Provides bidirectional conversion between MCP (Model Context Protocol) Tool
 * definitions and A2A Skill definitions, reducing the switching cost for
 * developers moving between the two ecosystems.
 */

import type { AgentCard, Skill } from "./card.js";

/** Represents an MCP Tool definition (MCP v2.x compatible). */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/** Convert an MCP Tool definition to an A2A Skill. */
export function mcpToolToSkill(tool: MCPTool): Skill {
  return {
    id: tool.name,
    description: tool.description ?? "",
    inputSchema:
      tool.inputSchema && Object.keys(tool.inputSchema).length > 0
        ? JSON.stringify(tool.inputSchema)
        : undefined,
  };
}

/** Convert an A2A Skill to an MCP Tool definition. */
export function skillToMcpTool(skill: Skill): MCPTool {
  return {
    name: skill.id,
    description: skill.description,
    inputSchema: skill.inputSchema ? (JSON.parse(skill.inputSchema) as Record<string, unknown>) : {},
  };
}

/** Create an AgentCard from a list of MCP Tool definitions. */
export function mcpToolsToAgentCard(
  serverName: string,
  tools: MCPTool[],
  options?: { description?: string; version?: string },
): AgentCard {
  return {
    name: serverName,
    description: options?.description ?? "",
    version: options?.version ?? "1.0.0",
    skills: tools.map(mcpToolToSkill),
  };
}
