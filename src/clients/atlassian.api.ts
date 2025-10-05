/**
 * Atlassian Auth Client
 */
export class AtlassianAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly accessToken: string | undefined = undefined;
  private readonly expiresAt: number | undefined = undefined;

  /**
   * constructor.
   *
   * @param clientId atlassian Client ID.
   * @param clientSecret atlassian Client Secret.
   */
  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId ?? process.env.ATLASSIAN_CLIENT_ID ?? '';
    this.clientSecret =
      clientSecret ?? process.env.ATLASSIAN_CLIENT_SECRET ?? '';

    if (
      !this.clientId ||
      this.clientId === '' ||
      !this.clientSecret ||
      this.clientSecret === ''
    ) {
      throw new Error('Invalid Atlassian Client ID or Client Secret');
    }
  }

  /**
   * get Atlassian Access Token for Rest API requests.
   *
   * @returns access token.
   */
  async getAccessToken(): Promise<string> {
    // return access token if not expired.
    if (this.accessToken && this.expiresAt && this.expiresAt > Date.now()) {
      return this.accessToken;
    }

    return this.refreshToken();
  }

  /**
   * fetch new access token.
   * @returns access token.
   */
  private async refreshToken(): Promise<string> {
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get Atlassian access token: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.access_token;
  }
}

/**
 * Atlassian Rest API Client.
 */
export class AtlassianRestClient {
  private readonly authClient: AtlassianAuthClient;
  private readonly cloudId: string;
  private readonly domain: string;

  /**
   * constructor.
   */
  constructor() {
    this.cloudId = process.env.ATLASSIAN_CLOUD_ID ?? '';
    this.domain = process.env.ATLASSIAN_DOMAIN ?? '';
    this.authClient = new AtlassianAuthClient();

    if (this.cloudId === '') {
      throw new Error('Invalid Atlassian Cloud ID');
    }
    if (this.domain === '') {
      throw new Error('Invalid Atlassian Domain');
    }
  }

  /**
   * Make a GET request to the Atlassian API.
   *
   * @param path API path.
   * @returns Response data.
   */
  public async get<T>(path: string): Promise<T> {
    const accessToken = await this.authClient.getAccessToken();
    const url = `${this.domain}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to GET ${path}: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make a POST request to the Atlassian API.
   *
   * @param path API path.
   * @param body Request body.
   * @returns Response data.
   */
  public async post<T>(path: string, body: any): Promise<T> {
    const accessToken = await this.authClient.getAccessToken();
    const url = `${this.domain}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to POST ${path}: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data as Promise<T>;
  }

  /**
   * Make a PUT request to the Atlassian API.
   *
   * @param path API path.
   * @param body Request body.
   * @returns Response data.
   */
  public async put<T>(path: string, body: any): Promise<T> {
    const accessToken = await this.authClient.getAccessToken();
    const url = `${this.domain}${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to PUT ${path}: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data as Promise<T>;
  }
}
