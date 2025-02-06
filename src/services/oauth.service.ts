import axios from "axios";
import crypto from "crypto";
import { encrypt, decrypt } from "../security.js";
import { logger } from "../logger.js";
import { TokenData, OAuthConfig } from "../types.js";

export class OAuthService {
  private tokenStore: Map<string, string>;
  private stateStore: Map<string, number>;
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
    this.tokenStore = new Map();
    this.stateStore = new Map();
  }

  generateAuthUrl(): { url: string; state: string } {
    const state = crypto.randomBytes(16).toString("hex");
    this.stateStore.set(state, Date.now());

    const url = new URL(this.config.authUrl);
    url.searchParams.append("client_id", this.config.clientId);
    url.searchParams.append("redirect_uri", this.config.redirectUri);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("state", state);

    return { url: url.toString(), state };
  }

  async handleCallback(code: string, state: string): Promise<string> {
    // Validate state
    if (!this.stateStore.has(state)) {
      throw new Error("Invalid state parameter");
    }
    this.stateStore.delete(state);

    try {
      const response = await axios.post<{
        access_token: string;
        refresh_token: string;
        user: { id: string };
      }>(`${this.config.apiUrl}/oauth/token`, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: "authorization_code",
      });

      const { access_token, refresh_token, user } = response.data;
      const tokenData: TokenData = {
        access_token,
        refresh_token,
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        team_id: user.id,
      };

      this.tokenStore.set(user.id, encrypt(JSON.stringify(tokenData)));
      return user.id;
    } catch (error) {
      logger.error("OAuth callback failed:", error);
      throw new Error("Failed to complete OAuth flow");
    }
  }

  async refreshToken(userId: string): Promise<string> {
    const encryptedData = this.tokenStore.get(userId);
    if (!encryptedData) {
      throw new Error("No token data found");
    }

    const tokenData: TokenData = JSON.parse(decrypt(encryptedData));
    if (!tokenData.refresh_token) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await axios.post<{
        access_token: string;
        refresh_token: string;
      }>(`${this.config.apiUrl}/oauth/token`, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: "refresh_token",
      });

      const { access_token, refresh_token } = response.data;
      const newTokenData: TokenData = {
        access_token,
        refresh_token,
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
        team_id: tokenData.team_id,
      };

      this.tokenStore.set(userId, encrypt(JSON.stringify(newTokenData)));
      return access_token;
    } catch (error) {
      logger.error("Token refresh failed:", error);
      throw new Error("Failed to refresh token");
    }
  }

  async getAccessToken(userId: string): Promise<string> {
    const encryptedData = this.tokenStore.get(userId);
    if (!encryptedData) {
      throw new Error("No token data found");
    }

    const tokenData: TokenData = JSON.parse(decrypt(encryptedData));
    if (Date.now() >= tokenData.expires_at) {
      return this.refreshToken(userId);
    }

    return tokenData.access_token;
  }

  isAuthenticated(userId: string): boolean {
    const encryptedData = this.tokenStore.get(userId);
    if (!encryptedData) {
      return false;
    }

    try {
      const tokenData: TokenData = JSON.parse(decrypt(encryptedData));
      return Date.now() < tokenData.expires_at;
    } catch {
      return false;
    }
  }
}
