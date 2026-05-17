const https = require('https');

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;
const basePath = 'data';

async function githubRequest(method, path, body = null) {
  const options = {
    hostname: 'api.github.com',
    path,
    method,
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'CloudDataApp',
      'Accept': 'application/vnd.github.v3+json',
    },
  };
  if (body) {
    body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(body);
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { category, entry } = req.body;
  if (!category || !entry) {
    return res.status(400).json({ error: 'Missing category or entry' });
  }

  const filePath = `${basePath}/${category}.json`;
  const apiPath = `/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    const getRes = await githubRequest('GET', apiPath);
    let currentData = [];
    let sha = null;

    if (getRes.status === 200) {
      const content = Buffer.from(getRes.data.content, 'base64').toString('utf8');
      currentData = JSON.parse(content);
      sha = getRes.data.sha;
    } else if (getRes.status !== 404) {
      throw new Error(`GitHub API error: ${getRes.status}`);
    }

    currentData.push(entry);
    const updatedContent = JSON.stringify(currentData, null, 2);
    const commitMessage = `Add ${category} entry`;

    const putBody = {
      message: commitMessage,
      content: Buffer.from(updatedContent).toString('base64'),
      branch: 'main',
    };
    if (sha) putBody.sha = sha;

    const putRes = await githubRequest('PUT', apiPath, putBody);
    if (putRes.status === 200 || putRes.status === 201) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Failed to save to GitHub' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}