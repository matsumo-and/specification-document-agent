export interface AnalyzeRequest {
  githubRepo: string // format: "owner/repo"
  jiraProjectKey: string
  llmProvider: 'bedrock' | 'vertex'
  llmModel: string
  confluenceSpaceKey?: string
}

export interface AnalyzeResponse {
  status: 'success' | 'error'
  documentUrl?: string
  error?: string
}

export interface GitHubRepository {
  owner: string
  name: string
  description?: string
  structure: FileNode[]
  readme?: string
}

export interface FileNode {
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
}

export interface JiraIssue {
  key: string
  summary: string
  description?: string
  issueType: string
  status: string
  assignee?: string
  reporter?: string
  created: string
  updated: string
  priority?: string
  labels?: string[]
  components?: string[]
}

export interface DocumentContent {
  title: string
  sections: DocumentSection[]
  metadata: {
    generatedAt: string
    githubRepo: string
    jiraProject: string
    llmProvider: string
    llmModel: string
  }
}

export interface DocumentSection {
  title: string
  content: string
  type: 'overview' | 'architecture' | 'dataflow' | 'requirements' | 'technical-details'
}
