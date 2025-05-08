import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";
import { ClickUpList } from "../types.js";

// Tool Definition
const commonIdDescription =
  "The unique identifier for the resource in ClickUp.";
export const getListsTool: Tool = {
  name: "clickup_get_lists",
  description: "Get all lists in a specific folder.",
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
  outputSchema: {
    type: "string",
    description: "A JSON string representing an array of list objects.",
  },
};

// Type for arguments
interface GetListsArgs {
  folder_id: string;
}

// Handler Function
export async function handleGetLists(
  clickUpService: ClickUpService,
  args: Record<string, unknown>
) {
  const params = args as unknown as GetListsArgs;
  if (!params.folder_id || typeof params.folder_id !== "string") {
    throw new Error("Folder ID is required and must be a string.");
  }
  logger.info(
    `Handling tool call: ${getListsTool.name} for folder ${params.folder_id}`
  );
  try {
    // Assume getLists returns ClickUpList[] directly
    const lists = await clickUpService.getLists(params.folder_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(lists, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error(`Error in ${getListsTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to get lists");
  }
}
