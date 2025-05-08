import axios, { AxiosInstance } from "axios";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { DocService } from "../../../services/resources/doc.service.js";
import {
  SearchDocsParams,
  ClickUpDoc,
  CreateDocParams,
  ClickUpDocPage,
  GetDocPagesParams,
  CreateDocPageParams,
  GetDocPageContentParams,
  EditDocPageContentParams,
} from "../../../types";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("DocService", () => {
  let docService: DocService;
  let mockClient: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
    mockedAxios.put.mockClear();

    mockClient = {
      get: mockedAxios.get,
      post: mockedAxios.post,
      put: mockedAxios.put,
    } as unknown as jest.Mocked<AxiosInstance>;

    docService = new DocService(mockClient);
  });

  // Test suite for searchDocs
  describe("searchDocs", () => {
    it("should search docs in a team and return doc data", async () => {
      const params: SearchDocsParams = { team_id: "team_123", query: "Report" };
      const mockDocsData: ClickUpDoc[] = [
        { id: "doc_1", name: "Quarterly Report" },
        { id: "doc_2", name: "Annual Report" },
      ];
      const mockResponse = { data: { docs: mockDocsData } };
      mockClient.get.mockResolvedValueOnce(mockResponse);

      const result = await docService.searchDocs(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/team/${params.team_id}/doc`,
        { params: { search_string: params.query } }
      );
      expect(result).toEqual(mockDocsData);
    });

    it("should include include_archived parameter when provided", async () => {
      const params: SearchDocsParams = {
        team_id: "team_123",
        include_archived: true,
      };
      const mockResponse = { data: { docs: [] } };
      mockClient.get.mockResolvedValueOnce(mockResponse);

      await docService.searchDocs(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/team/${params.team_id}/doc`,
        { params: { include_archived: true } }
      );
    });

    it("should throw an error if ClickUp API fails to search docs", async () => {
      const params: SearchDocsParams = { team_id: "team_123" };
      mockClient.get.mockRejectedValueOnce(new Error("API Error"));
      await expect(docService.searchDocs(params)).rejects.toThrow(
        `Failed to search docs in team ${params.team_id} from ClickUp`
      );
    });
  });

  // Test suite for createDoc
  describe("createDoc", () => {
    it("should create a doc in a space and return doc data", async () => {
      const params: CreateDocParams = {
        space_id: "space_456",
        name: "New Doc",
      };
      const mockResponseData: ClickUpDoc = { id: "doc_xyz", name: params.name };
      const mockResponse = { data: mockResponseData };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      const result = await docService.createDoc(params);

      expect(mockClient.post).toHaveBeenCalledWith(
        `/space/${params.space_id}/doc`,
        { name: params.name },
        {}
      );
      expect(result).toEqual(mockResponseData);
    });

    it("should throw an error if neither space_id nor team_id is provided", async () => {
      const params: CreateDocParams = { name: "Invalid Doc" };
      await expect(docService.createDoc(params)).rejects.toThrow(
        "Must provide space_id or team_id for creating a ClickUp Doc via v2 API."
      );
    });

    it("should throw an error if ClickUp API fails", async () => {
      const params: CreateDocParams = {
        space_id: "space_456",
        name: "New Doc",
      };
      mockClient.post.mockRejectedValueOnce(new Error("API Error"));
      await expect(docService.createDoc(params)).rejects.toThrow(
        `Failed to create doc in space ${params.space_id} from ClickUp`
      );
    });
  });

  // Test suite for getDocPages
  describe("getDocPages", () => {
    it("should retrieve pages for a doc and return page data", async () => {
      const params: GetDocPagesParams = { doc_id: "doc_123" };
      const mockPageData: ClickUpDocPage[] = [
        { id: "page_1", doc_id: params.doc_id, title: "Page 1", orderindex: 0 },
      ];
      const mockResponse = { data: mockPageData };
      mockClient.get.mockResolvedValueOnce(mockResponse);

      const result = await docService.getDocPages(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/doc/${params.doc_id}/page`,
        {}
      );
      expect(result).toEqual(mockPageData);
    });

    it("should throw an error if ClickUp API fails to get doc pages", async () => {
      const params: GetDocPagesParams = { doc_id: "doc_123" };
      mockClient.get.mockRejectedValueOnce(new Error("API Error"));
      await expect(docService.getDocPages(params)).rejects.toThrow(
        `Failed to retrieve pages for doc ${params.doc_id} from ClickUp`
      );
    });
  });

  // Test suite for createDocPage
  describe("createDocPage", () => {
    it("should create a page in a doc and return page data", async () => {
      const params: CreateDocPageParams = {
        doc_id: "doc_456",
        title: "New Page",
      };
      const mockResponseData: ClickUpDocPage = {
        id: "page_abc",
        doc_id: params.doc_id,
        title: params.title,
        orderindex: 0,
        content: params.content,
      };
      const mockResponse = { data: mockResponseData };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      const result = await docService.createDocPage(params);

      expect(mockClient.post).toHaveBeenCalledWith(
        `/doc/${params.doc_id}/page`,
        { title: params.title },
        {}
      );
      expect(result).toEqual(mockResponseData);
    });

    it("should throw an error if ClickUp API fails to create doc page", async () => {
      const params: CreateDocPageParams = {
        doc_id: "doc_123",
        title: "Error Page",
      };
      mockClient.post.mockRejectedValueOnce(new Error("API Error"));
      await expect(docService.createDocPage(params)).rejects.toThrow(
        `Failed to create page in doc ${params.doc_id} in ClickUp`
      );
    });
  });

  // Test suite for getDocPageContent
  describe("getDocPageContent", () => {
    it("should retrieve content for a page and return the content string", async () => {
      const params: GetDocPageContentParams = { page_id: "page_xyz" };
      const mockPageData: ClickUpDocPage = {
        id: params.page_id,
        doc_id: "doc_123",
        title: "Page",
        orderindex: 0,
        content: "# Content",
      };
      const mockResponse = { data: mockPageData };
      mockClient.get.mockResolvedValueOnce(mockResponse);

      const result = await docService.getDocPageContent(params);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/page/${params.page_id}`,
        {}
      );
      expect(result).toEqual(mockPageData.content);
    });

    it("should return empty string if page content is null", async () => {
      const params: GetDocPageContentParams = { page_id: "page_null" };
      const mockPageData: ClickUpDocPage = {
        id: params.page_id,
        doc_id: "doc_123",
        title: "Page",
        orderindex: 1,
        content: null,
      };
      const mockResponse = { data: mockPageData };
      mockClient.get.mockResolvedValueOnce(mockResponse);
      const result = await docService.getDocPageContent(params);
      expect(result).toEqual("");
    });

    it("should throw error if content field is missing or not a string", async () => {
      const params: GetDocPageContentParams = { page_id: "page_missing" };
      const mockPageData = {
        id: params.page_id,
        doc_id: "doc_123",
        title: "Page",
        orderindex: 2,
      };
      const mockResponse = { data: mockPageData as ClickUpDocPage };
      mockClient.get.mockResolvedValueOnce(mockResponse);
      await expect(docService.getDocPageContent(params)).rejects.toThrow(
        `Content not found or in unexpected format for page ${params.page_id}`
      );
    });

    it("should throw an error if ClickUp API fails to get doc page", async () => {
      const params: GetDocPageContentParams = { page_id: "page_xyz" };
      mockClient.get.mockRejectedValueOnce(new Error("API Error"));
      await expect(docService.getDocPageContent(params)).rejects.toThrow(
        `Failed to retrieve content for page ${params.page_id} from ClickUp`
      );
    });
  });

  // Test suite for editDocPageContent
  describe("editDocPageContent", () => {
    it("should update page content and return updated page data", async () => {
      const params: EditDocPageContentParams = {
        page_id: "page_edit_1",
        content: "New",
      };
      const mockResponseData: ClickUpDocPage = {
        id: params.page_id,
        doc_id: "doc_xyz",
        title: "Title",
        orderindex: 0,
        content: params.content,
      };
      const mockResponse = { data: mockResponseData };
      mockClient.put.mockResolvedValueOnce(mockResponse);

      const result = await docService.editDocPageContent(params);

      expect(mockClient.put).toHaveBeenCalledWith(
        `/page/${params.page_id}`,
        { content: params.content },
        {}
      );
      expect(result).toEqual(mockResponseData);
    });

    it("should update page content and title when title is provided", async () => {
      const params: EditDocPageContentParams = {
        page_id: "page_edit_2",
        content: "### Updates",
        title: "New Title",
      };
      const mockResponseData: ClickUpDocPage = {
        id: params.page_id,
        doc_id: "doc_abc",
        title: params.title!,
        orderindex: 1,
        content: params.content,
      };
      const mockResponse = { data: mockResponseData };
      mockClient.put.mockResolvedValueOnce(mockResponse);

      const result = await docService.editDocPageContent(params);

      expect(mockClient.put).toHaveBeenCalledWith(
        `/page/${params.page_id}`,
        { content: params.content, title: params.title },
        {}
      );
      expect(result).toEqual(mockResponseData);
    });

    it("should throw an error if ClickUp API fails to edit doc page", async () => {
      const params: EditDocPageContentParams = {
        page_id: "page_edit_err",
        content: "Err",
      };
      mockClient.put.mockRejectedValueOnce(new Error("API Error"));
      await expect(docService.editDocPageContent(params)).rejects.toThrow(
        `Failed to edit content for page ${params.page_id} in ClickUp`
      );
    });
  });
});
