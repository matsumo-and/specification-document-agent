import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { NextRequest } from 'next/server';
import { LLMService } from '@/src/services/llm.service';
import { createGitHubMcpClient } from '@/src/clients/github.mcp';
import { createAtlassianMcpClient } from '@/src/clients/atlassian.mcp';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    console.log('Received messages:', JSON.stringify(messages, null, 2));

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

    // get Atlassian tools
    let atlassianTools;
    try {
      const atlassianMcpClient = await createAtlassianMcpClient();
      atlassianTools = await atlassianMcpClient.tools();
    } catch (error) {
      console.warn('Failed to initialize Atlassian tools:', error);
      // Continue without Atlassian tools
    }

    // Get model from environment or use default
    const provider = process.env.LLM_PROVIDER || 'vertex';
    const model = process.env.LLM_MODEL || 'gemini-2.5-flash';

    // Select the appropriate model
    const llmModel =
      provider === 'bedrock'
        ? llmService['bedrock'](model)
        : llmService['vertex'](model);

    console.log(`Using provider: ${provider}, model: ${model}`);

    // Use streaming for other models
    console.log('Starting streamText...');

    // Convert UI messages to core messages format
    const modelMessages = convertToModelMessages(messages);
    console.log('Converted messages:', JSON.stringify(modelMessages, null, 2));

    const result = streamText({
      model: llmModel,
      messages: modelMessages,
      stopWhen: stepCountIs(10),
      temperature: 0.7,
      maxRetries: 3,
      tools: { ...githubTools, ...atlassianTools },
      system: `You are a helpful AI assistant with access to GitHub repositories, and Atlassian (JIRA or Confluence) contents through MCP tools.
When asked about GitHub repositories or Atlassian contents, you can use the available tools to fetch real-time information.
Always provide accurate and helpful responses based on the actual data from GitHub or Atlassian.`,
    });

    console.log('StreamText result obtained, converting to response...');

    // Use the built-in AI SDK response converter
    const response = result.toUIMessageStreamResponse();
    console.log('Response created successfully');

    console.log(response);

    return response;
  } catch (error) {
    console.error('Chat API error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
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
