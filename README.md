# Specification Document Agent

GitHubリポジトリとJira課題から自動的に仕様書とデータフローを生成するAI Agentアプリケーションです。

## 機能

- GitHubリポジトリの構造とコードを分析
- Jira課題から要件を抽出
- AI（AWS Bedrock/Google Vertex AI）を使用して仕様書を生成
- Confluenceへの自動投稿

## 技術スタック

- **Framework**: Hono.js (TypeScript)
- **AI SDK**: Vercel AI SDK
- **LLM Providers**: 
  - AWS Bedrock (Claude, Titan)
  - Google Vertex AI (Gemini)
- **Integration**: MCP (Model Context Protocol) servers

## セットアップ

### 1. 依存関係のインストール

```bash
yarn install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な認証情報を設定してください。

```bash
cp .env.example .env
```

必要な環境変数:
- AWS認証情報（Bedrock用）
- GCP認証情報（Vertex AI用）
- GitHub Personal Access Token
- Atlassian API Token

### 3. 開発サーバーの起動

```bash
yarn dev
```

## API エンドポイント

### POST /api/agent/analyze

仕様書を生成します。

**リクエストボディ:**
```json
{
  "githubRepo": "owner/repo",
  "jiraProjectKey": "PROJ",
  "llmProvider": "bedrock",
  "llmModel": "anthropic.claude-3-sonnet-20240229-v1:0",
  "confluenceSpaceKey": "SPACE"
}
```

**レスポンス:**
```json
{
  "status": "success",
  "documentUrl": "https://your-domain.atlassian.net/wiki/spaces/SPACE/pages/123456"
}
```

## MCP サーバー

このプロジェクトは以下のMCPサーバーを使用します（今後実装予定）:

- **GitHub MCP**: GitHubリポジトリの読み取り
- **Atlassian MCP**: Jira課題の読み取りとConfluenceへの投稿

## 開発

### ビルド

```bash
yarn build
```

### プロダクション実行

```bash
yarn start
```

## ライセンス

ISC
