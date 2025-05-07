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
}
