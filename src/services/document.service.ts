import type { GitHubRepository, JiraIssue, DocumentContent, DocumentSection } from '../types/index.js'
import { LLMService } from './llm.service.js'
import { generatePrompt } from '../prompts/templates.js'

export class DocumentService {
  private llmService: LLMService

  constructor() {
    this.llmService = new LLMService()
  }

  async generateDocument(params: {
    githubData: GitHubRepository
    jiraIssues: JiraIssue[]
    llmProvider: 'bedrock' | 'vertex'
    llmModel: string
  }): Promise<DocumentContent> {
    const { githubData, jiraIssues, llmProvider, llmModel } = params

    // Generate sections
    const sections: DocumentSection[] = []

    // 1. Overview Section
    const overviewPrompt = generatePrompt('overview', { githubData, jiraIssues })
    const overviewContent = await this.llmService.generateText({
      provider: llmProvider,
      model: llmModel,
      prompt: overviewPrompt,
      systemPrompt: 'You are a technical documentation expert. Generate clear, concise, and professional documentation.'
    })
    sections.push({
      title: 'プロジェクト概要',
      content: overviewContent,
      type: 'overview'
    })

    // 2. Requirements Section
    const requirementsPrompt = generatePrompt('requirements', { githubData, jiraIssues })
    const requirementsContent = await this.llmService.generateText({
      provider: llmProvider,
      model: llmModel,
      prompt: requirementsPrompt,
      systemPrompt: 'You are a requirements analyst. Extract and organize requirements from the provided information.'
    })
    sections.push({
      title: '要件定義',
      content: requirementsContent,
      type: 'requirements'
    })

    // 3. Architecture Section
    const architecturePrompt = generatePrompt('architecture', { githubData, jiraIssues })
    const architectureContent = await this.llmService.generateText({
      provider: llmProvider,
      model: llmModel,
      prompt: architecturePrompt,
      systemPrompt: 'You are a software architect. Analyze the codebase and describe the system architecture.'
    })
    sections.push({
      title: 'システムアーキテクチャ',
      content: architectureContent,
      type: 'architecture'
    })

    // 4. Data Flow Section
    const dataflowPrompt = generatePrompt('dataflow', { githubData, jiraIssues })
    const dataflowContent = await this.llmService.generateText({
      provider: llmProvider,
      model: llmModel,
      prompt: dataflowPrompt,
      systemPrompt: 'You are a system analyst. Describe the data flow and interactions within the system.'
    })
    sections.push({
      title: 'データフロー',
      content: dataflowContent,
      type: 'dataflow'
    })

    // 5. Technical Details Section
    const technicalPrompt = generatePrompt('technical', { githubData, jiraIssues })
    const technicalContent = await this.llmService.generateText({
      provider: llmProvider,
      model: llmModel,
      prompt: technicalPrompt,
      systemPrompt: 'You are a senior developer. Provide technical implementation details and best practices.'
    })
    sections.push({
      title: '技術詳細',
      content: technicalContent,
      type: 'technical-details'
    })

    // Create document
    const document: DocumentContent = {
      title: `${githubData.owner}/${githubData.name} - 仕様書`,
      sections,
      metadata: {
        generatedAt: new Date().toISOString(),
        githubRepo: `${githubData.owner}/${githubData.name}`,
        jiraProject: jiraIssues[0]?.key.split('-')[0] || 'Unknown',
        llmProvider,
        llmModel
      }
    }

    return document
  }

  // Convert document to Confluence format
  formatForConfluence(document: DocumentContent): string {
    let confluenceContent = `<h1>${document.title}</h1>\n\n`
    
    // Add metadata
    confluenceContent += '<ac:structured-macro ac:name="info">\n'
    confluenceContent += '<ac:rich-text-body>\n'
    confluenceContent += `<p>生成日時: ${new Date(document.metadata.generatedAt).toLocaleString('ja-JP')}</p>\n`
    confluenceContent += `<p>GitHubリポジトリ: ${document.metadata.githubRepo}</p>\n`
    confluenceContent += `<p>Jiraプロジェクト: ${document.metadata.jiraProject}</p>\n`
    confluenceContent += '</ac:rich-text-body>\n'
    confluenceContent += '</ac:structured-macro>\n\n'

    // Add sections
    for (const section of document.sections) {
      confluenceContent += `<h2>${section.title}</h2>\n`
      confluenceContent += this.markdownToConfluence(section.content) + '\n\n'
    }

    return confluenceContent
  }

  // Simple markdown to Confluence converter
  private markdownToConfluence(markdown: string): string {
    let html = markdown
    
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Convert bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    
    // Convert italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Convert code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<ac:structured-macro ac:name="code">
        <ac:parameter ac:name="language">${lang || 'text'}</ac:parameter>
        <ac:plain-text-body><![CDATA[${code.trim()}]]></ac:plain-text-body>
      </ac:structured-macro>`
    })
    
    // Convert inline code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>')
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br/>\n')
    
    return html
  }
}
