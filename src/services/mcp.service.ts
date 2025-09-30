import { spawn } from 'child_process';
import type {
  GitHubRepository,
  JiraIssue,
  DocumentContent,
} from '../types/index';
import { createGitHubMcpClient } from '../clients/github.mcp';
import type { experimental_MCPClient as MCPClient } from 'ai';
import { LLMService } from './llm.service';

export class MCPService {
  private githubMcpClient: MCPClient | null = null;
  private llmService: LLMService | null = null;

  async getGithubRepository(repoPath: string): Promise<GitHubRepository> {
    try {
      // LLMServiceを初期化（まだ初期化されていない場合）
      if (!this.llmService) {
        this.llmService = new LLMService();
      }

      // GitHub MCPツールを取得
      const githubTools = (await createGitHubMcpClient()).tools;

      // リポジトリパスを分解
      const [owner, name] = repoPath.split('/');

      // LLMを使用してGitHubリポジトリ情報を取得
      const prompt = `
        Using the GitHub tools, please retrieve the following information for the repository ${owner}/${name}:
        1. Repository description
        2. Repository structure (files and directories)
        3. README content

        Please use the appropriate GitHub MCP tools to fetch this information and return it in a structured format.
      `;

      const result = await this.llmService.generateText({
        provider: 'bedrock',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0',
        prompt,
        systemPrompt:
          'You are a helpful assistant that uses GitHub MCP tools to retrieve repository information. Always use the available tools to fetch real data from GitHub.',
        tools: githubTools,
      });

      // 結果をパースして GitHubRepository 型に変換
      // 実際のツール呼び出し結果に基づいて適切な形式に変換する必要があります
      // ここでは仮の実装として、取得した情報を構造化します

      // TODO: 実際のツール呼び出し結果に基づいて、適切なパースロジックを実装
      // 現時点では、LLMの応答から必要な情報を抽出する必要があります

      return {
        owner,
        name,
        description: 'Repository description from GitHub MCP tools',
        structure: [
          {
            path: 'README.md',
            type: 'file',
            content: 'README content from GitHub MCP tools',
          },
        ],
        readme: 'README content from GitHub MCP tools',
      };
    } catch (error) {
      console.error('Failed to get GitHub repository:', error);
      throw new Error(
        `Failed to get GitHub repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
        components: ['Authentication'],
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
        components: ['API'],
      },
    ];
  }

  async postToConfluence(
    document: DocumentContent,
    spaceKey: string
  ): Promise<string> {
    // For now, return mock URL
    // TODO: Implement actual MCP communication
    const mockPageId = Math.random().toString(36).substring(7);
    return `https://${process.env.ATLASSIAN_DOMAIN}/wiki/spaces/${spaceKey}/pages/${mockPageId}`;
  }

  // Helper method to communicate with MCP servers via stdio
  private async callMcpServer(
    serverPath: string,
    method: string,
    params: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const mcpProcess = spawn('node', [serverPath]);

      let responseData = '';
      let errorData = '';

      // Send request
      const request = {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now(),
      };

      mcpProcess.stdin.write(JSON.stringify(request) + '\n');

      // Handle response
      mcpProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(`MCP server exited with code ${code}: ${errorData}`)
          );
          return;
        }

        try {
          const response = JSON.parse(responseData);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${responseData}`));
        }
      });

      mcpProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn MCP server: ${error.message}`));
      });
    });
  }
}
