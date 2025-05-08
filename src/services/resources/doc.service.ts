import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";
import {
  ClickUpDoc,
  SearchDocsParams,
  CreateDocParams,
  ClickUpDocPage,
  GetDocPagesParams,
  CreateDocPageParams,
  GetDocPageContentParams,
  EditDocPageContentParams,
} from "../../types.js";

export class DocService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  // Note: ClickUp Docs API has limitations and some parts might be v3.
  // We aim for v2 where possible, but functionality might be restricted.

  async searchDocs(params: SearchDocsParams): Promise<ClickUpDoc[]> {
    const { team_id, query, include_archived } = params;
    logger.debug(
      `Searching docs in team ID: ${team_id} with query: "${query}"`
    );

    const queryParams: Record<string, string | boolean> = {};
    if (query) {
      queryParams.search_string = query; // API uses search_string
    }
    if (include_archived !== undefined) {
      queryParams.include_archived = include_archived;
    }

    try {
      const response = await this.client.get<{ docs: ClickUpDoc[] }>(
        `/team/${team_id}/doc`,
        {
          params: queryParams,
        }
      );
      return response.data.docs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          `Axios error searching docs in team ${team_id}: ${error.message}`,
          {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          }
        );
      } else if (error instanceof Error) {
        logger.error(
          `Generic error searching docs in team ${team_id}: ${error.message}`
        );
      }
      throw new Error(`Failed to search docs in team ${team_id} from ClickUp`);
    }
  }

  async createDoc(params: CreateDocParams): Promise<ClickUpDoc> {
    const { name, content, parent_id, parent_type, space_id, team_id } = params;

    let url = "";
    if (space_id) {
      url = `/space/${space_id}/doc`;
      logger.debug(
        `Creating doc in space ID: ${space_id} with name: "${name}"`
      );
    } else if (team_id) {
      url = `/team/${team_id}/doc`;
      logger.debug(`Creating doc in team ID: ${team_id} with name: "${name}"`);
    } else {
      logger.error(
        "createDoc requires either space_id or team_id to determine the API endpoint."
      );
      throw new Error(
        "Must provide space_id or team_id for creating a ClickUp Doc via v2 API."
      );
    }

    const requestBody: {
      name: string;
      content?: string;
      parent_id?: string;
      parent_type?: string;
    } = { name };
    if (content) {
      requestBody.content = content;
    }
    if (parent_id && parent_type) {
      requestBody.parent_id = parent_id;
      requestBody.parent_type = parent_type;
    }

    try {
      const response = await this.client.post<ClickUpDoc>(url, requestBody, {});
      return response.data;
    } catch (error) {
      const scope = space_id ? `space ${space_id}` : `team ${team_id}`;
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error creating doc in ${scope}: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
      } else if (error instanceof Error) {
        logger.error(
          `Generic error creating doc in ${scope}: ${error.message}`
        );
      }
      throw new Error(`Failed to create doc in ${scope} from ClickUp`);
    }
  }

  async getDocPages(params: GetDocPagesParams): Promise<ClickUpDocPage[]> {
    const { doc_id } = params;
    logger.debug(`Fetching pages for doc ID: ${doc_id}`);

    try {
      const response = await this.client.get<ClickUpDocPage[]>(
        `/doc/${doc_id}/page`,
        {}
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          `Axios error fetching pages for doc ${doc_id}: ${error.message}`,
          {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          }
        );
      } else if (error instanceof Error) {
        logger.error(
          `Generic error fetching pages for doc ${doc_id}: ${error.message}`
        );
      }
      throw new Error(
        `Failed to retrieve pages for doc ${doc_id} from ClickUp`
      );
    }
  }

  async createDocPage(params: CreateDocPageParams): Promise<ClickUpDocPage> {
    const { doc_id, title, content, orderindex } = params;
    logger.debug(`Creating page in doc ID: ${doc_id} with title: "${title}"`);

    const requestBody: {
      title: string;
      content?: string;
      orderindex?: number;
    } = { title };
    if (content) {
      requestBody.content = content;
    }
    if (orderindex !== undefined) {
      requestBody.orderindex = orderindex;
    }

    try {
      const response = await this.client.post<ClickUpDocPage>(
        `/doc/${doc_id}/page`,
        requestBody,
        {}
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          `Axios error creating page in doc ${doc_id}: ${error.message}`,
          {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          }
        );
      } else if (error instanceof Error) {
        logger.error(
          `Generic error creating page in doc ${doc_id}: ${error.message}`
        );
      }
      throw new Error(`Failed to create page in doc ${doc_id} in ClickUp`);
    }
  }

  async getDocPageContent(params: GetDocPageContentParams): Promise<string> {
    const { page_id } = params;
    logger.debug(`Fetching content for page ID: ${page_id}`);
    const specificErrorMsg = `Content not found or in unexpected format for page ${page_id}`;

    try {
      const response = await this.client.get<ClickUpDocPage>(
        `/page/${page_id}`,
        {}
      );
      if (response.data && typeof response.data.content === "string") {
        return response.data.content;
      } else if (response.data && response.data.content === null) {
        return "";
      } else {
        logger.warn(
          `Content not found or not a string for page ${page_id}. Response data: ${JSON.stringify(
            response.data
          )}`
        );
        throw new Error(specificErrorMsg);
      }
    } catch (error) {
      if (error instanceof Error && error.message === specificErrorMsg) {
        // Re-throw the specific error if it's the one we created
        throw error;
      }
      // Handle Axios errors or other generic errors
      if (axios.isAxiosError(error)) {
        logger.error(
          `Axios error fetching content for page ${page_id}: ${error.message}`,
          {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          }
        );
      } else if (error instanceof Error) {
        // For other errors not matching specificErrorMsg
        logger.error(
          `Generic error fetching content for page ${page_id}: ${error.message}`
        );
      }
      // Throw a generic error for issues not caught and re-thrown above
      throw new Error(
        `Failed to retrieve content for page ${page_id} from ClickUp`
      );
    }
  }

  async editDocPageContent(
    params: EditDocPageContentParams
  ): Promise<ClickUpDocPage> {
    const { page_id, content, title } = params;
    logger.debug(`Editing content for page ID: ${page_id}`);

    const requestBody: { content: string; title?: string } = { content };
    if (title) {
      requestBody.title = title;
    }

    try {
      const response = await this.client.put<ClickUpDocPage>(
        `/page/${page_id}`,
        requestBody,
        {}
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          `Axios error editing content for page ${page_id}: ${error.message}`,
          {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          }
        );
      } else if (error instanceof Error) {
        logger.error(
          `Generic error editing content for page ${page_id}: ${error.message}`
        );
      }
      throw new Error(`Failed to edit content for page ${page_id} in ClickUp`);
    }
  }
}
