import { spawn } from 'child_process'
import type { GitHubRepository, JiraIssue, DocumentContent } from '../types/index.js'

export class MCPService {
  private githubMcpPath: string
  private atlassianMcpPath: string

  constructor() {
    // MCP server paths - these will be created later
    this.githubMcpPath = '/Users/matsumo_and/specification-document-agent/mcp-servers/github-mcp/build/index.js'
    this.atlassianMcpPath = '/Users/matsumo_and/specification-document-agent/mcp-servers/atlassian-mcp/build/index.js'
  }

  async getGithubRepository(repoPath: string): Promise<GitHubRepository> {
    // For now, return mock data
    // TODO: Implement actual MCP communication
    const [owner, name] = repoPath.split('/')
    
    return {
      owner,
      name,
      description: 'Mock repository description',
      structure: [
        {
          path: 'README.md',
          type: 'file',
          content: '# Mock Repository\n\nThis is a mock repository for testing.'
        },
        {
          path: 'src',
          type: 'directory',
          children: [
            {
              path: 'src/index.ts',
              type: 'file',
              content: 'console.log("Hello World");'
            }
          ]
        }
      ],
      readme: '# Mock Repository\n\nThis is a mock repository for testing.'
    }
  }

  async getJiraIssues(projectKey: string): Promise<JiraIssue[]> {
    // For now, return mock data
    // TODO: Implement actual MCP communication
    return [
      {
        key: `${projectKey}-1`,
        summary: 'Implement user authentication',
        description: 'Add OAuth2 authentication to the application',
        issueType: 'Story',
        status: 'In Progress',
        assignee: 'John Doe',
        reporter: 'Jane Smith',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        priority: 'High',
        labels: ['backend', 'security'],
        components: ['Authentication']
      },
      {
        key: `${projectKey}-2`,
        summary: 'Create API documentation',
        description: 'Document all REST API endpoints',
        issueType: 'Task',
        status: 'To Do',
        assignee: 'Alice Johnson',
        reporter: 'Bob Wilson',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        priority: 'Medium',
        labels: ['documentation'],
        components: ['API']
      }
    ]
  }

  async postToConfluence(document: DocumentContent, spaceKey: string): Promise<string> {
    // For now, return mock URL
    // TODO: Implement actual MCP communication
    const mockPageId = Math.random().toString(36).substring(7)
    return `https://${process.env.ATLASSIAN_DOMAIN}/wiki/spaces/${spaceKey}/pages/${mockPageId}`
  }

  // Helper method to communicate with MCP servers via stdio
  private async callMcpServer(serverPath: string, method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const mcpProcess = spawn('node', [serverPath])
      
      let responseData = ''
      let errorData = ''

      // Send request
      const request = {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      }
      
      mcpProcess.stdin.write(JSON.stringify(request) + '\n')

      // Handle response
      mcpProcess.stdout.on('data', (data) => {
        responseData += data.toString()
      })

      mcpProcess.stderr.on('data', (data) => {
        errorData += data.toString()
      })

      mcpProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP server exited with code ${code}: ${errorData}`))
          return
        }

        try {
          const response = JSON.parse(responseData)
          if (response.error) {
            reject(new Error(response.error.message))
          } else {
            resolve(response.result)
          }
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${responseData}`))
        }
      })

      mcpProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn MCP server: ${error.message}`))
      })
    })
  }
}
