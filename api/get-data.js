const https = require('https');

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;
const basePath = 'data';

function githubGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'CloudDataApp',
        'Accept': 'application/vnd.github.v3+json',
      },
    };
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
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { category, startDate, endDate } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Missing category' });
  }

  const filePath = `${basePath}/${category}.json`;
  const apiPath = `/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    const getRes = await githubGet(apiPath);
    if (getRes.status === 404) {
      return res.status(200).json([]);
    }
    if (getRes.status !== 200) {
      throw new Error(`GitHub API error: ${getRes.status}`);
    }

    const content = Buffer.from(getRes.data.content, 'base64').toString('utf8');
    let items = JSON.parse(content);

    if (startDate || endDate) {
      items = items.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate)) return false;
        return true;
      });
    }

    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}