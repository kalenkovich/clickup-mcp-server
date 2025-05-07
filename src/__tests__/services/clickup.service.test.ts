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

  // +++ Test Suites for Space Management +++
  describe("Space Management", () => {
    // Test suite for getSpaces
    describe("getSpaces", () => {
      it("should retrieve spaces for a team and return space data", async () => {
        const params = { team_id: "team_123", archived: false };
        const mockSpaceData = [{ id: "space1", name: "Space Alpha" }];
        const mockResponse = { data: { spaces: mockSpaceData } };
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await clickUpService.getSpaces(params);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `/team/${params.team_id}/space`,
          { params: { archived: "false" } }
        );
        expect(result).toEqual(mockResponse.data);
      });

      it("should retrieve archived spaces if archived is true", async () => {
        const params = { team_id: "team_123", archived: true };
        // const mockSpaceData = [{ id: "space_arch", name: "Archived Space" }]; // Not needed for this check
        const mockResponse = { data: { spaces: [] } }; // Actual data doesn't matter here
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        await clickUpService.getSpaces(params);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `/team/${params.team_id}/space`,
          { params: { archived: "true" } }
        );
      });

      it("should throw an error if ClickUp API fails to get spaces", async () => {
        const params = { team_id: "team_123" };
        mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.getSpaces(params)).rejects.toThrow(
          "Failed to retrieve spaces from ClickUp"
        );
      });
    });

    // Test suite for createSpace
    describe("createSpace", () => {
      it("should create a space and return space data", async () => {
        const params = { team_id: "team_123", name: "New Space" };
        const mockResponse = { data: { id: "space_new", ...params } }; // API returns the created space object
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        const { team_id, ...bodyParams } = params;

        const result = await clickUpService.createSpace(params);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          `/team/${team_id}/space`,
          bodyParams
        );
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails to create a space", async () => {
        const params = { team_id: "team_123", name: "New Space" };
        mockedAxios.post.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.createSpace(params)).rejects.toThrow(
          "Failed to create space in ClickUp"
        );
      });
    });

    // Test suite for getSpace
    describe("getSpace", () => {
      it("should retrieve a specific space and return its data", async () => {
        const spaceId = "space_abc";
        const mockResponse = { data: { id: spaceId, name: "Specific Space" } };
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await clickUpService.getSpace(spaceId);

        expect(mockedAxios.get).toHaveBeenCalledWith(`/space/${spaceId}`);
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails to get a space", async () => {
        const spaceId = "space_abc";
        mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.getSpace(spaceId)).rejects.toThrow(
          "Failed to retrieve space from ClickUp"
        );
      });
    });

    // Test suite for updateSpace
    describe("updateSpace", () => {
      it("should update a space and return updated space data", async () => {
        const params = { space_id: "space_xyz", name: "Updated Space Name" };
        const mockResponse = {
          data: { id: params.space_id, name: params.name },
        };
        mockedAxios.put.mockResolvedValueOnce(mockResponse);
        const { space_id, ...bodyParams } = params;

        const result = await clickUpService.updateSpace(params);

        expect(mockedAxios.put).toHaveBeenCalledWith(
          `/space/${space_id}`,
          bodyParams
        );
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails during space update", async () => {
        const params = { space_id: "space_xyz", name: "Updated Space Name" };
        mockedAxios.put.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.updateSpace(params)).rejects.toThrow(
          "Failed to update space in ClickUp"
        );
      });
    });

    // Test suite for deleteSpace
    describe("deleteSpace", () => {
      it("should delete a space and return success response", async () => {
        const spaceId = "space_todelete";
        const mockResponse = { data: {} };
        mockedAxios.delete.mockResolvedValueOnce(mockResponse);

        const result = await clickUpService.deleteSpace(spaceId);

        expect(mockedAxios.delete).toHaveBeenCalledWith(`/space/${spaceId}`);
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails to delete a space", async () => {
        const spaceId = "space_todelete";
        mockedAxios.delete.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.deleteSpace(spaceId)).rejects.toThrow(
          "Failed to delete space in ClickUp"
        );
      });
    });
  }); // End of Space Management tests

  // +++ Test Suites for Folder Management +++
  describe("Folder Management", () => {
    // Test suite for getFolders
    describe("getFolders", () => {
      it("should retrieve folders for a space and return folder data", async () => {
        const params = { space_id: "space_123", archived: false };
        const mockFolderData = [{ id: "folder1", name: "Folder Alpha" }];
        const mockResponse = { data: { folders: mockFolderData } }; // API returns { folders: [...] }
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await clickUpService.getFolders(params);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `/space/${params.space_id}/folder`,
          { params: { archived: "false" } }
        );
        expect(result).toEqual(mockResponse.data); // Service returns the whole object
      });

      it("should retrieve archived folders if archived is true", async () => {
        const params = { space_id: "space_123", archived: true };
        const mockResponse = { data: { folders: [] } }; // Data itself doesn't matter for this check
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        await clickUpService.getFolders(params);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `/space/${params.space_id}/folder`,
          { params: { archived: "true" } }
        );
      });

      it("should throw an error if ClickUp API fails to get folders", async () => {
        const params = { space_id: "space_123" };
        mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.getFolders(params)).rejects.toThrow(
          "Failed to retrieve folders from ClickUp"
        );
      });
    });

    // Test suite for createFolder
    describe("createFolder", () => {
      it("should create a folder and return folder data", async () => {
        const params = { space_id: "space_123", name: "New Folder" };
        const mockResponse = { data: { id: "folder_new", ...params } }; // API returns created folder
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        const { space_id, ...bodyParams } = params;

        const result = await clickUpService.createFolder(params);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          `/space/${space_id}/folder`,
          bodyParams
        );
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails to create a folder", async () => {
        const params = { space_id: "space_123", name: "New Folder" };
        mockedAxios.post.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.createFolder(params)).rejects.toThrow(
          "Failed to create folder in ClickUp"
        );
      });
    });

    // Test suite for getFolder
    describe("getFolder", () => {
      it("should retrieve a specific folder and return its data", async () => {
        const folderId = "folder_abc";
        const mockResponse = {
          data: { id: folderId, name: "Specific Folder" },
        };
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await clickUpService.getFolder(folderId);

        expect(mockedAxios.get).toHaveBeenCalledWith(`/folder/${folderId}`);
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails to get a folder", async () => {
        const folderId = "folder_abc";
        mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.getFolder(folderId)).rejects.toThrow(
          "Failed to retrieve folder from ClickUp"
        );
      });
    });

    // Test suite for updateFolder
    describe("updateFolder", () => {
      it("should update a folder and return updated folder data", async () => {
        const params = { folder_id: "folder_xyz", name: "Updated Folder Name" };
        const mockResponse = {
          data: { id: params.folder_id, name: params.name },
        };
        mockedAxios.put.mockResolvedValueOnce(mockResponse);
        const { folder_id, ...bodyParams } = params;

        const result = await clickUpService.updateFolder(params);

        expect(mockedAxios.put).toHaveBeenCalledWith(
          `/folder/${folder_id}`,
          bodyParams
        );
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails during folder update", async () => {
        const params = { folder_id: "folder_xyz", name: "Updated Folder Name" };
        mockedAxios.put.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.updateFolder(params)).rejects.toThrow(
          "Failed to update folder in ClickUp"
        );
      });
    });

    // Test suite for deleteFolder
    describe("deleteFolder", () => {
      it("should delete a folder and return success response", async () => {
        const folderId = "folder_todelete";
        const mockResponse = { data: {} }; // ClickUp often returns empty object
        mockedAxios.delete.mockResolvedValueOnce(mockResponse);

        const result = await clickUpService.deleteFolder(folderId);

        expect(mockedAxios.delete).toHaveBeenCalledWith(`/folder/${folderId}`);
        expect(result).toEqual(mockResponse.data);
      });

      it("should throw an error if ClickUp API fails to delete a folder", async () => {
        const folderId = "folder_todelete";
        mockedAxios.delete.mockRejectedValueOnce(new Error("API Error"));
        await expect(clickUpService.deleteFolder(folderId)).rejects.toThrow(
          "Failed to delete folder in ClickUp"
        );
      });
    });
  }); // End of Folder Management tests
}); // End of ClickUpService tests
