import axios, {
  AxiosInstance,
  AxiosError,
  AxiosHeaders,
  RawAxiosRequestHeaders,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { encrypt, decrypt } from "../security.js";
import { logger } from "../logger.js";
import { config } from "../config/app.config.js";
import { ClickUpTask, ClickUpList, ClickUpBoard } from "../types.js";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class ClickUpService {
  private client: AxiosInstance;
  private tokenStore: Map<string, string>;

  constructor() {
    this.tokenStore = new Map();

    this.client = axios.create({
      baseURL: config.clickUp.apiUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add response interceptor for rate limiting
    this.client.interceptors.response.use(
      (response) => {
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
        if (error.response?.status === 429) {
          logger.warn("Rate limit exceeded");
        }
        return Promise.reject(error);
      }
    );
  }

  private async getToken(userId: string): Promise<string> {
    const encryptedData = this.tokenStore.get(userId);
    if (!encryptedData) {
      throw new Error("No authentication token found");
    }

    const tokenData: TokenData = JSON.parse(decrypt(encryptedData));

    if (Date.now() >= tokenData.expires_at) {
      return this.refreshToken(userId, tokenData.refresh_token);
    }

    return tokenData.access_token;
  }

  private async refreshToken(
    userId: string,
    refreshToken: string
  ): Promise<string> {
    try {
      const response = await this.client.post("/oauth/token", {
        client_id: config.clickUp.clientId,
        client_secret: config.clickUp.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });

      const { access_token, refresh_token } = response.data;
      const tokenData: TokenData = {
        access_token,
        refresh_token,
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      this.tokenStore.set(userId, encrypt(JSON.stringify(tokenData)));
      return access_token;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to refresh token: ${error.message}`);
      }
      throw new Error("Failed to refresh authentication token");
    }
  }

  private async getRequestConfig(): Promise<AxiosRequestConfig> {
    const headers = new AxiosHeaders();
    headers.set("Content-Type", "application/json");
    return { headers };
  }

  async createTask(taskData: ClickUpTask): Promise<ClickUpTask> {
    try {
      const config = await this.getRequestConfig();
      const response = await this.client.post(
        `/list/${taskData.list_id}/task`,
        taskData,
        config
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to create task: ${error.message}`);
      }
      throw new Error("Failed to create task in ClickUp");
    }
  }

  async updateTask(
    taskId: string,
    updates: Partial<ClickUpTask>
  ): Promise<ClickUpTask> {
    try {
      const config = await this.getRequestConfig();
      const response = await this.client.put(
        `/task/${taskId}`,
        updates,
        config
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to update task: ${error.message}`);
      }
      throw new Error("Failed to update task in ClickUp");
    }
  }

  async getTeams(): Promise<ClickUpList[]> {
    try {
      const config = await this.getRequestConfig();
      const response = await this.client.get("/team", config);
      return response.data.teams;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to get teams: ${error.message}`);
      }
      throw new Error("Failed to retrieve teams from ClickUp");
    }
  }

  async getLists(folderId: string): Promise<ClickUpList[]> {
    try {
      const config = await this.getRequestConfig();
      const response = await this.client.get(
        `/folder/${folderId}/list`,
        config
      );
      return response.data.lists;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to get lists: ${error.message}`);
      }
      throw new Error("Failed to retrieve lists from ClickUp");
    }
  }

  async createBoard(boardData: ClickUpBoard): Promise<ClickUpBoard> {
    try {
      const config = await this.getRequestConfig();
      const response = await this.client.post(
        `/space/${boardData.space_id}/board`,
        boardData,
        config
      );
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to create board: ${error.message}`);
      }
      throw new Error("Failed to create board in ClickUp");
    }
  }

  // Add token to store
  setToken(userId: string, tokenData: TokenData): void {
    this.tokenStore.set(userId, encrypt(JSON.stringify(tokenData)));
  }
}
