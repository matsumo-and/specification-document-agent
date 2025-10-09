export interface AtlassianRestClient {
  get<T>(type: 'jira' | 'confluence', path: string): Promise<T>;
  post<T>(type: 'jira' | 'confluence', path: string, body: any): Promise<T>;
  put<T>(type: 'jira' | 'confluence', path: string, body: any): Promise<T>;
}
