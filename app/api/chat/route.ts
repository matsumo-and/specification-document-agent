import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { LLMService } from '@/src/services/llm.service';
import { createGitHubMcpClient } from '@/src/clients/github.mcp';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Initialize services
    const llmService = new LLMService();

    // Get GitHub MCP tools
    let githubTools;
    try {
      const githubMcpClient = await createGitHubMcpClient();
      githubTools = await githubMcpClient.tools();
    } catch (error) {
      console.warn('Failed to initialize GitHub MCP tools:', error);
      // Continue without GitHub tools
    }

    // Get model from environment or use default
    const provider = process.env.LLM_PROVIDER || 'vertex';
    const model =
      process.env.LLM_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0';

    // Select the appropriate model
    const llmModel =
      provider === 'bedrock'
        ? llmService['bedrock'](model)
        : llmService['vertex'](model);

    // Stream the response
    const result = await streamText({
      model: llmModel,
      messages,
      temperature: 0.7,
      maxRetries: 3,
      ...(githubTools ? { tools: githubTools } : {}),
      system: `You are a helpful AI assistant with access to GitHub repositories through MCP tools.
When asked about GitHub repositories, you can use the available tools to fetch real-time information.
Always provide accurate and helpful responses based on the actual data from GitHub.`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
