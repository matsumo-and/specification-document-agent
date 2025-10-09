import { z } from 'zod';
import { AtlassianOAuthClient } from './api';

/**
 * Create Atlassian tools for AI SDK
 */
export function createAtlassianTools() {
  const client = new AtlassianOAuthClient();

  return {
    searchJiraIssues: {
      description: 'Search for Jira issues using JQL (Jira Query Language)',
      inputSchema: z.object({
        jql: z.string().describe('JQL query to search for issues'),
        maxResults: z
          .number()
          .optional()
          .default(50)
          .describe('Maximum number of results to return'),
        fields: z
          .array(z.string())
          .optional()
          .describe('Fields to include in the response'),
      }),
      execute: async ({
        jql,
        maxResults,
        fields,
      }: {
        jql: string;
        maxResults: number;
        fields?: string[];
      }) => {
        try {
          const fieldsParam = fields
            ? fields.join(',')
            : 'summary,status,assignee,reporter,created,updated,priority,labels,components,issuetype,description';

          const response = await client.get<any>(
            'jira',
            `rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${fieldsParam}`
          );

          return {
            total: response.total,
            issues: response.issues.map((issue: any) => ({
              key: issue.key,
              id: issue.id,
              fields: issue.fields,
              self: issue.self,
            })),
          };
        } catch (error) {
          return {
            error: `Failed to search Jira issues: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    getJiraIssue: {
      description: 'Get details of a specific Jira issue',
      inputSchema: z.object({
        issueKey: z.string().describe('The key of the issue (e.g., PROJ-123)'),
        fields: z
          .array(z.string())
          .optional()
          .describe('Fields to include in the response'),
      }),
      execute: async ({
        issueKey,
        fields,
      }: {
        issueKey: string;
        fields?: string[];
      }) => {
        try {
          const fieldsParam = fields ? `?fields=${fields.join(',')}` : '';

          const response = await client.get<any>(
            'jira',
            `rest/api/3/issue/${issueKey}${fieldsParam}`
          );

          return {
            key: response.key,
            id: response.id,
            fields: response.fields,
            self: response.self,
          };
        } catch (error) {
          return {
            error: `Failed to get Jira issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    createJiraIssue: {
      description: 'Create a new Jira issue',
      inputSchema: z.object({
        projectKey: z.string().describe('The key of the project'),
        summary: z.string().describe('Summary of the issue'),
        description: z.string().optional().describe('Description of the issue'),
        issueType: z
          .string()
          .describe('Type of issue (e.g., Bug, Task, Story)'),
        priority: z.string().optional().describe('Priority of the issue'),
        assignee: z.string().optional().describe('Account ID of the assignee'),
        labels: z.array(z.string()).optional().describe('Labels for the issue'),
        components: z
          .array(z.string())
          .optional()
          .describe('Component IDs for the issue'),
      }),
      execute: async ({
        projectKey,
        summary,
        description,
        issueType,
        priority,
        assignee,
        labels,
        components,
      }: {
        projectKey: string;
        summary: string;
        description?: string;
        issueType: string;
        priority?: string;
        assignee?: string;
        labels?: string[];
        components?: string[];
      }) => {
        try {
          const issueData: any = {
            fields: {
              project: { key: projectKey },
              summary,
              issuetype: { name: issueType },
            },
          };

          if (description) {
            issueData.fields.description = {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: description,
                    },
                  ],
                },
              ],
            };
          }

          if (priority) issueData.fields.priority = { name: priority };
          if (assignee) issueData.fields.assignee = { accountId: assignee };
          if (labels) issueData.fields.labels = labels;
          if (components)
            issueData.fields.components = components.map((id: string) => ({
              id,
            }));

          const response = await client.post<any>(
            'jira',
            'rest/api/3/issue',
            issueData
          );

          return {
            key: response.key,
            id: response.id,
            self: response.self,
          };
        } catch (error) {
          return {
            error: `Failed to create Jira issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    searchConfluenceContent: {
      description: 'Search for content in Confluence',
      inputSchema: z.object({
        cql: z.string().describe('CQL (Confluence Query Language) query'),
        limit: z
          .number()
          .optional()
          .default(25)
          .describe('Maximum number of results'),
        spaceKey: z
          .string()
          .optional()
          .describe('Limit search to specific space'),
      }),
      execute: async ({
        cql,
        limit,
        spaceKey,
      }: {
        cql: string;
        limit: number;
        spaceKey?: string;
      }) => {
        try {
          let finalCql = cql;

          if (spaceKey) {
            finalCql = `${cql} AND space="${spaceKey}"`;
          }

          const response = await client.get<any>(
            'confluence',
            `rest/api/content/search?cql=${encodeURIComponent(finalCql)}&limit=${limit}`
          );

          return {
            size: response.size,
            results: response.results.map((content: any) => ({
              id: content.id,
              type: content.type,
              status: content.status,
              title: content.title,
              space: content.space,
              version: content.version,
              webUrl: content._links.webui,
            })),
          };
        } catch (error) {
          return {
            error: `Failed to search Confluence content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    getConfluencePage: {
      description: 'Get a specific Confluence page by ID',
      inputSchema: z.object({
        pageId: z.string().describe('The ID of the Confluence page'),
        expand: z
          .array(z.string())
          .optional()
          .describe('Properties to expand (e.g., body.storage, version)'),
      }),
      execute: async ({
        pageId,
        expand,
      }: {
        pageId: string;
        expand?: string[];
      }) => {
        try {
          const expandParam = expand
            ? `?expand=${expand.join(',')}`
            : '?expand=body.storage,version';

          const response = await client.get<any>(
            'confluence',
            `rest/api/content/${pageId}${expandParam}`
          );

          return {
            id: response.id,
            type: response.type,
            status: response.status,
            title: response.title,
            space: response.space,
            version: response.version,
            body: response.body,
            webUrl: response._links.webui,
          };
        } catch (error) {
          return {
            error: `Failed to get Confluence page: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    createConfluencePage: {
      description: 'Create a new Confluence page',
      inputSchema: z.object({
        spaceKey: z.string().describe('The key of the space'),
        title: z.string().describe('Title of the page'),
        content: z
          .string()
          .describe('Content of the page in storage format (HTML)'),
        parentId: z.string().optional().describe('ID of the parent page'),
      }),
      execute: async ({
        spaceKey,
        title,
        content,
        parentId,
      }: {
        spaceKey: string;
        title: string;
        content: string;
        parentId?: string;
      }) => {
        try {
          const pageData: any = {
            type: 'page',
            title,
            space: { key: spaceKey },
            body: {
              storage: {
                value: content,
                representation: 'storage',
              },
            },
          };

          if (parentId) {
            pageData.ancestors = [{ id: parentId }];
          }

          const response = await client.post<any>(
            'confluence',
            'rest/api/content',
            pageData
          );

          return {
            id: response.id,
            type: response.type,
            status: response.status,
            title: response.title,
            space: response.space,
            version: response.version,
            webUrl: response._links.webui,
          };
        } catch (error) {
          return {
            error: `Failed to create Confluence page: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    updateConfluencePage: {
      description: 'Update an existing Confluence page',
      inputSchema: z.object({
        pageId: z.string().describe('The ID of the page to update'),
        title: z.string().describe('New title of the page'),
        content: z
          .string()
          .describe('New content of the page in storage format (HTML)'),
        version: z.number().describe('Current version number of the page'),
      }),
      execute: async ({
        pageId,
        title,
        content,
        version,
      }: {
        pageId: string;
        title: string;
        content: string;
        version: number;
      }) => {
        try {
          const updateData = {
            version: {
              number: version + 1,
            },
            title,
            type: 'page',
            body: {
              storage: {
                value: content,
                representation: 'storage',
              },
            },
          };

          const response = await client.put<any>(
            'confluence',
            `rest/api/content/${pageId}`,
            updateData
          );

          return {
            id: response.id,
            type: response.type,
            status: response.status,
            title: response.title,
            space: response.space,
            version: response.version,
            webUrl: response._links.webui,
          };
        } catch (error) {
          return {
            error: `Failed to update Confluence page: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },
  };
}
