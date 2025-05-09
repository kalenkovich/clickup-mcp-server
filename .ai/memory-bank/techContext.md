# Technical Context: @nazruden/clickup-server

## 1. Technologies Used

**Last Updated:** $(date --iso-8601=seconds)

- **Programming Language:** TypeScript (v5.3.3, from `package.json`)
- **Runtime Environment:** Node.js (>=14.0.0, from `package.json`)
- **Core Protocol SDK:** `@modelcontextprotocol/sdk` (v0.6.0, from `package.json`). Used in `src/index.ts` for Stdio server.
- **HTTP Client:** `axios` (v1.6.7, for ClickUp API calls).
- **Authentication:** ClickUp **Personal API Token** (via `process.env.CLICKUP_PERSONAL_TOKEN`). OAuth2 dependencies/logic have been removed.
- **Environment Variables:** `dotenv` (v16.4.1), `cross-env` (v7.0.3). Key variables: `CLICKUP_PERSONAL_TOKEN`, `PORT`, `LOG_LEVEL`, `ENCRYPTION_KEY` (optional, loaded by config but unused by Personal Token auth flow).
- **Testing:**
  - Jest (v29.7.0) - Test runner for unit tests.
  - `ts-jest` (v29.1.2) - TypeScript preprocessor for Jest.
  - MCP Inspector - For local end-to-end Stdio testing.
- **Containerization:** Docker (Dockerfile and docker-compose.yml present)
- **Package Manager:** npm (inferred from `package.json`, `package-lock.json`)
- **Build System:** `tsc` (TypeScript compiler, via `tsconfig.build.json`), scripts in `package.json` (`npm run build`).
- **Development Server Tooling:** `ts-node-dev` (v2.0.0) for running `.ts` files directly during development.
- **Linting & Formatting:**
  - ESLint (v8.56.0) with `@typescript-eslint/eslint-plugin` (v6.20.0) and `@typescript-eslint/parser` (v6.20.0).
  - Prettier (v3.2.4).
- **Python:** `setup.py` and `clickup_mcp_server.egg-info/` still present. Their exact role remains unconfirmed but likely auxiliary (e.g., PyPI packaging) and not part of the core runtime.

## 2. Development Environment Setup

1.  Clone the repository.
2.  Ensure Node.js (>=14.0.0) and npm are installed.
3.  Install dependencies: `npm install`.
4.  Set up required environment variable (in an `.env` file or directly for commands):
    - `CLICKUP_PERSONAL_TOKEN`
    - Optional: `PORT`, `LOG_LEVEL`, `ENCRYPTION_KEY` (though `ENCRYPTION_KEY` is not used by the token auth).
5.  Run the development server (via stdio, for MCP client consumption): `npm run dev` (uses `ts-node-dev src/index.ts`).
6.  Test locally with MCP Inspector:
    - Command: `npx @modelcontextprotocol/inspector node --loader ts-node/esm src/index.ts`
    - Set `CLICKUP_PERSONAL_TOKEN` in the Inspector's environment variable settings for the server process or ensure it's available in the shell where the Inspector is launched if it inherits the environment.
7.  Run unit tests: `npm test`.
8.  Build for production: `npm run build`.
9.  Run in production (via stdio): `npm start` (uses `node dist/index.js`).

## 3. Technical Constraints

- Requires Node.js >=14.0.0.
- Dependent on ClickUp API availability (v2) and rate limits.
- Relies on the `@modelcontextprotocol/sdk` for MCP communication.
- Requires a valid `CLICKUP_PERSONAL_TOKEN` for operation.
- **Tool Schema Design:** Tool input schemas must adhere to specific guidelines for compatibility with target LLMs (e.g., Gemini 2.5 Pro experimental):
  - Avoid numeric enums; use `type: "number"` with detailed descriptions for constraints.
  - For variable-type inputs (like custom fields), define schema `type` as `"string"` and provide detailed formatting instructions in the description. Handlers must parse the string.
  - Use strict object definitions (`additionalProperties: false`) where possible.
  - Prefer explicit, standard JSON schema types.

## 4. Dependencies (External)

- **ClickUp API (v2):** The primary external service this server integrates with.
- **MCP Clients:** Various AI agents or systems that will consume the MCP tools provided by this server via stdio.

## 5. Code Style & Linting

- **ESLint:** Enforces code quality and style, configured via `.eslintrc.js` (expected, to be verified) and `package.json` scripts.
- **Prettier:** Used for code formatting, configured via `.prettierrc.js` (expected, to be verified) and `package.json` scripts.
- **TypeScript:** `tsconfig.json`, `tsconfig.build.json`, `tsconfig.test.json` define strict type checking and compiler options.

## 6. Key Configuration Files & Directories

- `package.json`: Defines dependencies, scripts, project metadata.
- `.env` / `.env.test`: For storing `CLICKUP_PERSONAL_TOKEN`, `PORT`, `LOG_LEVEL`, `ENCRYPTION_KEY`.
- `tsconfig.*.json`: TypeScript compiler configurations.
- `jest.config.js`: Jest testing framework configuration.
- `src/index.ts`: Main Stdio MCP server entry point.
- `src/types.ts`: Central type definitions.
- `src/config/app.config.ts`: Effective runtime config source.
- `src/services/clickup.service.ts`: Facade service instantiating resource services.
- `src/services/resources/*.service.ts`: Resource-specific service logic (API calls).
- `src/tools/*.tools.ts`: MCP tool definitions and handlers.
- `src/__tests__/setup.ts`: Jest setup file.
- `src/__tests__/services/resources/*.service.test.ts`: Unit tests for resource services.
- `src/__tests__/tools/*.tools.test.ts`: Unit tests for tool handlers (View tests pending).
- `src/security.ts`: Handles optional encryption of the token at rest (currently unused by Personal Token flow).
- ESLint/Prettier configuration files (e.g. `.eslintrc.js`, `.prettierrc.js` - to be located).

## Confidence Score: 95%

**Reasoning:** Technical implementation now aligns with Personal API Token strategy. Configuration, security (optional encryption status clarified), and service logic for auth are clear and unit-tested. Local testing with MCP Inspector is successful. Key files are updated. Express and Supertest are correctly noted as no longer primary for testing/core MCP operation.
