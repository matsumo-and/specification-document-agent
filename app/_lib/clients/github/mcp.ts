import { experimental_createMCPClient as createMCPClient } from 'ai';
import type { experimental_MCPClient as MCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * GitHub MCP クライアントを作成する.
 * @deprecated Cloudのみ対応.
 *
 * @returns GitHub MCP Client.
 */
export const createGitHubMcpClient = async (): Promise<MCPClient> => {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubMcpServer = process.env.GITHUB_MCP_SERVER;

  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  if (!githubMcpServer) {
    throw new Error('GITHUB_MCP_SERVER environment variable is not set');
  }

  const client = await createMCPClient({
    transport: new StreamableHTTPClientTransport(new URL(githubMcpServer), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      },
    }),
  });

  // for debug
  console.log('Available tools:', Object.keys(client.tools));

  // List tool details
  for (const [toolName, tool] of Object.entries(client.tools)) {
    console.log(`\nTool: ${toolName}`);
    console.log('Description:', (tool as any).description || 'No description');
    console.log('Parameters:', (tool as any).parameters || 'No parameters');
  }

  return client;
};
