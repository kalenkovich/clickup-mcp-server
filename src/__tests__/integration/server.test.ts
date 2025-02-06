/// <reference types="jest" />
/// <reference path="../types/global.d.ts" />

import { describe, beforeEach, it, jest, expect } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import { expressApp, createServer } from "../../server.js";
import { ClickUpService } from "../../services/clickup.service.js";
import { OAuthService } from "../../services/oauth.service.js";
import { config } from "../../config/app.config.js";
import { ClickUpList, ClickUpTask } from "../../types.js";

// Mock des services
jest.mock("../../services/clickup.service.js");
jest.mock("../../services/oauth.service.js");

// Mock des instances des services
const mockClickUpService = {
  client: {},
  tokenStore: new Map(),
  getToken: jest.fn(),
  refreshToken: jest.fn(),
  getRequestConfig: jest.fn(),
  setToken: jest.fn(),
  getTeams: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  getLists: jest.fn(),
  createBoard: jest.fn(),
} as unknown as jest.Mocked<ClickUpService>;

const mockOAuthService = {
  generateAuthUrl: jest.fn(),
  handleCallback: jest.fn(),
  isAuthenticated: jest.fn(),
  getAccessToken: jest.fn(),
  tokenStore: new Map(),
} as unknown as jest.Mocked<OAuthService>;

// Mock des constructeurs
(ClickUpService as jest.Mock).mockImplementation(() => mockClickUpService);
(OAuthService as jest.Mock).mockImplementation(() => mockOAuthService);

describe("Server Integration Tests", () => {
  let app: ReturnType<typeof request>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock des méthodes d'authentification par défaut
    mockOAuthService.isAuthenticated.mockReturnValue(true);
    mockOAuthService.generateAuthUrl.mockReturnValue({
      url: "https://app.clickup.com/api?mock=true",
      state: "test-state",
    });
    mockOAuthService.handleCallback.mockResolvedValue("test-user-id");

    // Initialize supertest with the express app
    const server = createServer(mockClickUpService);
    app = request(server);
  });

  describe("Health Check", () => {
    it("should return healthy status", async () => {
      const response = await app.get("/api/health").expect(200);

      expect(response.body.status).toBe("ok");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBe("1.0.0");
    });
  });

  describe("OAuth Flow", () => {
    it("should redirect to ClickUp OAuth", async () => {
      const mockAuthUrl = "https://app.clickup.com/api?mock=true";
      mockOAuthService.generateAuthUrl.mockReturnValue({
        url: mockAuthUrl,
        state: "test-state",
      });

      const response = await app.get("/oauth/clickup/authorize").expect(302);

      expect(response.header.location).toBe(mockAuthUrl);
      expect(mockOAuthService.generateAuthUrl).toHaveBeenCalled();
    });

    it("should handle OAuth callback successfully", async () => {
      mockOAuthService.handleCallback.mockResolvedValue("test-user-id");

      const response = await app
        .get("/oauth/clickup/callback")
        .query({
          code: "test-code",
          state: "test-state",
        })
        .expect(302);

      expect(response.header.location).toBe("/oauth/success");
      expect(mockOAuthService.handleCallback).toHaveBeenCalledWith(
        "test-code",
        "test-state"
      );
    });

    it("should handle OAuth callback errors", async () => {
      mockOAuthService.handleCallback.mockRejectedValue(
        new Error("Invalid callback parameters")
      );

      const response = await app
        .get("/oauth/clickup/callback")
        .query({
          code: "invalid-code",
          state: "test-state",
        })
        .expect(500);

      expect(response.body.error).toBe("Invalid callback parameters");
    });
  });

  describe("Protected API Endpoints", () => {
    describe("GET /api/teams", () => {
      it("should return teams when authenticated", async () => {
        const mockTeams: ClickUpList[] = [
          {
            id: "team1",
            name: "Team 1",
            content: "Team 1 Content",
            status: {
              status: "active",
              type: "custom",
              orderindex: 1,
            },
          },
          {
            id: "team2",
            name: "Team 2",
            content: "Team 2 Content",
            status: {
              status: "active",
              type: "custom",
              orderindex: 2,
            },
          },
        ];

        mockOAuthService.isAuthenticated.mockReturnValue(true);
        mockClickUpService.getTeams.mockResolvedValue(mockTeams);

        const response = await app
          .get("/api/teams")
          .set("x-team-id", "test-team-id")
          .expect(200);

        expect(response.body).toEqual(mockTeams);
        expect(mockOAuthService.isAuthenticated).toHaveBeenCalledWith(
          "test-team-id"
        );
        expect(mockClickUpService.getTeams).toHaveBeenCalled();
      });

      it("should handle missing teamId", async () => {
        const response = await app.get("/api/teams").expect(400);

        expect(response.body.error).toBe("Missing or invalid teamId");
      });

      it("should handle unauthorized access", async () => {
        mockOAuthService.isAuthenticated.mockReturnValue(false);

        const response = await app
          .get("/api/teams")
          .set("x-team-id", "test-team-id")
          .expect(401);

        expect(response.body.error).toBe("Authentication required");
      });
    });

    describe("POST /api/tasks", () => {
      const mockTask: ClickUpTask = {
        name: "Test Task",
        description: "Test Description",
        list_id: "list1",
      };

      it("should create task when authenticated", async () => {
        mockOAuthService.isAuthenticated.mockReturnValue(true);
        mockClickUpService.createTask.mockResolvedValue({
          ...mockTask,
          id: "task1",
        });

        const response = await app
          .post("/api/tasks")
          .set("x-team-id", "test-team-id")
          .send({
            teamId: "test-team-id",
            listId: "list1",
            task: mockTask,
          })
          .expect(200);

        expect(response.body).toHaveProperty("id", "task1");
        expect(mockClickUpService.createTask).toHaveBeenCalledWith({
          ...mockTask,
          list_id: "list1",
        });
      });

      it("should handle missing parameters", async () => {
        mockOAuthService.isAuthenticated.mockReturnValue(true);

        const response = await app
          .post("/api/tasks")
          .set("x-team-id", "test-team-id")
          .send({})
          .expect(400);

        expect(response.body.error).toBe("Missing required parameters");
      });

      it("should handle unauthorized access", async () => {
        mockOAuthService.isAuthenticated.mockReturnValue(false);

        const response = await app
          .post("/api/tasks")
          .set("x-team-id", "test-team-id")
          .send({
            teamId: "test-team-id",
            listId: "list1",
            task: mockTask,
          })
          .expect(401);

        expect(response.body.error).toBe("Authentication required");
      });
    });
  });
});
