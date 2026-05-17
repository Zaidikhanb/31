const https = require('https');

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;
const basePath = 'data';

async function githubRequest(method, path, body) {
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
          resolve({ status: res.statusCode, data: JSON.parse(data) });
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
  const { category, id } = req.body;
  if (!category || !id) {
    return res.status(400).json({ error: 'Missing category or id' });
  }

  const filePath = `${basePath}/${category}.json`;
  const apiPath = `/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    const getRes = await githubRequest('GET', apiPath);
    if (getRes.status !== 200) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = Buffer.from(getRes.data.content, 'base64').toString('utf8');
    let items = JSON.parse(content);
    const sha = getRes.data.sha;

    const newItems = items.filter(item => item.id !== id);
    if (items.length === newItems.length) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const updatedContent = JSON.stringify(newItems, null, 2);
    const putBody = {
      message: `Delete entry ${id} from ${category}`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha,
      branch: 'main',
    };

    const putRes = await githubRequest('PUT', apiPath, putBody);
    if (putRes.status === 200 || putRes.status === 201) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Failed to delete' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}