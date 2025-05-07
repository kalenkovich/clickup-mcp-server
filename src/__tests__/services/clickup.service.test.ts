import { ClickUpService } from "../../services/clickup.service";
import { config } from "../../config/app.config";
import axios from "axios";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the entire axios module
jest.mock("axios");

// Cast axios to its mock type to allow access to mockResolvedValueOnce, etc.
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ClickUpService", () => {
  let clickUpService: ClickUpService;

  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    mockedAxios.create.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
    mockedAxios.put.mockClear();

    // More complete mock for the axios instance returned by axios.create()
    const mockAxiosInstance = {
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      get: mockedAxios.get, // Use the top-level mock for actual calls
      post: mockedAxios.post, // Use the top-level mock for actual calls
      put: mockedAxios.put, // Use the top-level mock for actual calls
      delete: mockedAxios.delete, // Use the top-level mock for actual calls
      // Add any other methods from an AxiosInstance that your service might use
    } as unknown as jest.Mocked<typeof axios>; // Cast to make TypeScript happy

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Initialize a new ClickUpService instance before each test
    clickUpService = new ClickUpService();
  });

  // Test suite for createTask
  describe("createTask", () => {
    it("should create a task and return task data", async () => {
      // Arrange
      const taskData = { list_id: "123", name: "Test Task" };
      const mockResponse = { data: { id: "xyz", ...taskData } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await clickUpService.createTask(taskData);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/list/${taskData.list_id}/task`,
        taskData,
        {} // Expecting empty config as Authorization is handled by interceptor
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if ClickUp API fails", async () => {
      // Arrange
      const taskData = { list_id: "123", name: "Test Task" };
      mockedAxios.post.mockRejectedValueOnce(new Error("ClickUp API Error"));

      // Act & Assert
      await expect(clickUpService.createTask(taskData)).rejects.toThrow(
        "Failed to create task in ClickUp"
      );
    });
  });

  // Test suite for updateTask
  describe("updateTask", () => {
    it("should update a task and return updated task data", async () => {
      // Arrange
      const taskId = "task_xyz";
      const updates = { name: "Updated Task Name" };
      const mockResponse = { data: { id: taskId, ...updates } };
      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await clickUpService.updateTask(taskId, updates);

      // Assert
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `/task/${taskId}`,
        updates,
        {}
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if ClickUp API fails during update", async () => {
      // Arrange
      const taskId = "task_xyz";
      const updates = { name: "Updated Task Name" };
      mockedAxios.put.mockRejectedValueOnce(
        new Error("ClickUp API Update Error")
      );

      // Act & Assert
      await expect(clickUpService.updateTask(taskId, updates)).rejects.toThrow(
        "Failed to update task in ClickUp"
      );
    });
  });

  // Test suite for getTeams
  describe("getTeams", () => {
    it("should retrieve teams and return team data", async () => {
      // Arrange
      const mockTeamData = [{ id: "team1", name: "Team Alpha" }];
      // ClickUp API for getTeams returns { teams: [...] }
      const mockResponse = { data: { teams: mockTeamData } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await clickUpService.getTeams();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/team`, {});
      expect(result).toEqual(mockTeamData);
    });

    it("should throw an error if ClickUp API fails to get teams", async () => {
      // Arrange
      mockedAxios.get.mockRejectedValueOnce(
        new Error("ClickUp API Get Teams Error")
      );

      // Act & Assert
      await expect(clickUpService.getTeams()).rejects.toThrow(
        "Failed to retrieve teams from ClickUp"
      );
    });
  });

  // Test suite for getLists
  describe("getLists", () => {
    it("should retrieve lists for a folder and return list data", async () => {
      // Arrange
      const folderId = "folder_abc";
      const mockListData = [{ id: "list1", name: "List Alpha" }];
      // ClickUp API for getLists returns { lists: [...] }
      const mockResponse = { data: { lists: mockListData } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await clickUpService.getLists(folderId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `/folder/${folderId}/list`,
        {}
      );
      expect(result).toEqual(mockListData);
    });

    it("should throw an error if ClickUp API fails to get lists", async () => {
      // Arrange
      const folderId = "folder_abc";
      mockedAxios.get.mockRejectedValueOnce(
        new Error("ClickUp API Get Lists Error")
      );

      // Act & Assert
      await expect(clickUpService.getLists(folderId)).rejects.toThrow(
        "Failed to retrieve lists from ClickUp"
      );
    });
  });

  // Test suite for createBoard
  describe("createBoard", () => {
    it("should create a board and return board data", async () => {
      // Arrange
      const boardData = { space_id: "space_123", name: "Test Board" };
      const mockResponse = { data: { id: "board_xyz", ...boardData } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await clickUpService.createBoard(boardData);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/space/${boardData.space_id}/board`,
        boardData,
        {}
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw an error if ClickUp API fails to create a board", async () => {
      // Arrange
      const boardData = { space_id: "space_123", name: "Test Board" };
      mockedAxios.post.mockRejectedValueOnce(
        new Error("ClickUp API Create Board Error")
      );

      // Act & Assert
      await expect(clickUpService.createBoard(boardData)).rejects.toThrow(
        "Failed to create board in ClickUp"
      );
    });
  });
});
