import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DocumentService } from '@/app/_services/document.service';
import { LLMService } from '@/app/_services/llm.service';

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

    // TODO: Implement the analysis logic
    // This endpoint needs to be properly implemented with:
    // 1. GitHub data fetching via MCP
    // 2. Jira issues fetching via MCP
    // 3. Document generation using LLM
    // 4. Confluence posting if needed

    return NextResponse.json({
      status: 'success',
      message: 'Analysis endpoint is under development',
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
