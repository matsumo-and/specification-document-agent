'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    githubRepo: '',
    jiraProjectKey: '',
    llmProvider: 'bedrock',
    llmModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
    confluenceSpaceKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Specification Document Agent</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
      >
        <div>
          <label
            htmlFor="githubRepo"
            className="block text-sm font-medium mb-2"
          >
            GitHubリポジトリ (owner/repo)
          </label>
          <input
            type="text"
            id="githubRepo"
            value={formData.githubRepo}
            onChange={(e) =>
              setFormData({ ...formData, githubRepo: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="例: octocat/hello-world"
            required
          />
        </div>

        <div>
          <label
            htmlFor="jiraProjectKey"
            className="block text-sm font-medium mb-2"
          >
            Jiraプロジェクトキー
          </label>
          <input
            type="text"
            id="jiraProjectKey"
            value={formData.jiraProjectKey}
            onChange={(e) =>
              setFormData({ ...formData, jiraProjectKey: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="例: PROJ"
            required
          />
        </div>

        <div>
          <label
            htmlFor="llmProvider"
            className="block text-sm font-medium mb-2"
          >
            LLMプロバイダー
          </label>
          <select
            id="llmProvider"
            value={formData.llmProvider}
            onChange={(e) =>
              setFormData({ ...formData, llmProvider: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="bedrock">AWS Bedrock</option>
            <option value="vertex">Google Vertex AI</option>
          </select>
        </div>

        <div>
          <label htmlFor="llmModel" className="block text-sm font-medium mb-2">
            モデル
          </label>
          <select
            id="llmModel"
            value={formData.llmModel}
            onChange={(e) =>
              setFormData({ ...formData, llmModel: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {formData.llmProvider === 'bedrock' ? (
              <>
                <option value="anthropic.claude-3-sonnet-20240229-v1:0">
                  Claude 3 Sonnet
                </option>
                <option value="anthropic.claude-3-haiku-20240307-v1:0">
                  Claude 3 Haiku
                </option>
                <option value="anthropic.claude-3-opus-20240229-v1:0">
                  Claude 3 Opus
                </option>
              </>
            ) : (
              <>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-pro">Gemini Pro</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="confluenceSpaceKey"
            className="block text-sm font-medium mb-2"
          >
            Confluenceスペースキー (オプション)
          </label>
          <input
            type="text"
            id="confluenceSpaceKey"
            value={formData.confluenceSpaceKey}
            onChange={(e) =>
              setFormData({ ...formData, confluenceSpaceKey: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="例: SPACE"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '生成中...' : '仕様書を生成'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
          エラー: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">生成完了！</h2>
          {result.documentUrl && (
            <p>
              ドキュメントURL:{' '}
              <a
                href={result.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {result.documentUrl}
              </a>
            </p>
          )}
        </div>
      )}
    </main>
  );
}
