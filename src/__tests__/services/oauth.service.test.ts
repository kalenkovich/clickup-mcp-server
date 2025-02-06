import { OAuthService } from "../../services/oauth.service.js";
import { config } from "../../config/app.config.js";
import axios from "axios";
import { encrypt, decrypt } from "../../security.js";
import { logger } from "../../logger.js";

// Mock axios
jest.mock("axios");
jest.mock("../../security.js");
jest.mock("../../logger.js");

describe("OAuthService", () => {
  let oauthService: OAuthService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock des fonctions de chiffrement
    (encrypt as jest.Mock).mockImplementation(
      (data: string) => `encrypted_${data}`
    );
    (decrypt as jest.Mock).mockImplementation((data: string) =>
      data.replace("encrypted_", "")
    );

    oauthService = new OAuthService(config.clickUp);
  });

  describe("generateAuthUrl", () => {
    it("should generate a valid auth URL with state", () => {
      const { url, state } = oauthService.generateAuthUrl();

      expect(url).toContain(config.clickUp.authUrl);
      expect(url).toContain("client_id=" + config.clickUp.clientId);
      expect(url).toContain(
        "redirect_uri=" + encodeURIComponent(config.clickUp.redirectUri)
      );
      expect(url).toContain("response_type=code");
      expect(url).toContain("state=" + state);
      expect(state).toHaveLength(32);
    });
  });

  describe("handleCallback", () => {
    const mockCode = "test_code";
    const mockState = "test_state";
    const mockTokenResponse = {
      data: {
        access_token: "test_access_token",
        refresh_token: "test_refresh_token",
        user: { id: "test_user_id" },
      },
    };

    it("should handle successful callback", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

      // Générer un état valide
      const { state } = oauthService.generateAuthUrl();

      const userId = await oauthService.handleCallback(mockCode, state);

      expect(userId).toBe(mockTokenResponse.data.user.id);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${config.clickUp.apiUrl}/oauth/token`,
        expect.objectContaining({
          code: mockCode,
          grant_type: "authorization_code",
        })
      );
      expect(encrypt).toHaveBeenCalled();
    });

    it("should throw error for invalid state", async () => {
      await expect(
        oauthService.handleCallback(mockCode, "invalid_state")
      ).rejects.toThrow("Invalid state parameter");
    });

    it("should handle API error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("API Error"));

      // Générer un état valide
      const { state } = oauthService.generateAuthUrl();

      await expect(
        oauthService.handleCallback(mockCode, state)
      ).rejects.toThrow("Failed to complete OAuth flow");

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("getAccessToken", () => {
    const mockTokenData = {
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_at: Date.now() + 3600000,
      team_id: "test_team_id",
    };

    it("should return valid access token", async () => {
      const userId = "test_user_id";
      const encryptedToken = encrypt(JSON.stringify(mockTokenData));
      oauthService["tokenStore"].set(userId, encryptedToken);

      const token = await oauthService.getAccessToken(userId);
      expect(token).toBe(mockTokenData.access_token);
    });

    it("should refresh expired token", async () => {
      const userId = "test_user_id";
      const expiredTokenData = {
        ...mockTokenData,
        expires_at: Date.now() - 1000,
      };

      const mockRefreshResponse = {
        data: {
          access_token: "new_access_token",
          refresh_token: "new_refresh_token",
        },
      };

      oauthService["tokenStore"].set(
        userId,
        encrypt(JSON.stringify(expiredTokenData))
      );

      mockedAxios.post.mockResolvedValueOnce(mockRefreshResponse);

      const token = await oauthService.getAccessToken(userId);

      expect(token).toBe(mockRefreshResponse.data.access_token);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${config.clickUp.apiUrl}/oauth/token`,
        expect.objectContaining({
          refresh_token: expiredTokenData.refresh_token,
          grant_type: "refresh_token",
        })
      );
    });

    it("should throw error for non-existent token", async () => {
      await expect(
        oauthService.getAccessToken("non-existent-user")
      ).rejects.toThrow("No token data found");
    });
  });

  describe("isAuthenticated", () => {
    const mockTokenData = {
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_at: Date.now() + 3600000,
      team_id: "test_team_id",
    };

    it("should return true for valid token", () => {
      const userId = "test_user_id";
      oauthService["tokenStore"].set(
        userId,
        encrypt(JSON.stringify(mockTokenData))
      );

      expect(oauthService.isAuthenticated(userId)).toBe(true);
    });

    it("should return false for expired token", () => {
      const userId = "test_user_id";
      const expiredTokenData = {
        ...mockTokenData,
        expires_at: Date.now() - 1000,
      };

      oauthService["tokenStore"].set(
        userId,
        encrypt(JSON.stringify(expiredTokenData))
      );

      expect(oauthService.isAuthenticated(userId)).toBe(false);
    });

    it("should return false for non-existent token", () => {
      expect(oauthService.isAuthenticated("non-existent-user")).toBe(false);
    });
  });
});
