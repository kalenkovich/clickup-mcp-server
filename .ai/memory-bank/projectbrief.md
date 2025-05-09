# Project Brief: @nazruden/clickup-server

## 1. Project Name

@nazruden/clickup-server (also referred to as ClickUp MCP Server)

## 2. Project Goal

The primary goal of this project is to serve as a **Model Context Protocol (MCP) server** that enables AI agents and other MCP clients to interact comprehensively with ClickUp workspaces. It aims to provide **full control over the ClickUp API**, allowing clients to achieve **complete autonomy in managing ClickUp entities** (including spaces, documents, tasks, lists, etc.). It achieves this by exposing an extensible set of defined MCP tools that translate AI agent requests into ClickUp API calls, facilitating seamless LLM (Large Language Model) integration with ClickUp.

## 3. Target Audience

MCP clients, which include:

- AI assistants (e.g., Claude for Desktop, but not limited to it).
- Any system or application designed to work with the Model Context Protocol.

## 4. Scope

- Implementation of a Node.js server adhering to the Model Context Protocol (primarily run via Stdio as per index.ts).
- Integration with the ClickUp API v2 using a **Personal API Token** for authentication.
- Provision of a comprehensive and extensible set of MCP tools for interacting with ClickUp.
- Handling of ClickUp API specifics, such as rate limiting.
- Configuration management for the ClickUp Personal API Token and server settings.
- Unit testing for service layer and potentially tool handlers.

## 5. Key Features

- **Comprehensive MCP Toolset for ClickUp:** The project provides tools covering a significant portion of ClickUp API v2 functionality.
- **MCP Toolset Implemented:**
  - **Base:** `clickup_get_teams`, `clickup_get_lists`, `clickup_create_board`
  - **Tasks:** `clickup_create_task`, `clickup_update_task`
  - **Spaces:** `clickup_get_spaces`, `clickup_create_space`, `clickup_get_space`, `clickup_update_space`, `clickup_delete_space`
  - **Folders:** `clickup_get_folders`, `clickup_create_folder`, `clickup_get_folder`, `clickup_update_folder`, `clickup_delete_folder`
  - **Custom Fields:** `clickup_get_custom_fields`, `clickup_set_task_custom_field_value`, `clickup_remove_task_custom_field_value`
  - **Docs:** `clickup_search_docs`, `clickup_create_doc`, `clickup_get_doc_pages`, `clickup_create_doc_page`, `clickup_get_doc_page_content`, `clickup_edit_doc_page_content`
  - **Views:** `clickup_get_views`, `clickup_create_view`, `clickup_get_view_details`, `clickup_update_view`, `clickup_delete_view`, `clickup_get_view_tasks` (Note: Tool handler tests pending completion).
- **Authentication:** Uses ClickUp Personal API Token provided via environment variable (`CLICKUP_PERSONAL_TOKEN`).
- **Rate Limiting:** Manages API request rates to ClickUp (logging in `ClickUpService` interceptor).
- **Refactored Structure:** Codebase organized by resource type for maintainability.

## 10. Risks & Assumptions

- **Risk:** Changes in the ClickUp API v2 could require updates. Reliance on v2 might limit future capabilities if v3 becomes necessary.
- **Risk:** Security implications of users managing and storing their Personal API Token.
- **Assumption:** Users will correctly configure the necessary `CLICKUP_PERSONAL_TOKEN` environment variable.
- **Assumption:** The `@modelcontextprotocol/sdk` provides stable and sufficient functionalities for stdio communication.

## Confidence Score: 95%

**Reasoning:** Major refactoring completed successfully. Personal API Token authentication is stable. Tool coverage significantly expanded to include Tasks, Spaces, Folders, Custom Fields, Docs, and Views (service layer). Comprehensive unit tests exist for the service layer of all implemented resources. The main pending item is completing the tool handler tests for Views. The removal of `deleteDocTool` was due to an API limitation, not a regression in implemented functionality.
