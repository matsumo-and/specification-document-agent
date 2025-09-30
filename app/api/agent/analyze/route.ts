import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DocumentService } from '@/src/services/document.service';
import { LLMService } from '@/src/services/llm.service';

// Validation schema
const analyzeSchema = z.object({
  githubRepo: z
    .string()
    .regex(/^[^\/]+\/[^\/]+$/, 'Invalid repo format. Use "owner/repo"'),
  jiraProjectKey: z.string().min(1),
  llmProvider: z.enum(['bedrock', 'vertex']),
  llmModel: z.string().min(1),
  confluenceSpaceKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = analyzeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    console.log('Starting analysis for:', data);

    // Initialize services
    const llmService = new LLMService();
    const documentService = new DocumentService();

    // Step 1: Fetch GitHub repository data via MCP
    console.log('Fetching GitHub repository data...');
    const githubData = await llmService.generateText();

    // Step 2: Fetch Jira issues via MCP
    console.log('Fetching Jira issues...');
    const jiraIssues = await mcpService.getJiraIssues(data.jiraProjectKey);

    // Step 3: Generate documentation using LLM
    console.log('Generating documentation...');
    const document = await documentService.generateDocument({
      githubData,
      jiraIssues,
      llmProvider: data.llmProvider,
      llmModel: data.llmModel,
    });

    // Step 4: Post to Confluence if space key provided
    let documentUrl: string | undefined;
    if (data.confluenceSpaceKey) {
      console.log('Posting to Confluence...');
      documentUrl = await mcpService.postToConfluence(
        document,
        data.confluenceSpaceKey
      );
    }

    return NextResponse.json({
      status: 'success',
      documentUrl,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
