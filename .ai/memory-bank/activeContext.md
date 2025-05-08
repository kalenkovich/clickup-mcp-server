# Active Context: @nazruden/clickup-server

## 1. Current Focus

- Documenting recent tool schema compatibility findings and resolutions for `gemini-2.5-pro-exp-03-25` in Memory Bank files.
- Preparing `.aijournal` entry for learned schema design patterns for LLM tool usage.
- Paused implementation of unit tests for View tool handlers (`src/__tests__/tools/view.tools.test.ts`) due to complex mocking issues.

## 2. Recent Changes & Activities

- **Tool Schema Compatibility Debugging (for `gemini-2.5-pro-exp-03-25`):**

  - Investigated "incompatible argument schema" errors reported by the Gemini model for several tools.
  - Affected tools included `clickup_create_task`, `clickup_update_task` (due to shared `taskSchema`), and `clickup_set_task_custom_field_value`.
  - Employed an iterative debugging approach:
    - Stripped down `createTaskTool` schema to minimal required fields (`list_id`, `name`).
    - Systematically reintroduced fields one by one (`description`, `assignees`, `status`, `priority`, `due_date`, `time_estimate`, `tags`) to pinpoint the incompatible definition.
  - **Key Findings & Resolutions:**
    - **Numeric Enums:** The `enum: [1, 2, 3, 4]` for the `priority` field (type `number`) in `taskSchema` was identified as the primary culprit for `createTaskTool` and `updateTaskTool`.
      - **Solution:** Removed the numeric `enum`. The `type: "number"` was retained, and the `description` was enhanced to explicitly state the valid numeric inputs (1, 2, 3, 4) and their meanings. This pattern was confirmed to resolve the incompatibility.
    - **`type: "any"`:** The `value: { type: "any" }` in `setTaskCustomFieldValueTool` was problematic.
      - **Initial Fix Attempt:** Changed to `type: ["string", "number", "boolean", "array"]`. This was still incompatible.
      - **Successful Solution:** Changed `value` to `type: "string"`. The `description` was extensively updated to instruct the LLM on how to format various underlying data types (numbers, booleans, arrays, specific date formats based on `value_options.time`) into this single string type. This requires the handler function to parse the string back into the appropriate type for the ClickUp service.
    - **Loose Object Properties:** For `setTaskCustomFieldValueTool`, the `value_options` field initially had `additionalProperties: true`.
      - **Solution:** Changed to `additionalProperties: false` for a stricter schema definition, as all known properties (`time`) were explicitly defined.
  - **Tool Output Refinement:**
    - Updated tool handlers (`handleGetTeams`, `handleCreateTask`, `handleUpdateTask`) to return structured data using `content: [{ type: "json", json: <data> }]` instead of a mix of `text` and a non-standard top-level `data` field.
  - Successfully resolved the reported schema incompatibility errors for the targeted Gemini model.

- **Previous Major Refactoring (Completed):**
  - Moved service logic for Tasks, Spaces, Folders, Custom Fields, and Docs into separate files within `src/services/resources/`.
  - Moved corresponding tool definitions and handlers into separate files within `src/tools/`.
  - Updated `src/services/clickup.service.ts` and `src/index.ts` accordingly.
- **Previous Implementations (Completed):**
  - Custom Field, Document, Space, and Folder management tools fully implemented with service layer unit tests.
  - View Management service layer and tool handlers implemented; service layer unit tests completed.

## 3. Next Steps (Short-Term)

- Complete Memory Bank updates (`progress.md`, `systemPatterns.md`, `techContext.md`, `.aijournal`) reflecting the schema compatibility work.
- **Resume and complete unit tests for View tool handlers (`src/__tests__/tools/view.tools.test.ts`).**
- Update `README.md` with documentation for View tools.
- **Integration Testing:** Perform end-to-end testing of all tools, especially focusing on the newly stabilized schemas with `gemini-2.5-pro-exp-03-25` or other relevant MCP clients.
- Ensure handler functions for `setTaskCustomFieldValueTool` (and any other tools now expecting string inputs for varied data) correctly parse the string input based on context before calling the ClickUp service.

## 4. Active Decisions & Considerations

- Tool input schemas are being designed/refined for robust compatibility with specific LLMs (e.g., `gemini-2.5-pro-exp-03-25`), favoring:
  - Explicit type definitions.
  - Detailed descriptions over numeric enums (for numeric types, specify valid numbers in the description).
  - For fields that can accept multiple data types, using `type: "string"` in the schema and providing detailed formatting instructions in the description, with the handler responsible for parsing.
  - Stricter object properties (e.g., `additionalProperties: false` where appropriate).
- All tools use Personal API Token and target ClickUp API v2.
- Stdio communication is primary.
- Unit tests for service layer (`*.service.ts`) use `axios` mocks.
- Unit tests for tool handlers (`*.tools.ts`) mock the `ClickUpService` and its specific resource service methods.

## 5. Open Questions & Blockers

- **Blocker (Paused):** Complex mocking for `ClickUpService` within `src/__tests__/tools/view.tools.test.ts` causing linter errors and preventing test completion. Will revisit.
- Minor: Confirm role of Python files (`setup.py` etc.) - outstanding from previous context.

## Confidence Score: N/A

**Reasoning:** Tracks ongoing work, highlights a paused blocker, and outlines immediate next steps for documentation and testing. The resolution of schema compatibility issues is a significant step forward.
