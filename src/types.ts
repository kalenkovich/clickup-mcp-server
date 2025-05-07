// MCP Configuration Types
export interface MCPConfig {
  name: string;
  version: string;
  description: string;
  type: "server" | "tool" | "plugin";
  author: string;
  license: string;
  main: string;
  dependencies: Record<string, string>;
  configuration: {
    required: Record<string, ConfigField>;
    optional: Record<string, ConfigField>;
  };
  commands: Record<string, Command>;
  hooks?: {
    preinstall?: string;
    postinstall?: string;
  };
  logging: {
    format: "json" | "text";
    destination: string;
  };
}

interface ConfigField {
  type: "string" | "number" | "boolean";
  description: string;
  default?: any;
  enum?: string[];
}

interface Command {
  description: string;
  script: string;
  args: string[];
}

// Existing ClickUp Types
export interface ClickUpTask {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  priority?: number;
  assignees?: string[];
  due_date?: string;
  time_estimate?: string;
  list_id?: string;
  space_id?: string;
  folder_id?: string;
  tags?: string[];
}

export interface ClickUpList {
  id: string;
  name: string;
  content: string;
  status: {
    status: string;
    type: string;
    orderindex: number;
  };
}

export interface ClickUpBoard {
  id?: string;
  name: string;
  content?: string;
  space_id: string;
}

export interface ClickUpTeam {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  members: Array<{
    user: {
      id: number;
      username: string;
      email: string;
      color: string;
      profilePicture?: string;
    };
    role: number;
  }>;
}

export interface Column {
  id: string;
  name: string;
  statuses: Status[];
}

export interface Status {
  id: string;
  status: string;
  color: string;
}

// Server Configuration Types
export interface ServerConfig {
  port: number;
  logLevel: string;
}

// Update Config interface to remove OAuth part
export interface Config {
  server: ServerConfig;
  // clickUp: OAuthConfig; // Removed
  clickUpPersonalToken: string;
  clickUpApiUrl: string;
  encryptionKey: string;
}

// MCP Tool Types
export interface ToolResponse<T = any> {
  content: Array<{
    type: string;
    text: string;
  }>;
  data?: T;
}

// +++ Space Types +++
export interface ClickUpSpaceFeature {
  enabled: boolean;
  // Add other properties if needed based on API response
}

export interface ClickUpSpaceFeatures {
  due_dates?: ClickUpSpaceFeature;
  time_tracking?: ClickUpSpaceFeature;
  tags?: ClickUpSpaceFeature;
  time_estimates?: ClickUpSpaceFeature;
  checklists?: ClickUpSpaceFeature;
  custom_fields?: ClickUpSpaceFeature;
  remap_dependencies?: ClickUpSpaceFeature;
  dependency_warning?: ClickUpSpaceFeature;
  portfolios?: ClickUpSpaceFeature;
  // Add other features as they appear in API responses
}

export interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  color: string | null;
  avatar: string | null;
  admin_can_manage?: boolean;
  archived?: boolean;
  features?: ClickUpSpaceFeatures;
  // Add other relevant properties from API response (e.g., statuses, members)
}

export interface GetSpacesParams {
  team_id: string; // This is Workspace ID
  archived?: boolean;
}

export interface CreateSpaceParams {
  team_id: string; // Path parameter (Workspace ID)
  name: string;
  multiple_assignees?: boolean;
  features?: {
    due_dates?: {
      enabled: boolean;
      start_date: boolean;
      remap_due_dates: boolean;
    };
    time_tracking?: { enabled: boolean };
    tags?: { enabled: boolean };
    time_estimates?: { enabled: boolean };
    checklists?: { enabled: boolean };
    custom_fields?: { enabled: boolean };
    remap_dependencies?: { enabled: boolean };
    dependency_warning?: { enabled: boolean };
    portfolios?: { enabled: boolean };
  };
}

export interface UpdateSpaceParams {
  space_id: string; // Path parameter
  name?: string;
  color?: string | null;
  private?: boolean;
  admin_can_manage?: boolean;
  archived?: boolean;
  features?: {
    due_dates?: {
      enabled: boolean;
      start_date: boolean;
      remap_due_dates: boolean;
    };
    time_tracking?: { enabled: boolean };
    tags?: { enabled: boolean };
    time_estimates?: { enabled: boolean };
    checklists?: { enabled: boolean };
    custom_fields?: { enabled: boolean };
    remap_dependencies?: { enabled: boolean };
    dependency_warning?: { enabled: boolean };
    portfolios?: { enabled: boolean };
  };
}

export interface DeleteSpaceParams {
  space_id: string; // Path parameter
}

// +++ Folder Types +++
export interface ClickUpFolder {
  id: string;
  name: string;
  orderindex: number;
  override_statuses: boolean;
  hidden: boolean;
  space: {
    id: string;
    name: string;
    access: boolean; // true if user has access to space
  };
  task_count: string; // API returns as string
  archived: boolean;
  lists: any[]; // Define ClickUpList interface if not already present and needed here
  // Add other relevant properties from API response
}

export interface GetFoldersParams {
  space_id: string;
  archived?: boolean;
}

export interface CreateFolderParams {
  space_id: string; // Path parameter
  name: string;
}

export interface UpdateFolderParams {
  folder_id: string; // Path parameter
  name?: string;
}

export interface DeleteFolderParams {
  folder_id: string; // Path parameter
}

// Response type for operations that don't return significant data
export interface ClickUpSuccessResponse {
  // ClickUp often returns an empty object {} on success for DELETE/PUT operations.
  // This can be expanded if specific success indicators are found.
}
