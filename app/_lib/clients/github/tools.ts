import { z } from 'zod';
import { GitHubApiClient } from './api';
import type {
  GitHubRepository,
  GitHubSearchRepositoriesResponse,
  GitHubIssue,
  GitHubSearchIssuesResponse,
  GitHubPullRequest,
  GitHubBranch,
  GitHubCommit,
  GitHubUserProfile,
  GitHubToolResponse,
} from './type';

/**
 * Create GitHub tools for AI SDK
 */
export function createGitHubTools() {
  const client = new GitHubApiClient();

  return {
    // Repository Tools
    searchRepositories: {
      description: 'Search for GitHub repositories',
      inputSchema: z.object({
        query: z
          .string()
          .describe('Search query (e.g., "language:javascript stars:>1000")'),
        sort: z
          .enum(['stars', 'forks', 'updated', 'help-wanted-issues'])
          .optional()
          .describe('Sort field'),
        order: z
          .enum(['asc', 'desc'])
          .optional()
          .default('desc')
          .describe('Sort order'),
        perPage: z
          .number()
          .optional()
          .default(30)
          .describe('Results per page (max 100)'),
        page: z.number().optional().default(1).describe('Page number'),
      }),
      execute: async ({
        query,
        sort,
        order,
        perPage,
        page,
      }: {
        query: string;
        sort?: string;
        order?: string;
        perPage?: number;
        page?: number;
      }) => {
        try {
          const params: Record<string, any> = {
            q: query,
            per_page: perPage,
            page,
          };
          if (sort) params.sort = sort;
          if (order) params.order = order;

          const response = await client.get<any>(
            '/search/repositories',
            params
          );

          return {
            totalCount: response.total_count,
            incompleteResults: response.incomplete_results,
            items: response.items.map((repo: any) => ({
              id: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              owner: {
                login: repo.owner.login,
                type: repo.owner.type,
              },
              description: repo.description,
              private: repo.private,
              htmlUrl: repo.html_url,
              language: repo.language,
              stargazersCount: repo.stargazers_count,
              forksCount: repo.forks_count,
              openIssuesCount: repo.open_issues_count,
              createdAt: repo.created_at,
              updatedAt: repo.updated_at,
            })),
          };
        } catch (error) {
          return {
            error: `Failed to search repositories: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    getRepository: {
      description: 'Get details of a specific GitHub repository',
      inputSchema: z.object({
        owner: z
          .string()
          .describe('Repository owner (username or organization)'),
        repo: z.string().describe('Repository name'),
      }),
      execute: async ({ owner, repo }: { owner: string; repo: string }) => {
        try {
          const response = await client.get<any>(`/repos/${owner}/${repo}`);

          return {
            id: response.id,
            name: response.name,
            fullName: response.full_name,
            owner: {
              login: response.owner.login,
              type: response.owner.type,
            },
            description: response.description,
            private: response.private,
            htmlUrl: response.html_url,
            cloneUrl: response.clone_url,
            sshUrl: response.ssh_url,
            language: response.language,
            stargazersCount: response.stargazers_count,
            forksCount: response.forks_count,
            openIssuesCount: response.open_issues_count,
            defaultBranch: response.default_branch,
            topics: response.topics,
            createdAt: response.created_at,
            updatedAt: response.updated_at,
            pushedAt: response.pushed_at,
          };
        } catch (error) {
          return {
            error: `Failed to get repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    createRepository: {
      description: 'Create a new GitHub repository',
      inputSchema: z.object({
        name: z.string().describe('Repository name'),
        description: z.string().optional().describe('Repository description'),
        private: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether the repository is private'),
        autoInit: z
          .boolean()
          .optional()
          .default(true)
          .describe('Initialize with README'),
        gitignoreTemplate: z
          .string()
          .optional()
          .describe('Gitignore template (e.g., "Node")'),
        licenseTemplate: z
          .string()
          .optional()
          .describe('License template (e.g., "mit")'),
      }),
      execute: async ({
        name,
        description,
        private: isPrivate,
        autoInit,
        gitignoreTemplate,
        licenseTemplate,
      }: {
        name: string;
        description?: string;
        private?: boolean;
        autoInit?: boolean;
        gitignoreTemplate?: string;
        licenseTemplate?: string;
      }) => {
        try {
          const data: any = {
            name,
            private: isPrivate,
            auto_init: autoInit,
          };
          if (description) data.description = description;
          if (gitignoreTemplate) data.gitignore_template = gitignoreTemplate;
          if (licenseTemplate) data.license_template = licenseTemplate;

          const response = await client.post<any>('/user/repos', data);

          return {
            id: response.id,
            name: response.name,
            fullName: response.full_name,
            htmlUrl: response.html_url,
            cloneUrl: response.clone_url,
            sshUrl: response.ssh_url,
            private: response.private,
            createdAt: response.created_at,
          };
        } catch (error) {
          return {
            error: `Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    // Issue Tools
    searchIssues: {
      description: 'Search for GitHub issues and pull requests',
      inputSchema: z.object({
        query: z
          .string()
          .describe('Search query (e.g., "is:issue is:open label:bug")'),
        sort: z
          .enum(['created', 'updated', 'comments', 'reactions'])
          .optional()
          .describe('Sort field'),
        order: z
          .enum(['asc', 'desc'])
          .optional()
          .default('desc')
          .describe('Sort order'),
        perPage: z
          .number()
          .optional()
          .default(30)
          .describe('Results per page (max 100)'),
        page: z.number().optional().default(1).describe('Page number'),
      }),
      execute: async ({
        query,
        sort,
        order,
        perPage,
        page,
      }: {
        query: string;
        sort?: string;
        order?: string;
        perPage?: number;
        page?: number;
      }) => {
        try {
          const params: Record<string, any> = {
            q: query,
            per_page: perPage,
            page,
          };
          if (sort) params.sort = sort;
          if (order) params.order = order;

          const response = await client.get<any>('/search/issues', params);

          return {
            totalCount: response.total_count,
            incompleteResults: response.incomplete_results,
            items: response.items.map((issue: any) => ({
              id: issue.id,
              number: issue.number,
              title: issue.title,
              state: issue.state,
              user: {
                login: issue.user.login,
                type: issue.user.type,
              },
              labels: issue.labels.map((label: any) => ({
                name: label.name,
                color: label.color,
              })),
              assignees: issue.assignees.map((assignee: any) => ({
                login: assignee.login,
              })),
              comments: issue.comments,
              createdAt: issue.created_at,
              updatedAt: issue.updated_at,
              closedAt: issue.closed_at,
              htmlUrl: issue.html_url,
              pullRequest: issue.pull_request ? true : false,
            })),
          };
        } catch (error) {
          return {
            error: `Failed to search issues: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    getIssue: {
      description: 'Get details of a specific GitHub issue',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        issueNumber: z.number().describe('Issue number'),
      }),
      execute: async ({
        owner,
        repo,
        issueNumber,
      }: {
        owner: string;
        repo: string;
        issueNumber: number;
      }) => {
        try {
          const response = await client.get<any>(
            `/repos/${owner}/${repo}/issues/${issueNumber}`
          );

          return {
            id: response.id,
            number: response.number,
            title: response.title,
            body: response.body,
            state: response.state,
            user: {
              login: response.user.login,
              type: response.user.type,
            },
            labels: response.labels.map((label: any) => ({
              name: label.name,
              color: label.color,
              description: label.description,
            })),
            assignees: response.assignees.map((assignee: any) => ({
              login: assignee.login,
            })),
            milestone: response.milestone
              ? {
                  title: response.milestone.title,
                  number: response.milestone.number,
                }
              : null,
            comments: response.comments,
            createdAt: response.created_at,
            updatedAt: response.updated_at,
            closedAt: response.closed_at,
            htmlUrl: response.html_url,
          };
        } catch (error) {
          return {
            error: `Failed to get issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    createIssue: {
      description: 'Create a new GitHub issue',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        title: z.string().describe('Issue title'),
        body: z.string().optional().describe('Issue body'),
        labels: z.array(z.string()).optional().describe('Labels to add'),
        assignees: z
          .array(z.string())
          .optional()
          .describe('Usernames to assign'),
        milestone: z.number().optional().describe('Milestone number'),
      }),
      execute: async ({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
        milestone,
      }: {
        owner: string;
        repo: string;
        title: string;
        body?: string;
        labels?: string[];
        assignees?: string[];
        milestone?: number;
      }) => {
        try {
          const data: any = { title };
          if (body) data.body = body;
          if (labels) data.labels = labels;
          if (assignees) data.assignees = assignees;
          if (milestone) data.milestone = milestone;

          const response = await client.post<any>(
            `/repos/${owner}/${repo}/issues`,
            data
          );

          return {
            id: response.id,
            number: response.number,
            title: response.title,
            state: response.state,
            htmlUrl: response.html_url,
            createdAt: response.created_at,
          };
        } catch (error) {
          return {
            error: `Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    updateIssue: {
      description: 'Update an existing GitHub issue',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        issueNumber: z.number().describe('Issue number'),
        title: z.string().optional().describe('New title'),
        body: z.string().optional().describe('New body'),
        state: z.enum(['open', 'closed']).optional().describe('Issue state'),
        labels: z.array(z.string()).optional().describe('Labels to set'),
        assignees: z.array(z.string()).optional().describe('Assignees to set'),
        milestone: z
          .number()
          .nullable()
          .optional()
          .describe('Milestone number (null to remove)'),
      }),
      execute: async ({
        owner,
        repo,
        issueNumber,
        title,
        body,
        state,
        labels,
        assignees,
        milestone,
      }: {
        owner: string;
        repo: string;
        issueNumber: number;
        title?: string;
        body?: string;
        state?: 'open' | 'closed';
        labels?: string[];
        assignees?: string[];
        milestone?: number | null;
      }) => {
        try {
          const data: any = {};
          if (title !== undefined) data.title = title;
          if (body !== undefined) data.body = body;
          if (state !== undefined) data.state = state;
          if (labels !== undefined) data.labels = labels;
          if (assignees !== undefined) data.assignees = assignees;
          if (milestone !== undefined) data.milestone = milestone;

          const response = await client.patch<any>(
            `/repos/${owner}/${repo}/issues/${issueNumber}`,
            data
          );

          return {
            id: response.id,
            number: response.number,
            title: response.title,
            state: response.state,
            htmlUrl: response.html_url,
            updatedAt: response.updated_at,
          };
        } catch (error) {
          return {
            error: `Failed to update issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    // Pull Request Tools
    listPullRequests: {
      description: 'List pull requests for a repository',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        state: z
          .enum(['open', 'closed', 'all'])
          .optional()
          .default('open')
          .describe('PR state'),
        head: z.string().optional().describe('Filter by head branch'),
        base: z.string().optional().describe('Filter by base branch'),
        sort: z
          .enum(['created', 'updated', 'popularity', 'long-running'])
          .optional()
          .default('created')
          .describe('Sort field'),
        direction: z
          .enum(['asc', 'desc'])
          .optional()
          .default('desc')
          .describe('Sort direction'),
        perPage: z.number().optional().default(30).describe('Results per page'),
        page: z.number().optional().default(1).describe('Page number'),
      }),
      execute: async ({
        owner,
        repo,
        state,
        head,
        base,
        sort,
        direction,
        perPage,
        page,
      }: {
        owner: string;
        repo: string;
        state?: string;
        head?: string;
        base?: string;
        sort?: string;
        direction?: string;
        perPage?: number;
        page?: number;
      }) => {
        try {
          const params: Record<string, any> = {
            state,
            sort,
            direction,
            per_page: perPage,
            page,
          };
          if (head) params.head = head;
          if (base) params.base = base;

          const response = await client.get<any[]>(
            `/repos/${owner}/${repo}/pulls`,
            params
          );

          return {
            pullRequests: response.map((pr: any) => ({
              id: pr.id,
              number: pr.number,
              title: pr.title,
              state: pr.state,
              user: {
                login: pr.user.login,
              },
              head: {
                ref: pr.head.ref,
                sha: pr.head.sha,
              },
              base: {
                ref: pr.base.ref,
                sha: pr.base.sha,
              },
              draft: pr.draft,
              merged: pr.merged,
              mergeable: pr.mergeable,
              createdAt: pr.created_at,
              updatedAt: pr.updated_at,
              closedAt: pr.closed_at,
              mergedAt: pr.merged_at,
              htmlUrl: pr.html_url,
            })),
          };
        } catch (error) {
          return {
            error: `Failed to list pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    getPullRequest: {
      description: 'Get details of a specific pull request',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        pullNumber: z.number().describe('Pull request number'),
      }),
      execute: async ({
        owner,
        repo,
        pullNumber,
      }: {
        owner: string;
        repo: string;
        pullNumber: number;
      }) => {
        try {
          const response = await client.get<any>(
            `/repos/${owner}/${repo}/pulls/${pullNumber}`
          );

          return {
            id: response.id,
            number: response.number,
            title: response.title,
            body: response.body,
            state: response.state,
            user: {
              login: response.user.login,
            },
            head: {
              ref: response.head.ref,
              sha: response.head.sha,
              repo: response.head.repo
                ? {
                    name: response.head.repo.name,
                    fullName: response.head.repo.full_name,
                  }
                : null,
            },
            base: {
              ref: response.base.ref,
              sha: response.base.sha,
              repo: {
                name: response.base.repo.name,
                fullName: response.base.repo.full_name,
              },
            },
            draft: response.draft,
            merged: response.merged,
            mergeable: response.mergeable,
            mergeableState: response.mergeable_state,
            mergedBy: response.merged_by
              ? {
                  login: response.merged_by.login,
                }
              : null,
            comments: response.comments,
            reviewComments: response.review_comments,
            commits: response.commits,
            additions: response.additions,
            deletions: response.deletions,
            changedFiles: response.changed_files,
            createdAt: response.created_at,
            updatedAt: response.updated_at,
            closedAt: response.closed_at,
            mergedAt: response.merged_at,
            htmlUrl: response.html_url,
          };
        } catch (error) {
          return {
            error: `Failed to get pull request: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    createPullRequest: {
      description: 'Create a new pull request',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        title: z.string().describe('Pull request title'),
        head: z
          .string()
          .describe(
            'The name of the branch where your changes are implemented'
          ),
        base: z
          .string()
          .describe('The name of the branch you want the changes pulled into'),
        body: z.string().optional().describe('Pull request body'),
        draft: z
          .boolean()
          .optional()
          .default(false)
          .describe('Create as draft PR'),
      }),
      execute: async ({
        owner,
        repo,
        title,
        head,
        base,
        body,
        draft,
      }: {
        owner: string;
        repo: string;
        title: string;
        head: string;
        base: string;
        body?: string;
        draft?: boolean;
      }) => {
        try {
          const data: any = {
            title,
            head,
            base,
            draft,
          };
          if (body) data.body = body;

          const response = await client.post<any>(
            `/repos/${owner}/${repo}/pulls`,
            data
          );

          return {
            id: response.id,
            number: response.number,
            title: response.title,
            state: response.state,
            htmlUrl: response.html_url,
            createdAt: response.created_at,
          };
        } catch (error) {
          return {
            error: `Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    // User Tools
    getUser: {
      description: 'Get information about a GitHub user',
      inputSchema: z.object({
        username: z.string().describe('GitHub username'),
      }),
      execute: async ({ username }: { username: string }) => {
        try {
          const response = await client.get<any>(`/users/${username}`);

          return {
            id: response.id,
            login: response.login,
            name: response.name,
            email: response.email,
            bio: response.bio,
            company: response.company,
            location: response.location,
            blog: response.blog,
            publicRepos: response.public_repos,
            publicGists: response.public_gists,
            followers: response.followers,
            following: response.following,
            createdAt: response.created_at,
            updatedAt: response.updated_at,
            htmlUrl: response.html_url,
          };
        } catch (error) {
          return {
            error: `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    // Branch Tools
    listBranches: {
      description: 'List branches for a repository',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        protected: z
          .boolean()
          .optional()
          .describe('Filter by protected branches'),
        perPage: z.number().optional().default(30).describe('Results per page'),
        page: z.number().optional().default(1).describe('Page number'),
      }),
      execute: async ({
        owner,
        repo,
        protected: isProtected,
        perPage,
        page,
      }: {
        owner: string;
        repo: string;
        protected?: boolean;
        perPage?: number;
        page?: number;
      }) => {
        try {
          const params: Record<string, any> = {
            per_page: perPage,
            page,
          };
          if (isProtected !== undefined) params.protected = isProtected;

          const response = await client.get<any[]>(
            `/repos/${owner}/${repo}/branches`,
            params
          );

          return {
            branches: response.map((branch: any) => ({
              name: branch.name,
              commit: {
                sha: branch.commit.sha,
                url: branch.commit.url,
              },
              protected: branch.protected,
            })),
          };
        } catch (error) {
          return {
            error: `Failed to list branches: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    // Commit Tools
    listCommits: {
      description: 'List commits for a repository',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        sha: z
          .string()
          .optional()
          .describe('SHA or branch to start listing commits from'),
        path: z
          .string()
          .optional()
          .describe('Only commits containing this file path'),
        author: z
          .string()
          .optional()
          .describe('GitHub username or email address'),
        since: z
          .string()
          .optional()
          .describe('ISO 8601 date format: YYYY-MM-DDTHH:MM:SSZ'),
        until: z
          .string()
          .optional()
          .describe('ISO 8601 date format: YYYY-MM-DDTHH:MM:SSZ'),
        perPage: z.number().optional().default(30).describe('Results per page'),
        page: z.number().optional().default(1).describe('Page number'),
      }),
      execute: async ({
        owner,
        repo,
        sha,
        path,
        author,
        since,
        until,
        perPage,
        page,
      }: {
        owner: string;
        repo: string;
        sha?: string;
        path?: string;
        author?: string;
        since?: string;
        until?: string;
        perPage?: number;
        page?: number;
      }) => {
        try {
          const params: Record<string, any> = {
            per_page: perPage,
            page,
          };
          if (sha) params.sha = sha;
          if (path) params.path = path;
          if (author) params.author = author;
          if (since) params.since = since;
          if (until) params.until = until;

          const response = await client.get<any[]>(
            `/repos/${owner}/${repo}/commits`,
            params
          );

          return {
            commits: response.map((commit: any) => ({
              sha: commit.sha,
              message: commit.commit.message,
              author: {
                name: commit.commit.author.name,
                email: commit.commit.author.email,
                date: commit.commit.author.date,
              },
              committer: {
                name: commit.commit.committer.name,
                email: commit.commit.committer.email,
                date: commit.commit.committer.date,
              },
              htmlUrl: commit.html_url,
            })),
          };
        } catch (error) {
          return {
            error: `Failed to list commits: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },
  };
}
