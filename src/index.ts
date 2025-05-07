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
import {
  ClickUpTask,
  ClickUpBoard,
  GetSpacesParams,
  CreateSpaceParams,
  UpdateSpaceParams,
  GetFoldersParams,
  CreateFolderParams,
  UpdateFolderParams,
} from "./types.js";

// Tool Schemas
const commonIdDescription =
  "The unique identifier for the resource in ClickUp.";
const teamIdDescription = "The ID of the Workspace (Team) to operate on.";
const spaceIdDescription = "The ID of the Space to operate on.";
const folderIdDescription = "The ID of the Folder to operate on.";
const archivedDescription =
  "Whether to include archived items (true or false).";

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

// +++ Space Tool Definitions +++

const getSpacesTool: Tool = {
  name: "clickup_get_spaces",
  description: "Retrieves all Spaces for a given Workspace (Team).",
  inputSchema: {
    type: "object",
    properties: {
      team_id: { type: "string", description: teamIdDescription },
      archived: { type: "boolean", description: archivedDescription },
    },
    required: ["team_id"],
  },
};

const createSpaceTool: Tool = {
  name: "clickup_create_space",
  description: "Creates a new Space within a Workspace.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: { type: "string", description: teamIdDescription },
      name: { type: "string", description: "Name of the new Space." },
      multiple_assignees: {
        type: "boolean",
        description: "Allow multiple assignees for tasks in this Space.",
      },
      features: {
        type: "object",
        description:
          "Object defining features to enable/disable for the Space.",
      },
    },
    required: ["team_id", "name"],
  },
};

const getSpaceTool: Tool = {
  name: "clickup_get_space",
  description: "Retrieves details for a specific Space.",
  inputSchema: {
    type: "object",
    properties: {
      space_id: { type: "string", description: spaceIdDescription },
    },
    required: ["space_id"],
  },
};

const updateSpaceTool: Tool = {
  name: "clickup_update_space",
  description: "Updates an existing Space.",
  inputSchema: {
    type: "object",
    properties: {
      space_id: { type: "string", description: spaceIdDescription },
      name: { type: "string", description: "New name for the Space." },
      color: {
        type: "string",
        description: "New color for the Space (hex or name).",
      },
      private: {
        type: "boolean",
        description: "Set Space visibility to private.",
      },
      admin_can_manage: {
        type: "boolean",
        description: "Allow admins to manage the Space.",
      },
      archived: {
        type: "boolean",
        description: "Archive or unarchive the Space.",
      },
      features: {
        type: "object",
        description: "Object defining features to update for the Space.",
      },
    },
    required: ["space_id"],
  },
};

const deleteSpaceTool: Tool = {
  name: "clickup_delete_space",
  description: "Deletes a Space.",
  inputSchema: {
    type: "object",
    properties: {
      space_id: { type: "string", description: spaceIdDescription },
    },
    required: ["space_id"],
  },
};

// +++ Folder Tool Definitions +++

const getFoldersTool: Tool = {
  name: "clickup_get_folders",
  description: "Retrieves all Folders within a given Space.",
  inputSchema: {
    type: "object",
    properties: {
      space_id: { type: "string", description: spaceIdDescription },
      archived: { type: "boolean", description: archivedDescription },
    },
    required: ["space_id"],
  },
};

const createFolderTool: Tool = {
  name: "clickup_create_folder",
  description: "Creates a new Folder within a Space.",
  inputSchema: {
    type: "object",
    properties: {
      space_id: { type: "string", description: spaceIdDescription },
      name: { type: "string", description: "Name of the new Folder." },
    },
    required: ["space_id", "name"],
  },
};

const getFolderTool: Tool = {
  name: "clickup_get_folder",
  description: "Retrieves details for a specific Folder.",
  inputSchema: {
    type: "object",
    properties: {
      folder_id: { type: "string", description: folderIdDescription },
    },
    required: ["folder_id"],
  },
};

const updateFolderTool: Tool = {
  name: "clickup_update_folder",
  description: "Updates an existing Folder.",
  inputSchema: {
    type: "object",
    properties: {
      folder_id: { type: "string", description: folderIdDescription },
      name: { type: "string", description: "New name for the Folder." },
    },
    required: ["folder_id", "name"],
  },
};

