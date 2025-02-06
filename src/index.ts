#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ClickUpService } from "./services/clickup.service.js";
import { config } from "./config/app.config.js";
import { logger } from "./logger.js";
import { ClickUpTask, ClickUpBoard } from "./types.js";

// Tool Schemas
const commonIdDescription =
  "The unique identifier for the resource in ClickUp.";

const taskSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Task name" },
    description: {
      type: "string",
      description: "Task description in markdown format",
    },
    assignees: {
      type: "array",
      items: { type: "string" },
      description: "Array of assignee user IDs",
    },
    status: { type: "string", description: "Task status" },
    priority: {
      type: "number",
      enum: [1, 2, 3, 4],
      description: "Task priority (1: Urgent, 2: High, 3: Normal, 4: Low)",
    },
    due_date: {
      type: "string",
      description: "Due date in milliseconds timestamp",
    },
    time_estimate: {
      type: "string",
      description: "Time estimate in milliseconds",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Array of tag names",
    },
  },
  required: ["name"],
};

// Tool Definitions
const createTaskTool: Tool = {
  name: "clickup_create_task",
  description: "Create a new task in ClickUp workspace",
  inputSchema: {
    type: "object",
    properties: {
      list_id: {
        type: "string",
        description:
          "The ID of the list to create the task in. " + commonIdDescription,
      },
      ...taskSchema.properties,
    },
    required: ["list_id", "name"],
  },
};

const updateTaskTool: Tool = {
  name: "clickup_update_task",
  description: "Update an existing task in ClickUp",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to update. " + commonIdDescription,
      },
      ...taskSchema.properties,
    },
    required: ["task_id"],
  },
};

const getTeamsTool: Tool = {
  name: "clickup_get_teams",
  description: "Get all teams accessible to the authenticated user",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const getListsTool: Tool = {
  name: "clickup_get_lists",
  description: "Get all lists in a specific folder",
  inputSchema: {
    type: "object",
    properties: {
      folder_id: {
        type: "string",
        description:
          "The ID of the folder to get lists from. " + commonIdDescription,
      },
    },
    required: ["folder_id"],
  },
};

const createBoardTool: Tool = {
  name: "clickup_create_board",
  description: "Create a new board in a ClickUp space",
  inputSchema: {
    type: "object",
    properties: {
      space_id: {
        type: "string",
        description:
          "The ID of the space to create the board in. " + commonIdDescription,
      },
      name: {
        type: "string",
        description: "Board name",
      },
      content: {
        type: "string",
        description: "Board description or content",
      },
    },
    required: ["space_id", "name"],
  },
};

async function main() {
  logger.info("Starting ClickUp MCP Server...");

  const clickUpService = new ClickUpService();

  const server = new Server(
    {
      name: "ClickUp MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool calls
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      logger.debug("Received tool request:", request);

      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        switch (request.params.name) {
          case "clickup_create_task": {
            const args = request.params.arguments as Record<string, unknown>;
            if (!args.name || typeof args.name !== "string") {
              throw new Error("Task name is required and must be a string");
            }
            if (!args.list_id || typeof args.list_id !== "string") {
              throw new Error("List ID is required and must be a string");
            }
            const taskData: ClickUpTask = {
              name: args.name,
              list_id: args.list_id,
              description: args.description as string | undefined,
              status: args.status as string | undefined,
              priority: args.priority as number | undefined,
              assignees: Array.isArray(args.assignees)
                ? (args.assignees as string[])
                : undefined,
              due_date: args.due_date as string | undefined,
              time_estimate: args.time_estimate as string | undefined,
              tags: Array.isArray(args.tags)
                ? (args.tags as string[])
                : undefined,
            };
            const response = await clickUpService.createTask(taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_update_task": {
            const args = request.params.arguments as Record<string, unknown>;
            if (!args.task_id || typeof args.task_id !== "string") {
              throw new Error("Task ID is required and must be a string");
            }
            const { task_id, ...updateData } = args;
            const updates: Partial<ClickUpTask> = {
              name: updateData.name as string | undefined,
              description: updateData.description as string | undefined,
              status: updateData.status as string | undefined,
              priority: updateData.priority as number | undefined,
              assignees: Array.isArray(updateData.assignees)
                ? (updateData.assignees as string[])
                : undefined,
              due_date: updateData.due_date as string | undefined,
              time_estimate: updateData.time_estimate as string | undefined,
              tags: Array.isArray(updateData.tags)
                ? (updateData.tags as string[])
                : undefined,
            };
            const response = await clickUpService.updateTask(
              task_id as string,
              updates
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_get_teams": {
            const response = await clickUpService.getTeams();
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_get_lists": {
            const args = request.params.arguments as Record<string, unknown>;
            if (!args.folder_id || typeof args.folder_id !== "string") {
              throw new Error("Folder ID is required and must be a string");
            }
            const response = await clickUpService.getLists(args.folder_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_create_board": {
            const args = request.params.arguments as Record<string, unknown>;
            if (!args.space_id || typeof args.space_id !== "string") {
              throw new Error("Space ID is required and must be a string");
            }
            if (!args.name || typeof args.name !== "string") {
              throw new Error("Board name is required and must be a string");
            }
            const boardData: ClickUpBoard = {
              space_id: args.space_id,
              name: args.name,
              content: args.content as string | undefined,
            };
            const response = await clickUpService.createBoard(boardData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        logger.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug("Received ListToolsRequest");
    return {
      tools: [
        createTaskTool,
        updateTaskTool,
        getTeamsTool,
        getListsTool,
        createBoardTool,
      ],
    };
  });

  const transport = new StdioServerTransport();
  logger.info("Connecting server to transport...");
  await server.connect(transport);

  logger.info("ClickUp MCP Server running on stdio");
}

main().catch((error) => {
  logger.error("Fatal error in main():", error);
  process.exit(1);
});
