import { generateText, streamText } from 'ai'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createVertex } from '@ai-sdk/google-vertex'
import 'dotenv/config'

export class LLMService {
  private bedrock
  private vertex

  constructor() {
    // Initialize Bedrock provider
    this.bedrock = createAmazonBedrock({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    })

    // Initialize Vertex AI provider
    this.vertex = createVertex({
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GCP_LOCATION || 'us-central1',
    })
  }

  async generateText(params: {
    provider: 'bedrock' | 'vertex'
    model: string
    prompt: string
    systemPrompt?: string
    tools?: any
  }) {
    const { provider, model, prompt, systemPrompt, tools } = params

    // Select the appropriate model
    const llmModel = provider === 'bedrock' 
      ? this.bedrock(model)
      : this.vertex(model)

    try {
      const { text } = await generateText({
        model: llmModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.7,
        maxRetries: 3,
        ...(tools ? { tools } : {}),
      })

      return text
    } catch (error) {
      console.error('LLM generation error:', error)
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async streamText(params: {
    provider: 'bedrock' | 'vertex'
    model: string
    prompt: string
    systemPrompt?: string
    tools?: any
  }) {
    const { provider, model, prompt, systemPrompt, tools } = params

    // Select the appropriate model
    const llmModel = provider === 'bedrock' 
      ? this.bedrock(model)
      : this.vertex(model)

    try {
      const result = await streamText({
        model: llmModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        temperature: 0.7,
        maxRetries: 3,
        ...(tools ? { tools } : {}),
      })

      return result
    } catch (error) {
      console.error('LLM streaming error:', error)
      throw new Error(`Failed to stream text: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get available models for each provider
  getAvailableModels(provider: 'bedrock' | 'vertex') {
    if (provider === 'bedrock') {
      return [
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'anthropic.claude-3-opus-20240229-v1:0',
        'anthropic.claude-instant-v1',
        'amazon.titan-text-express-v1',
        'amazon.titan-text-lite-v1',
      ]
    } else {
      return [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-pro',
        'gemini-pro-vision',
      ]
    }
  }
}
