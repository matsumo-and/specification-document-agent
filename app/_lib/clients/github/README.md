# GitHub REST API Client

このディレクトリには、GitHub App認証を使用したREST APIクライアントが含まれています。

## 概要

このクライアントは以下の機能を提供します：

- **GitHub App認証**: JWT/Installation Access Tokenベースの認証
- **GitHub CloudとEnterprise Server対応**: 両方の環境で動作
- **完全なREST APIサポート**: GET、POST、PUT、PATCH、DELETE
- **ページネーション対応**: 大量のデータを効率的に取得
- **エラーハンドリング**: 詳細なエラー情報を提供

## ディレクトリ構造

```
github/
├── api.ts              # REST APIクライアント
├── auth/
│   ├── oauth.ts        # GitHub App OAuth認証
│   └── README.md       # 認証の詳細ドキュメント
└── README.md           # このファイル
```

## セットアップ

### 1. 環境変数の設定

`.env`ファイルに必要な環境変数を設定：

```env
# GitHub App認証情報
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID=12345678

# オプション: Enterprise Server用
# GITHUB_API_BASE_URL=https://github.company.com/api/v3
# GITHUB_API_VERSION=2022-11-28
```

### 2. パッケージのインストール

```bash
yarn add jsonwebtoken @types/jsonwebtoken
```

## 使用方法

### 基本的な使用例

```typescript
import { GitHubApiClient } from '@/lib/clients/github/api';

// デフォルト設定（環境変数から読み込み）
const github = new GitHubApiClient();

// または明示的な設定
const github = new GitHubApiClient({
  appId: 'your-app-id',
  privateKey: 'your-private-key',
  installationId: 'your-installation-id',
  baseUrl: 'https://api.github.com', // Enterprise Serverの場合は変更
  apiVersion: '2022-11-28',
});
```

### リポジトリ情報の取得

```typescript
// リポジトリ情報を取得
const repo = await github.get('/repos/owner/repo');
console.log(repo.name, repo.description);

// クエリパラメータ付き
const issues = await github.get('/repos/owner/repo/issues', {
  state: 'open',
  labels: 'bug',
  per_page: 30,
});
```

### Issue の作成

```typescript
const newIssue = await github.post('/repos/owner/repo/issues', {
  title: 'Found a bug',
  body: 'Description of the bug...',
  labels: ['bug', 'high-priority'],
});
```

### リポジトリの更新

```typescript
// PATCH（部分更新）
const updatedRepo = await github.patch('/repos/owner/repo', {
  description: 'Updated description',
  homepage: 'https://example.com',
});

// PUT（完全置換）
const updatedFile = await github.put('/repos/owner/repo/contents/README.md', {
  message: 'Update README',
  content: Buffer.from('# New Content').toString('base64'),
  sha: 'current-file-sha',
});
```

### ファイルの削除

```typescript
await github.delete('/repos/owner/repo/contents/old-file.txt');
```

### ページネーション

```typescript
// 自動ページネーション（最大10ページ）
const allIssues = await github.getPaginated('/repos/owner/repo/issues', {
  state: 'all',
  per_page: 100,
});

// カスタムページ数
const allPullRequests = await github.getPaginated(
  '/repos/owner/repo/pulls',
  { state: 'all' },
  20 // 最大20ページ
);
```

## Enterprise Server対応

### 設定方法

```typescript
// Enterprise Server用の設定
const githubEnterprise = new GitHubApiClient({
  baseUrl: 'https://github.company.com/api/v3',
  apiVersion: '2022-11-28', // Enterprise Serverのバージョンに応じて調整
});

// または環境変数で設定
// GITHUB_API_BASE_URL=https://github.company.com/api/v3
```

### 注意事項

- Enterprise ServerのURLは通常 `https://hostname/api/v3` の形式
- APIバージョンはEnterprise Serverのバージョンによって異なる場合がある
- 一部のAPIエンドポイントはEnterprise Serverで利用できない場合がある

## 高度な使用例

### エラーハンドリング

```typescript
try {
  const repo = await github.get('/repos/owner/repo');
} catch (error) {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
    // エラーメッセージには以下が含まれる：
    // - HTTPステータスコード
    // - GitHub APIのエラーメッセージ
    // - 詳細なエラー情報（存在する場合）
  }
}
```

### カスタムヘッダー

現在の実装では標準的なGitHub APIヘッダーが自動的に設定されますが、
必要に応じて拡張することができます。

### レート制限

GitHub APIにはレート制限があります：

- GitHub App: 5,000リクエスト/時間（Installation毎）
- Enterprise Server: 管理者が設定

レート制限の確認：

```typescript
const rateLimitInfo = await github.get('/rate_limit');
console.log('Remaining:', rateLimitInfo.rate.remaining);
console.log('Reset at:', new Date(rateLimitInfo.rate.reset * 1000));
```

## 型定義

TypeScriptを使用している場合、GitHub APIの型定義を追加することを推奨：

```typescript
// GitHub APIの型定義例
interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    id: number;
    type: string;
  };
  // ... その他のフィールド
}

// 使用例
const repo = await github.get<GitHubRepository>('/repos/owner/repo');
```

## トラブルシューティング

### よくある問題

1. **認証エラー（401）**
   - App ID、Private Key、Installation IDが正しいか確認
   - Private Keyの形式（PEM）が正しいか確認
   - 環境変数が正しく設定されているか確認

2. **権限エラー（403）**
   - GitHub Appに必要な権限が付与されているか確認
   - Installation IDが正しいリポジトリ/組織に対応しているか確認

3. **Not Found（404）**
   - APIパスが正しいか確認
   - リポジトリ名、オーナー名が正しいか確認
   - Enterprise Serverの場合、base URLが正しいか確認

### デバッグ

```typescript
const github = new GitHubApiClient();

// 現在の設定を確認
console.log('App ID:', github.getAppId());
console.log('Installation ID:', github.getInstallationId());
console.log('Base URL:', github.getBaseUrl());

// APIリクエストのテスト
try {
  const user = await github.get('/user');
  console.log('API connection successful');
} catch (error) {
  console.error('API connection failed:', error);
}
```

## 参考リンク

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [GitHub Enterprise Server API](https://docs.github.com/en/enterprise-server/rest)
