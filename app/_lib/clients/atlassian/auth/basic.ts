/**
 * Atlassian Basic Auth Client
 */
export class AtlassianBasicAuthConfig {
  private readonly email: string;
  private readonly apiToken: string;

  /**
   * constructor.
   *
   * @param email atlassian email.
   * @param apiToken atlassian api key.
   */
  constructor(email?: string, apiToken?: string) {
    this.email = email ?? process.env.ATLASSIAN_EMAIL ?? '';
    this.apiToken = apiToken ?? process.env.ATLASSIAN_API_TOKEN ?? '';

    if (this.email === '' || this.apiToken === '') {
      throw new Error('Invalid Atlassian email or api key.');
    }
  }

  /**
   * get Authorization Header for Basic Auth
   *
   * @returns AuthorizationHeader
   */
  getAuthorizationHeader(): string {
    return `Basic ${btoa(`${this.email}:${this.apiToken}`)}`;
  }
}
