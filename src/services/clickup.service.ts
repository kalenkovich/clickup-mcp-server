import axios, {
  AxiosInstance,
  AxiosError,
  AxiosHeaders,
  RawAxiosRequestHeaders,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
// Encryption is optional now, only if we want to encrypt the token at rest (less critical than OAuth tokens)
// import { encrypt, decrypt } from "../security.js";
import { logger } from "../logger.js";
// Import the refactored config
import { config } from "../config/app.config.js";
import {
  ClickUpTask,
  ClickUpList,
  ClickUpBoard,
  ClickUpTeam,
  GetSpacesParams,
  ClickUpSpace,
  CreateSpaceParams,
  UpdateSpaceParams,
  ClickUpSuccessResponse,
  // Folder Types
  GetFoldersParams,
  ClickUpFolder,
  CreateFolderParams,
  UpdateFolderParams,
  // DeleteFolderParams is not directly used by method signature but good to have for completeness
} from "../types.js"; // Keep ClickUpTeam for API v2 responses

// Remove TokenData interface if not used elsewhere (it was removed from types.ts)
// interface TokenData { ... }

export class ClickUpService {
  private client: AxiosInstance;
  // Remove tokenStore
  // private tokenStore: Map<string, string>;
  private personalToken: string; // Store the personal token

  constructor() {
    // Remove tokenStore initialization
    // this.tokenStore = new Map();

    // Store the personal token from config
    this.personalToken = config.clickUpPersonalToken;
    if (!this.personalToken) {
      // This should be caught by config validation, but double-check
      throw new Error(
        "ClickUp Personal API Token is missing in configuration."
      );
    }

    this.client = axios.create({
      // Use the specific API URL from the refactored config
      baseURL: config.clickUpApiUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add REQUEST interceptor for Authorization header
    this.client.interceptors.request.use(
      (axiosConfig) => {
        // Add Authorization header using the stored personal token
        axiosConfig.headers.Authorization = `${this.personalToken}`;
        // It seems ClickUp API uses the token directly, not "Bearer " prefix for personal tokens
        // axiosConfig.headers.Authorization = `Bearer ${this.personalToken}`;
        logger.debug("Added Authorization header to ClickUp request.");
        return axiosConfig;
      },
      (error) => {
        logger.error("Error adding Authorization header:", error);
        return Promise.reject(error);
      }
    );

    // Keep existing response interceptor for rate limiting
    this.client.interceptors.response.use(
      (response) => {
        // ... rate limit logging ...
        const remaining = parseInt(
          response.headers["x-ratelimit-remaining"] || "100"
        );
        const reset = parseInt(response.headers["x-ratelimit-reset"] || "0");
        logger.debug(
          `Rate limit: ${remaining} requests remaining, reset in ${reset}s`
        );
        return response;
      },
      (error: AxiosError) => {
        // ... rate limit error handling ...
        if (error.response?.status === 429) {
          logger.warn("Rate limit exceeded");
        }
        return Promise.reject(error);
      }
    );
  }

  // Remove getToken method
  // private async getToken(...) { ... }

  // Remove refreshToken method
  // private async refreshToken(...) { ... }

  // Remove setToken method
  // setToken(...) { ... }

  // Keep getRequestConfig (or simplify if only headers needed)
  private async getRequestConfig(): Promise<AxiosRequestConfig> {
    // No longer need to set Content-Type here if set in defaults
    // and Authorization is handled by interceptor
    return {}; // Return empty config, interceptor handles auth
  }

  // Remove userId parameter from methods
  async createTask(taskData: ClickUpTask): Promise<ClickUpTask> {
    try {
      // Interceptor will add auth header
      const response = await this.client.post(
        // Ensure list_id is present
        `/list/${taskData.list_id}/task`,
        taskData,
        // Pass empty config or specific options if needed beyond auth/content-type
        {}
      );
      return response.data;
    } catch (error) {
      // ... existing error handling ...
      if (error instanceof Error) {
        logger.error(`Failed to create task: ${error.message}`);
      }
      throw new Error("Failed to create task in ClickUp");
    }
  }

  // Remove userId parameter
  async updateTask(
    taskId: string,
    updates: Partial<ClickUpTask>
  ): Promise<ClickUpTask> {
    try {
      // Interceptor will add auth header
      const response = await this.client.put(`/task/${taskId}`, updates, {});
      return response.data;
    } catch (error) {
      // ... existing error handling ...
      if (error instanceof Error) {
        logger.error(`Failed to update task: ${error.message}`);
      }
      throw new Error("Failed to update task in ClickUp");
    }
  }

  // Remove userId parameter
  async getTeams(): Promise<ClickUpTeam[]> {
    // Corrected return type based on API v2
    try {
      // Interceptor will add auth header
      const response = await this.client.get("/team", {});
      // API v2 returns { teams: [...] }
      return response.data.teams;
    } catch (error) {
      // ... existing error handling ...
      if (error instanceof Error) {
        logger.error(`Failed to get teams: ${error.message}`);
      }
      throw new Error("Failed to retrieve teams from ClickUp");
    }
  }

  // Remove userId parameter
  async getLists(folderId: string): Promise<ClickUpList[]> {
    try {
      // Interceptor will add auth header
      const response = await this.client.get(`/folder/${folderId}/list`, {});
      return response.data.lists;
    } catch (error) {
      // ... existing error handling ...
      if (error instanceof Error) {
        logger.error(`Failed to get lists: ${error.message}`);
      }
      throw new Error("Failed to retrieve lists from ClickUp");
    }
  }

  // Remove userId parameter
  async createBoard(boardData: ClickUpBoard): Promise<ClickUpBoard> {
    try {
      // Interceptor will add auth header
      const response = await this.client.post(
        // Ensure space_id is present
        `/space/${boardData.space_id}/board`,
        boardData,
        {}
      );
      return response.data;
    } catch (error) {
      // ... existing error handling ...
      if (error instanceof Error) {
        logger.error(`Failed to create board: ${error.message}`);
      }
      throw new Error("Failed to create board in ClickUp");
    }
  }

  // +++ Space Management Methods +++

  async getSpaces(
    params: GetSpacesParams
  ): Promise<{ spaces: ClickUpSpace[] }> {
    try {
      const queryParams: Record<string, any> = {};
      if (params.archived !== undefined) {
        queryParams.archived = params.archived.toString();
      }

      const response = await this.client.get(`/team/${params.team_id}/space`, {
        params: queryParams,
      });
      // API v2 for Get Spaces returns { spaces: [...] }
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to get spaces for team ${params.team_id}: ${error.message}`
        );
      }
      throw new Error("Failed to retrieve spaces from ClickUp");
    }
  }

  async createSpace(params: CreateSpaceParams): Promise<ClickUpSpace> {
    try {
      // Destructure team_id from params, as it's a path parameter
      // The rest of params (name, multiple_assignees, features) is the body
      const { team_id, ...bodyParams } = params;

      const response = await this.client.post(
        `/team/${team_id}/space`,
        bodyParams
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to create space in team ${params.team_id}: ${error.message}`
        );
      }
      throw new Error("Failed to create space in ClickUp");
    }
  }

  async getSpace(space_id: string): Promise<ClickUpSpace> {
    try {
      const response = await this.client.get(`/space/${space_id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to get space ${space_id}: ${error.message}`);
      }
      throw new Error("Failed to retrieve space from ClickUp");
    }
  }

  async updateSpace(params: UpdateSpaceParams): Promise<ClickUpSpace> {
    try {
      const { space_id, ...bodyParams } = params;
      const response = await this.client.put(`/space/${space_id}`, bodyParams);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to update space ${params.space_id}: ${error.message}`
        );
      }
      throw new Error("Failed to update space in ClickUp");
    }
  }

  async deleteSpace(space_id: string): Promise<ClickUpSuccessResponse> {
    try {
      // ClickUp API for DELETE usually returns an empty object {} on success
      const response = await this.client.delete(`/space/${space_id}`);
      return response.data; // Should be {} or a specific success indicator
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to delete space ${space_id}: ${error.message}`);
      }
      throw new Error("Failed to delete space in ClickUp");
    }
  }

  // +++ Folder Management Methods +++

  async getFolders(
    params: GetFoldersParams
  ): Promise<{ folders: ClickUpFolder[] }> {
    try {
      const queryParams: Record<string, any> = {};
      if (params.archived !== undefined) {
        queryParams.archived = params.archived.toString();
      }

      const response = await this.client.get(
        `/space/${params.space_id}/folder`,
        {
          params: queryParams,
        }
      );
      // API v2 for Get Folders returns { folders: [...] }
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to get folders for space ${params.space_id}: ${error.message}`
        );
      }
      throw new Error("Failed to retrieve folders from ClickUp");
    }
  }

  async createFolder(params: CreateFolderParams): Promise<ClickUpFolder> {
    try {
      const { space_id, ...bodyParams } = params;
      const response = await this.client.post(
        `/space/${space_id}/folder`,
        bodyParams // Contains 'name'
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to create folder in space ${params.space_id}: ${error.message}`
        );
      }
      throw new Error("Failed to create folder in ClickUp");
    }
  }

  async getFolder(folder_id: string): Promise<ClickUpFolder> {
    try {
      const response = await this.client.get(`/folder/${folder_id}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to get folder ${folder_id}: ${error.message}`);
      }
      throw new Error("Failed to retrieve folder from ClickUp");
    }
  }

  async updateFolder(params: UpdateFolderParams): Promise<ClickUpFolder> {
    try {
      const { folder_id, ...bodyParams } = params;
      const response = await this.client.put(
        `/folder/${folder_id}`,
        bodyParams // Contains 'name'
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to update folder ${params.folder_id}: ${error.message}`
        );
      }
      throw new Error("Failed to update folder in ClickUp");
    }
  }

  async deleteFolder(folder_id: string): Promise<ClickUpSuccessResponse> {
    try {
      const response = await this.client.delete(`/folder/${folder_id}`);
      return response.data; // Should be {} or a specific success indicator
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to delete folder ${folder_id}: ${error.message}`);
      }
      throw new Error("Failed to delete folder in ClickUp");
    }
  }
}
