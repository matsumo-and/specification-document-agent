import { streamText, generateText, convertToModelMessages } from 'ai';
import { NextRequest } from 'next/server';
import { LLMService } from '@/src/services/llm.service';
import { createGitHubMcpClient } from '@/src/clients/github.mcp';

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
      temperature: 0.7,
      maxRetries: 3,
      tools: githubTools,
      system: `You are a helpful AI assistant with access to GitHub repositories through MCP tools.
When asked about GitHub repositories, you can use the available tools to fetch real-time information.
Always provide accurate and helpful responses based on the actual data from GitHub.`,
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
