import jwt from 'jsonwebtoken';

/**
 * GitHub App OAuth Client
 * Handles authentication for GitHub Apps using JWT and Installation Access Tokens
 */
export class GitHubOAuthConfig {
  private readonly appId: string;
  private readonly privateKey: string;
  private readonly installationId: string;
  private accessToken: string | undefined = undefined;
  private expiresAt: number | undefined = undefined;

  /**
   * constructor.
   *
   * @param appId GitHub App ID
   * @param privateKey GitHub App Private Key (PEM format)
   * @param installationId GitHub App Installation ID
   */
  constructor(appId?: string, privateKey?: string, installationId?: string) {
    this.appId = appId ?? process.env.GITHUB_APP_ID ?? '';
    this.privateKey = privateKey ?? process.env.GITHUB_APP_PRIVATE_KEY ?? '';
    this.installationId =
      installationId ?? process.env.GITHUB_APP_INSTALLATION_ID ?? '';

    if (!this.appId || this.appId === '') {
      throw new Error('Invalid GitHub App ID');
    }

    if (!this.privateKey || this.privateKey === '') {
      throw new Error('Invalid GitHub App Private Key');
    }

    if (!this.installationId || this.installationId === '') {
      throw new Error('Invalid GitHub App Installation ID');
    }
  }

  /**
   * Get GitHub App Installation Access Token for REST API requests.
   *
   * @returns access token
   */
  async getAccessToken(): Promise<string> {
    // Return cached access token if not expired (with 5 minute buffer)
    if (
      this.accessToken &&
      this.expiresAt &&
      this.expiresAt > Date.now() + 5 * 60 * 1000
    ) {
      return this.accessToken;
    }

    return this.refreshToken();
  }

  /**
   * Generate JWT for GitHub App authentication
   * @returns JWT token
   */
  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued at time, 60 seconds in the past to allow for clock drift
      exp: now + 10 * 60, // JWT expiration time (10 minutes maximum)
      iss: this.appId, // GitHub App ID
    };

    return jwt.sign(payload, this.privateKey, { algorithm: 'RS256' });
  }

  /**
   * Fetch new Installation Access Token using JWT
   * @returns access token
   */
  private async refreshToken(): Promise<string> {
    try {
      // Generate JWT for authentication
      const jwtToken = this.generateJWT();

      // Request Installation Access Token
      const response = await fetch(
        `https://api.github.com/app/installations/${this.installationId}/access_tokens`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${jwtToken}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to get GitHub Installation Access Token: ${response.status} ${response.statusText} - ${errorData}`
        );
      }

      const data = await response.json();

      // Cache the token and expiration time
      this.accessToken = data.token;
      // GitHub tokens expire after 1 hour
      this.expiresAt = new Date(data.expires_at).getTime();

      return data.token;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitHub App authentication failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the current Installation ID
   * @returns installation ID
   */
  getInstallationId(): string {
    return this.installationId;
  }

  /**
   * Get the current App ID
   * @returns app ID
   */
  getAppId(): string {
    return this.appId;
  }
}
