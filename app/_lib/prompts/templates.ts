import type { GitHubRepository, JiraIssue } from '../../_types/index';

export function generatePrompt(
  type: 'overview' | 'requirements' | 'architecture' | 'dataflow' | 'technical',
  data: { githubData: GitHubRepository; jiraIssues: JiraIssue[] }
): string {
  const { githubData, jiraIssues } = data;

  switch (type) {
    case 'overview':
      return `
以下の情報を基に、プロジェクトの概要を日本語で作成してください。

GitHubリポジトリ情報:
- リポジトリ名: ${githubData.owner}/${githubData.name}
- 説明: ${githubData.description || 'なし'}
- README: ${githubData.readme || 'なし'}

Jira課題一覧:
${jiraIssues
  .map(
    (issue) => `
- ${issue.key}: ${issue.summary}
  タイプ: ${issue.issueType}
  ステータス: ${issue.status}
  説明: ${issue.description || 'なし'}
`
  )
  .join('\n')}

以下の項目を含めてください:
1. プロジェクトの目的と背景
2. 主要な機能と特徴
3. ターゲットユーザー
4. プロジェクトの現在の状態
`;

    case 'requirements':
      return `
以下のJira課題情報から、システムの要件定義を日本語で整理してください。

Jira課題一覧:
${jiraIssues
  .map(
    (issue) => `
- ${issue.key}: ${issue.summary}
  タイプ: ${issue.issueType}
  優先度: ${issue.priority || '未設定'}
  説明: ${issue.description || 'なし'}
  ラベル: ${issue.labels?.join(', ') || 'なし'}
`
  )
  .join('\n')}

以下の形式で整理してください:
1. 機能要件
   - 必須機能
   - 推奨機能
2. 非機能要件
   - パフォーマンス要件
   - セキュリティ要件
   - 可用性要件
3. 制約事項
`;

    case 'architecture':
      return `
以下のGitHubリポジトリ構造を分析し、システムアーキテクチャを日本語で説明してください。

リポジトリ構造:
${formatFileStructure(githubData.structure)}

以下の観点から説明してください:
1. アプリケーション構造（レイヤー、モジュール構成）
2. 使用している主要な技術スタック
3. デザインパターン
4. 外部システムとの連携
5. データストレージ構成
`;

    case 'dataflow':
      return `
以下の情報を基に、システムのデータフローを日本語で説明してください。

GitHubリポジトリ構造:
${formatFileStructure(githubData.structure)}

Jira課題（機能関連）:
${jiraIssues
  .filter((issue) => issue.issueType === 'Story' || issue.issueType === 'Task')
  .map(
    (issue) => `
- ${issue.summary}
`
  )
  .join('\n')}

以下の内容を含めてください:
1. 主要なデータの流れ
2. ユーザーインタラクションフロー
3. システム間のデータ連携
4. データ処理のシーケンス
5. エラーハンドリングフロー
`;

    case 'technical':
      return `
以下の情報を基に、技術的な実装詳細を日本語で説明してください。

コードサンプル:
${githubData.structure
  .filter((node) => node.type === 'file' && node.content)
  .slice(0, 3)
  .map(
    (node) => `
ファイル: ${node.path}
\`\`\`
${node.content?.slice(0, 200)}...
\`\`\`
`
  )
  .join('\n')}

以下の項目について説明してください:
1. 主要なコンポーネントの実装詳細
2. 重要なアルゴリズムやロジック
3. セキュリティ実装
4. パフォーマンス最適化
5. テスト戦略
6. デプロイメント構成
`;

    default:
      throw new Error(`Unknown prompt type: ${type}`);
  }
}

function formatFileStructure(structure: any[], indent = ''): string {
  let result = '';
  for (const node of structure) {
    if (node.type === 'directory') {
      result += `${indent}📁 ${node.path}/\n`;
      if (node.children) {
        result += formatFileStructure(node.children, indent + '  ');
      }
    } else {
      result += `${indent}📄 ${node.path}\n`;
    }
  }
  return result;
}
