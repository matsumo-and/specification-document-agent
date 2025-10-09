# GitHub App OAuth Client

このディレクトリには、GitHub AppのREST API認証を処理するOAuthクライアントが含まれています。

## 概要

`GitHubOAuthConfig`クラスは、GitHub Appの認証フローを実装しています：

1. **JWT生成**: App IDとPrivate Keyを使用してJWT（JSON Web Token）を生成
2. **Installation Access Token取得**: JWTを使用してInstallation Access Tokenを取得
3. **トークンキャッシング**: トークンを有効期限までキャッシュして、不要なAPI呼び出しを削減

## セットアップ

### 1. GitHub Appの作成

1. GitHubの設定から新しいGitHub Appを作成
2. 以下の情報を取得：
   - App ID
   - Private Key（PEMフォーマット）
   - Installation ID

### 2. 環境変数の設定

`.env`ファイルに以下の環境変数を設定：

```env
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID=12345678
```

## 使用方法

### 基本的な使用例

```typescript
import { GitHubOAuthConfig } from './oauth';

// 環境変数から自動的に設定を読み込む
const githubAuth = new GitHubOAuthConfig();

// または、明示的に設定を渡す
const githubAuth = new GitHubOAuthConfig(
  'your-app-id',
  'your-private-key',
  'your-installation-id'
);

// アクセストークンを取得
const accessToken = await githubAuth.getAccessToken();

// GitHub APIを呼び出す
const response = await fetch('https://api.github.com/repos/owner/repo', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});
```

### GitHub APIクライアントとの統合例

```typescript
import { GitHubOAuthConfig } from './auth/oauth';

class GitHubAPIClient {
  private auth: GitHubOAuthConfig;

  constructor() {
    this.auth = new GitHubOAuthConfig();
  }

  async getRepository(owner: string, repo: string) {
    const token = await this.auth.getAccessToken();

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createIssue(owner: string, repo: string, title: string, body: string) {
    const token = await this.auth.getAccessToken();

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

## 重要な注意事項

### Private Keyの形式

Private Keyは改行を含むPEM形式で保存する必要があります。環境変数に設定する場合は、以下のいずれかの方法を使用：

1. **ダブルクォートで囲む**（推奨）:

   ```env
   GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   -----END RSA PRIVATE KEY-----"
   ```

2. **改行を`\n`に置換**:
   ```env
   GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----
   ```

### トークンの有効期限

- JWTの有効期限: 10分（GitHub Appの最大値）
- Installation Access Tokenの有効期限: 1時間
- トークンは自動的にキャッシュされ、期限切れ5分前に自動更新されます

### エラーハンドリング

```typescript
try {
  const token = await githubAuth.getAccessToken();
  // APIを使用
} catch (error) {
  if (error instanceof Error) {
    console.error('認証エラー:', error.message);
    // エラーメッセージには以下が含まれる可能性があります：
    // - "Invalid GitHub App ID"
    // - "Invalid GitHub App Private Key"
    // - "Invalid GitHub App Installation ID"
    // - "GitHub App authentication failed: ..."
  }
}
```

## トラブルシューティング

### よくあるエラー

1. **"Invalid GitHub App Private Key"**
   - Private Keyが正しくPEM形式で保存されているか確認
   - 環境変数の改行が正しく処理されているか確認

2. **"Failed to get GitHub Installation Access Token: 401"**
   - App IDが正しいか確認
   - Private KeyがそのApp IDに対応しているか確認
   - JWTの生成が正しく行われているか確認

3. **"Failed to get GitHub Installation Access Token: 404"**
   - Installation IDが正しいか確認
   - GitHub AppがそのInstallationにアクセス権限を持っているか確認

### デバッグ

問題が発生した場合は、以下を確認：

```typescript
// 現在の設定を確認
console.log('App ID:', githubAuth.getAppId());
console.log('Installation ID:', githubAuth.getInstallationId());

// トークン取得時のエラーをキャッチ
try {
  const token = await githubAuth.getAccessToken();
  console.log('Token obtained successfully');
} catch (error) {
  console.error('Token error:', error);
}
```
