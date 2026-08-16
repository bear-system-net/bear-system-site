module.exports = async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const OWNER = 'bear-system-net';
  const REPO = 'bear-system-site';
  const PATH = 'data/articles.json';
  const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

  // 記事一覧を取得（誰でも見られる。パスワード不要）
  if (req.method === 'GET') {
    try {
      const r = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json'
        }
      });
      if (r.status === 404) {
        res.status(200).json([]);
        return;
      }
      const data = await r.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      res.status(200).json(JSON.parse(content));
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
    return;
  }

  // パスワード確認・記事保存（どちらもパスワード必須）
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { password, action, articles } = body || {};

    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ ok: false, error: 'パスワードが違います' });
      return;
    }

    // ログイン時の確認だけ
    if (action === 'verify') {
      res.status(200).json({ ok: true });
      return;
    }

    // 記事の保存
    if (action === 'save') {
      try {
        let sha;
        const getR = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json'
          }
        });
        if (getR.status === 200) {
          const getData = await getR.json();
          sha = getData.sha;
        }
        const content = Buffer.from(JSON.stringify(articles, null, 2)).toString('base64');
        const putR = await fetch(API_URL, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Update articles via admin panel',
            content,
            sha
          })
        });
        if (!putR.ok) {
          const err = await putR.json();
          res.status(500).json({ error: err.message || '保存に失敗しました' });
          return;
        }
        res.status(200).json({ success: true });
      } catch (e) {
        res.status(500).json({ error: '保存に失敗しました' });
      }
      return;
    }

    res.status(400).json({ error: 'Invalid action' });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
