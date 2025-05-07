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

- Implementation of an Express.js server adhering to the Model Context Protocol (though primarily run via Stdio as per index.ts).
- Integration with the ClickUp API v2 using a **Personal API Token** for authentication (prioritizing user setup simplicity).
- Provision of a comprehensive and extensible set of MCP tools for interacting with ClickUp.
- Handling of ClickUp API specifics, such as rate limiting.
- Configuration management for the ClickUp Personal API Token and server settings.

## 5. Key Features

- **Goal: Comprehensive MCP Toolset for ClickUp:** While an initial set of tools is defined (`clickup_create_task`, `clickup_update_task`, etc.), the project aims to expand this to cover the full breadth of the ClickUp API for managing spaces, documents, and other entities. **Priority for next tool expansion: Managing Spaces and Folders.**
- **MCP Toolset for ClickUp (Initial):**
  - `clickup_create_task`: Create a new task.
  - `clickup_update_task`: Update an existing task.
  - `clickup_get_teams`: Retrieve accessible Workspaces (Teams in v2 API).
  - `clickup_get_lists`: Get lists in a folder.
  - `clickup_create_board`: Create a new board.
- **Authentication:** Uses ClickUp Personal API Token provided via environment variable (`CLICKUP_PERSONAL_TOKEN`) for simplicity.
- **Rate Limiting:** Manages API request rates to ClickUp (implementation details in `ClickUpService`).

## 10. Risks & Assumptions

- **Risk:** Changes in the ClickUp API v2 could require updates. Reliance on v2 might limit future capabilities if v3 becomes necessary.
- **Risk:** Security implications of users managing and storing their Personal API Token (mitigated slightly if token is encrypted at rest by the server, though current implementation uses ephemeral key if `ENCRYPTION_KEY` not set).
- **Assumption:** Users will correctly configure the necessary `CLICKUP_PERSONAL_TOKEN` environment variable.
- **Assumption:** The `@modelcontextprotocol/sdk` provides stable and sufficient functionalities for stdio communication.

## Confidence Score: 90%

**Reasoning:** The Personal API Token authentication strategy is fully implemented in `ClickUpService`, including the Axios interceptor. This change simplifies user setup as intended. The core service logic has been successfully unit-tested with mocks, and local end-to-end testing using the MCP Inspector with `src/index.ts` (via `node --loader ts-node/esm`) has confirmed the Stdio communication and tool invocation path work correctly. The previous OAuth code has been removed. The project is now in a solid state for expanding the toolset.
