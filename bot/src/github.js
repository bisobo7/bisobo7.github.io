// bot/src/github.js — repo writes via the Git Data API.
//
// The Contents API would be simpler, but it creates one commit per file — a
// six-photo listing would mean seven commits and seven Pages deploys. Building
// a tree by hand lets a whole listing land as ONE commit and ONE deploy.
import { config } from './config.js';

const { owner, repo, branch, token } = config.github;
const BASE = `https://api.github.com/repos/${owner}/${repo}`;

async function gh(path, options = {}) {
  const res = await fetch(path.startsWith('http') ? path : `${BASE}${path}`, {
    signal: AbortSignal.timeout(20000),
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'dixie-inventory-bot',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${options.method || 'GET'} ${path} → ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

const json = (method, path, body) =>
  gh(path, { method, body: JSON.stringify(body) });

export const github = {
  /** Confirm the token works and can actually write, before the owner starts a listing. */
  async checkAccess() {
    const info = await gh('');
    if (!info.permissions?.push) {
      throw new Error(
        `Token cannot write to ${owner}/${repo}. Needs Contents: Read and write.`
      );
    }
    return info;
  },

  /**
   * Commit any number of files atomically.
   * files: [{ path, content: string|Buffer, encoding?: 'utf-8'|'base64' }]
   * Pass content: null to DELETE a path.
   */
  async commitFiles(message, files) {
    const ref = await gh(`/git/ref/heads/${branch}`);
    const headSha = ref.object.sha;
    const headCommit = await gh(`/git/commits/${headSha}`);

    // Upload each file as a blob first; the tree then references them by sha.
    const tree = [];
    for (const file of files) {
      if (file.content === null) {
        tree.push({ path: file.path, mode: '100644', type: 'blob', sha: null });
        continue;
      }
      const isBuffer = Buffer.isBuffer(file.content);
      const blob = await json('POST', '/git/blobs', {
        content: isBuffer ? file.content.toString('base64') : file.content,
        encoding: isBuffer ? 'base64' : 'utf-8',
      });
      tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    const newTree = await json('POST', '/git/trees', {
      base_tree: headCommit.tree.sha,
      tree,
    });
    const commit = await json('POST', '/git/commits', {
      message,
      tree: newTree.sha,
      parents: [headSha],
    });
    await json('PATCH', `/git/refs/heads/${branch}`, { sha: commit.sha });
    return commit;
  },

  /** Filenames of every listing in the vehicles directory. */
  async listVehicleFiles() {
    try {
      const entries = await gh(`/contents/${config.vehicleDir}?ref=${branch}`);
      return entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));
    } catch (err) {
      if (err.message.includes('404')) return [];
      throw err;
    }
  },

  async readFile(path) {
    const data = await gh(`/contents/${encodeURI(path)}?ref=${branch}`);
    return Buffer.from(data.content, 'base64').toString('utf-8');
  },

  /** Most recent Actions run, so the bot can report when a deploy finishes. */
  async latestRun() {
    const data = await gh(`/actions/runs?branch=${branch}&per_page=1`);
    return data.workflow_runs?.[0] ?? null;
  },
};
