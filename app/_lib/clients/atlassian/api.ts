import { AtlassianBasicAuthConfig } from './auth/basic';
import { AtlassianOAuthConfig } from './auth/oauth';
import type { AtlassianRestClient } from './type';

/**
 * Atlassian Rest API Client.
 */
export class AtlassianOAuthClient implements AtlassianRestClient {
  private readonly BASE_URL: string = 'https://api.atlassian.com/ex/';
  private readonly authClient: AtlassianOAuthConfig;
  private readonly cloudId: string;

  /**
   * constructor.
   */
  constructor() {
    this.cloudId = process.env.ATLASSIAN_CLOUD_ID ?? '';
    this.authClient = new AtlassianOAuthConfig();

    if (this.cloudId === '') {
      throw new Error('Invalid Atlassian Cloud ID');
    }
  }

  /**
   * Make a GET request to the Atlassian API.
   *
   * @param path API path.
   * @returns Response data.
   */
  public async get<T>(type: 'jira' | 'confluence', path: string): Promise<T> {
    const accessToken = await this.authClient.getAccessToken();
    const url = `${this.BASE_URL}${type}/${this.cloudId}/${path}`;
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
  public async post<T>(
    type: 'jira' | 'confluence',
    path: string,
    body: any
  ): Promise<T> {
    const accessToken = await this.authClient.getAccessToken();
    const url = `${this.BASE_URL}${type}/${this.cloudId}/${path}`;
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
  public async put<T>(
    type: 'jira' | 'confluence',
    path: string,
    body: any
  ): Promise<T> {
    const accessToken = await this.authClient.getAccessToken();
    const url = `${this.BASE_URL}${type}/${this.cloudId}/${path}`;
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

/**
 * Atlassian Rest API Client.
 */
export class AtlassianBasicAuthClient implements AtlassianRestClient {
  private readonly BASE_URL: string = 'https://api.atlassian.com/ex/';
  private readonly authClient: AtlassianBasicAuthConfig;
  private readonly cloudId: string;

  /**
   * constructor.
   */
  constructor() {
    this.cloudId = process.env.ATLASSIAN_CLOUD_ID ?? '';
    this.authClient = new AtlassianBasicAuthConfig();

    if (this.cloudId === '') {
      throw new Error('Invalid Atlassian Cloud ID');
    }
  }

  /**
   * Make a GET request to the Atlassian API.
   *
   * @param path API path.
   * @returns Response data.
   */
  public async get<T>(type: 'jira' | 'confluence', path: string): Promise<T> {
    const authorizationHeader = this.authClient.getAuthorizationHeader();
    const url = `${this.BASE_URL}${type}/${this.cloudId}/${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authorizationHeader,
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
  public async post<T>(
    type: 'jira' | 'confluence',
    path: string,
    body: any
  ): Promise<T> {
    const authorizationHeader = this.authClient.getAuthorizationHeader();
    const url = `${this.BASE_URL}${type}/${this.cloudId}/${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authorizationHeader,
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
  public async put<T>(
    type: 'jira' | 'confluence',
    path: string,
    body: any
  ): Promise<T> {
    const authorizationHeader = this.authClient.getAuthorizationHeader();
    const url = `${this.BASE_URL}${type}/${this.cloudId}/${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: authorizationHeader,
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
