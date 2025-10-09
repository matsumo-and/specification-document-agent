import { GitHubOAuthConfig } from './auth/oauth';

/**
 * GitHub REST API Client Interface
 */
export interface GitHubRestClient {
  get<T>(path: string, params?: Record<string, any>): Promise<T>;
  post<T>(path: string, body?: any): Promise<T>;
  put<T>(path: string, body?: any): Promise<T>;
  patch<T>(path: string, body?: any): Promise<T>;
  delete(path: string): Promise<void>;
}

/**
 * GitHub API Configuration
 */
export interface GitHubApiConfig {
  appId?: string;
  privateKey?: string;
  installationId?: string;
  baseUrl?: string; // For Enterprise Server support
  apiVersion?: string;
}

/**
 * GitHub REST API Client
 * Supports both GitHub Cloud (github.com) and GitHub Enterprise Server
 */
export class GitHubApiClient implements GitHubRestClient {
  private readonly authClient: GitHubOAuthConfig;
  private readonly baseUrl: string;
  private readonly apiVersion: string;

  /**
   * Constructor
   * @param config GitHub API configuration
   */
  constructor(config?: GitHubApiConfig) {
    // Initialize OAuth client
    this.authClient = new GitHubOAuthConfig(
      config?.appId,
      config?.privateKey,
      config?.installationId
    );

    // Set base URL - support for Enterprise Server
    if (config?.baseUrl) {
      // Enterprise Server format: https://hostname/api/v3
      this.baseUrl = config.baseUrl.endsWith('/')
        ? config.baseUrl.slice(0, -1)
        : config.baseUrl;
    } else {
      // Default to GitHub Cloud
      this.baseUrl =
        process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
    }

    // API version
    this.apiVersion =
      config?.apiVersion || process.env.GITHUB_API_VERSION || '2022-11-28';
  }

  /**
   * Build full URL for API endpoint
   * @param path API path
   * @returns Full URL
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  /**
   * Build query string from parameters
   * @param params Query parameters
   * @returns Query string
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get default headers for API requests
   * @returns Headers object
   */
  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.authClient.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': this.apiVersion,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle API response
   * @param response Fetch response
   * @param path API path for error messages
   * @returns Parsed response data
   */
  private async handleResponse<T>(
    response: Response,
    path: string
  ): Promise<T> {
    if (!response.ok) {
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
        if (errorData.errors) {
          errorMessage += ` - ${JSON.stringify(errorData.errors)}`;
        }
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch {
          // Ignore if we can't get error details
        }
      }

      throw new Error(`Failed to ${response.url}: ${errorMessage}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Make a GET request to the GitHub API
   * @param path API path
   * @param params Query parameters
   * @returns Response data
   */
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(path) + this.buildQueryString(params);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response, path);
  }

  /**
   * Make a POST request to the GitHub API
   * @param path API path
   * @param body Request body
   * @returns Response data
   */
  async post<T>(path: string, body?: any): Promise<T> {
    const url = this.buildUrl(path);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, path);
  }

  /**
   * Make a PUT request to the GitHub API
   * @param path API path
   * @param body Request body
   * @returns Response data
   */
  async put<T>(path: string, body?: any): Promise<T> {
    const url = this.buildUrl(path);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, path);
  }

  /**
   * Make a PATCH request to the GitHub API
   * @param path API path
   * @param body Request body
   * @returns Response data
   */
  async patch<T>(path: string, body?: any): Promise<T> {
    const url = this.buildUrl(path);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, path);
  }

  /**
   * Make a DELETE request to the GitHub API
   * @param path API path
   * @returns void
   */
  async delete(path: string): Promise<void> {
    const url = this.buildUrl(path);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    await this.handleResponse<void>(response, path);
  }

  /**
   * Get paginated results from the GitHub API
   * @param path API path
   * @param params Query parameters
   * @param maxPages Maximum number of pages to fetch (default: 10)
   * @returns Array of all results
   */
  async getPaginated<T>(
    path: string,
    params?: Record<string, any>,
    maxPages: number = 10
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    const perPage = params?.per_page || 100;

    while (page <= maxPages) {
      const pageParams = { ...params, page, per_page: perPage };
      const pageResults = await this.get<T[]>(path, pageParams);

      if (!Array.isArray(pageResults) || pageResults.length === 0) {
        break;
      }

      results.push(...pageResults);

      if (pageResults.length < perPage) {
        break;
      }

      page++;
    }

    return results;
  }

  /**
   * Get the current installation ID
   * @returns Installation ID
   */
  getInstallationId(): string {
    return this.authClient.getInstallationId();
  }

  /**
   * Get the current app ID
   * @returns App ID
   */
  getAppId(): string {
    return this.authClient.getAppId();
  }

  /**
   * Get the base URL being used
   * @returns Base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

/**
 * Factory function to create GitHub API client
 * @param config Optional configuration
 * @returns GitHub API client instance
 */
export function createGitHubClient(config?: GitHubApiConfig): GitHubApiClient {
  return new GitHubApiClient(config);
}
