import { experimental_createMCPClient as createMCPClient } from 'ai';
import type { experimental_MCPClient as MCPClient } from 'ai';

/**
 * Atlassian MCP クライアントを作成する.
 * @deprecated 現状ユーザーに紐づいた認証しかできない & AI SDKなどがOAuth2.1への対応をしているかわからない.
 *
 * @returns Atlassian MCP Client.
 */
export const createAtlassianMcpClient = async (): Promise<MCPClient> => {
  const atlassianMcpServer = process.env.ATLASSIAN_MCP_SERVER;

  if (!atlassianMcpServer) {
    throw new Error('ATLASSIAN_MCP_SERVER environment variable is not set');
  }

  const client = await createMCPClient({
    transport: {
      type: 'sse',
      url: atlassianMcpServer,
    },
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
