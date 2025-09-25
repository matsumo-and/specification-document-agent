import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AnalyzeRequest, AnalyzeResponse } from '../types/index.js'
import { LLMService } from '../services/llm.service.js'
import { MCPService } from '../services/mcp.service.js'
import { DocumentService } from '../services/document.service.js'

const agent = new Hono()

// Validation schema
const analyzeSchema = z.object({
  githubRepo: z.string().regex(/^[^\/]+\/[^\/]+$/, 'Invalid repo format. Use "owner/repo"'),
  jiraProjectKey: z.string().min(1),
  llmProvider: z.enum(['bedrock', 'vertex']),
  llmModel: z.string().min(1),
  confluenceSpaceKey: z.string().optional()
})

// Initialize services
const llmService = new LLMService()
const mcpService = new MCPService()
const documentService = new DocumentService()

// Main analyze endpoint
agent.post('/analyze', 
  zValidator('json', analyzeSchema),
  async (c) => {
    try {
      const data = c.req.valid('json') as AnalyzeRequest
      
      console.log('Starting analysis for:', data)
      
      // Step 1: Fetch GitHub repository data via MCP
      console.log('Fetching GitHub repository data...')
      const githubData = await mcpService.getGithubRepository(data.githubRepo)
      
      // Step 2: Fetch Jira issues via MCP
      console.log('Fetching Jira issues...')
      const jiraIssues = await mcpService.getJiraIssues(data.jiraProjectKey)
      
      // Step 3: Generate documentation using LLM
      console.log('Generating documentation...')
      const document = await documentService.generateDocument({
        githubData,
        jiraIssues,
        llmProvider: data.llmProvider,
        llmModel: data.llmModel
      })
      
      // Step 4: Post to Confluence if space key provided
      let documentUrl: string | undefined
      if (data.confluenceSpaceKey) {
        console.log('Posting to Confluence...')
        documentUrl = await mcpService.postToConfluence(
          document,
          data.confluenceSpaceKey
        )
      }
      
      const response: AnalyzeResponse = {
        status: 'success',
        documentUrl
      }
      
      return c.json(response)
      
    } catch (error) {
      console.error('Analysis error:', error)
      const response: AnalyzeResponse = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
      return c.json(response, 500)
    }
  }
)

// Get analysis status endpoint (for future use with async processing)
agent.get('/status/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ 
    id,
    status: 'completed',
    message: 'Synchronous processing - always completed' 
  })
})

export default agent