const deleteFolderTool: Tool = {
  name: "clickup_delete_folder",
  description: "Deletes a Folder.",
  inputSchema: {
    type: "object",
    properties: {
      folder_id: { type: "string", description: folderIdDescription },
    },
    required: ["folder_id"],
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
          throw new Error("No arguments provided for tool request.");
        }

        switch (request.params.name) {
          case "clickup_create_task": {
            const args = request.params.arguments as unknown as ClickUpTask;
            if (!args.name || typeof args.name !== "string") {
              throw new Error("Task name is required and must be a string");
            }
            if (!args.list_id || typeof args.list_id !== "string") {
              throw new Error("List ID is required and must be a string");
            }
            const response = await clickUpService.createTask(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_update_task": {
            const args = request.params
              .arguments as unknown as Partial<ClickUpTask> & {
              task_id: string;
            };
            if (!args.task_id || typeof args.task_id !== "string") {
              throw new Error("Task ID is required and must be a string");
            }
            const { task_id, ...updateData } = args;
            const response = await clickUpService.updateTask(
              task_id,
              updateData
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
            const args = request.params.arguments as unknown as {
              folder_id: string;
            };
            if (!args.folder_id || typeof args.folder_id !== "string") {
              throw new Error("Folder ID is required and must be a string");
            }
            const response = await clickUpService.getLists(args.folder_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_create_board": {
            const args = request.params.arguments as unknown as ClickUpBoard;
            if (!args.space_id || typeof args.space_id !== "string") {
              throw new Error("Space ID is required and must be a string");
            }
            if (!args.name || typeof args.name !== "string") {
              throw new Error("Board name is required and must be a string");
            }
            const response = await clickUpService.createBoard(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          // +++ Space Handlers +++
          case "clickup_get_spaces": {
            const args = request.params.arguments as unknown as GetSpacesParams;
            if (!args.team_id || typeof args.team_id !== "string") {
              throw new Error("Team ID (Workspace ID) is required.");
            }
            const response = await clickUpService.getSpaces(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_create_space": {
            const args = request.params
              .arguments as unknown as CreateSpaceParams;
            if (!args.team_id || typeof args.team_id !== "string") {
              throw new Error("Team ID (Workspace ID) is required.");
            }
            if (!args.name || typeof args.name !== "string") {
              throw new Error("Space name is required.");
            }
            const response = await clickUpService.createSpace(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_get_space": {
            const args = request.params.arguments as unknown as {
              space_id: string;
            };
            if (!args.space_id || typeof args.space_id !== "string") {
              throw new Error("Space ID is required.");
            }
            const response = await clickUpService.getSpace(args.space_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_update_space": {
            const args = request.params
              .arguments as unknown as UpdateSpaceParams;
            if (!args.space_id || typeof args.space_id !== "string") {
              throw new Error("Space ID is required for update.");
            }
            const { space_id, ...updateFields } = args;
            if (Object.keys(updateFields).length === 0) {
              throw new Error("No update fields provided for space.");
            }
            const response = await clickUpService.updateSpace(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_delete_space": {
            const args = request.params.arguments as unknown as {
              space_id: string;
            };
            if (!args.space_id || typeof args.space_id !== "string") {
              throw new Error("Space ID is required for deletion.");
            }
            const response = await clickUpService.deleteSpace(args.space_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          // +++ Folder Handlers +++
          case "clickup_get_folders": {
            const args = request.params
              .arguments as unknown as GetFoldersParams;
            if (!args.space_id || typeof args.space_id !== "string") {
              throw new Error("Space ID is required to get folders.");
            }
            const response = await clickUpService.getFolders(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_create_folder": {
            const args = request.params
              .arguments as unknown as CreateFolderParams;
            if (!args.space_id || typeof args.space_id !== "string") {
              throw new Error("Space ID is required to create a folder.");
            }
            if (!args.name || typeof args.name !== "string") {
              throw new Error("Folder name is required.");
            }
            const response = await clickUpService.createFolder(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_get_folder": {
            const args = request.params.arguments as unknown as {
              folder_id: string;
            };
            if (!args.folder_id || typeof args.folder_id !== "string") {
              throw new Error("Folder ID is required.");
            }
            const response = await clickUpService.getFolder(args.folder_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_update_folder": {
            const args = request.params
              .arguments as unknown as UpdateFolderParams;
            if (!args.folder_id || typeof args.folder_id !== "string") {
              throw new Error("Folder ID is required for update.");
            }
            if (!args.name || typeof args.name !== "string") {
              throw new Error("Folder name is required for update.");
            }
            const response = await clickUpService.updateFolder(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "clickup_delete_folder": {
            const args = request.params.arguments as unknown as {
              folder_id: string;
            };
            if (!args.folder_id || typeof args.folder_id !== "string") {
              throw new Error("Folder ID is required for deletion.");
            }
            const response = await clickUpService.deleteFolder(args.folder_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: unknown) {
        logger.error("Error handling tool request:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error processing ${request.params.name}: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug("Received list tools request");
    return {
      tools: [
        createTaskTool,
        updateTaskTool,
        getTeamsTool,
        getListsTool,
        createBoardTool,
        getSpacesTool,
        createSpaceTool,
        getSpaceTool,
        updateSpaceTool,
        deleteSpaceTool,
        getFoldersTool,
        createFolderTool,
        getFolderTool,
        updateFolderTool,
        deleteFolderTool,
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
