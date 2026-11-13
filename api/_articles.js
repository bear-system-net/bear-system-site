const fs = require('fs');
const path = require('path');

// 記事データを読み込む。デプロイに含まれる data/articles.json を優先し、読めなければ GitHub から取得する。
async function loadArticles() {
  try {
    const p = path.join(process.cwd(), 'data', 'articles.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e) {}
  try {
    const r = await fetch('https://api.github.com/repos/bear-system-net/bear-system-site/contents/data/articles.json', {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
    });
    if (!r.ok) return [];
    const data = await r.json();
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
  } catch (e) {
    return [];
  }
}

module.exports = { loadArticles };
