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

// OAuth Types
export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  team_id?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiUrl: string;
  authUrl: string;
}

// Server Configuration Types
export interface ServerConfig {
  port: number;
  logLevel: string;
}

export interface Config {
  server: ServerConfig;
  clickUp: OAuthConfig;
}

// MCP Tool Types
export interface ToolResponse<T = any> {
  content: Array<{
    type: string;
    text: string;
  }>;
  data?: T;
}
