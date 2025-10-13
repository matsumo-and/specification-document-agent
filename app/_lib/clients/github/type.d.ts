/**
 * GitHub API Type Definitions
 */

// Repository Types
export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: GitHubOwner;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  cloneUrl?: string;
  sshUrl?: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  defaultBranch?: string;
  topics?: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
}

export interface GitHubOwner {
  login: string;
  type: 'User' | 'Organization';
}

export interface GitHubSearchRepositoriesResponse {
  totalCount: number;
  incompleteResults: boolean;
  items: GitHubRepository[];
}

// Issue Types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone?: GitHubMilestone | null;
  comments: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  htmlUrl: string;
  pullRequest?: boolean;
}

export interface GitHubLabel {
  name: string;
  color: string;
  description?: string;
}

export interface GitHubUser {
  login: string;
  type?: string;
}

export interface GitHubMilestone {
  title: string;
  number: number;
}

export interface GitHubSearchIssuesResponse {
  totalCount: number;
  incompleteResults: boolean;
  items: GitHubIssue[];
}

// Pull Request Types
export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  head: GitHubPullRequestRef;
  base: GitHubPullRequestRef;
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  mergeableState?: string;
  mergedBy?: GitHubUser | null;
  comments?: number;
  reviewComments?: number;
  commits?: number;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  htmlUrl: string;
}

export interface GitHubPullRequestRef {
  ref: string;
  sha: string;
  repo?: {
    name: string;
    fullName: string;
  } | null;
}

// Branch Types
export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

// Commit Types
export interface GitHubCommit {
  sha: string;
  message: string;
  author: GitHubCommitAuthor;
  committer: GitHubCommitAuthor;
  htmlUrl: string;
}

export interface GitHubCommitAuthor {
  name: string;
  email: string;
  date: string;
}

// User Profile Types
export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

// Tool Response Types
export interface GitHubToolResponse<T = any> {
  error?: string;
  [key: string]: T | string | undefined;
}

// Tool Input Types
export interface SearchRepositoriesInput {
  query: string;
  sort?: 'stars' | 'forks' | 'updated' | 'help-wanted-issues';
  order?: 'asc' | 'desc';
  perPage?: number;
  page?: number;
}

export interface GetRepositoryInput {
  owner: string;
  repo: string;
}

export interface CreateRepositoryInput {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
}

export interface SearchIssuesInput {
  query: string;
  sort?: 'created' | 'updated' | 'comments' | 'reactions';
  order?: 'asc' | 'desc';
  perPage?: number;
  page?: number;
}

export interface GetIssueInput {
  owner: string;
  repo: string;
  issueNumber: number;
}

export interface CreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface UpdateIssueInput {
  owner: string;
  repo: string;
  issueNumber: number;
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
  milestone?: number | null;
}

export interface ListPullRequestsInput {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  head?: string;
  base?: string;
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
  perPage?: number;
  page?: number;
}

export interface GetPullRequestInput {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface CreatePullRequestInput {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
}

export interface GetUserInput {
  username: string;
}

export interface ListBranchesInput {
  owner: string;
  repo: string;
  protected?: boolean;
  perPage?: number;
  page?: number;
}

export interface ListCommitsInput {
  owner: string;
  repo: string;
  sha?: string;
  path?: string;
  author?: string;
  since?: string;
  until?: string;
  perPage?: number;
  page?: number;
}
