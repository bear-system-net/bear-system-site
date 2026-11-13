const { loadArticles } = require('./_articles');

const ORIGIN = 'https://www.bear-system.net';
const PAGES = [
  ['', 'weekly', '1.0'],
  ['news', 'weekly', '0.8'],
  ['blog', 'weekly', '0.8'],
  ['voices', 'monthly', '0.7'],
  ['cases', 'monthly', '0.7'],
  ['about', 'yearly', '0.6'],
  ['partner', 'monthly', '0.6'],
  ['contact', 'yearly', '0.6'],
  ['recruit', 'yearly', '0.5'],
  ['shiryo', 'monthly', '0.6'],
  ['privacy', 'yearly', '0.3']
];

module.exports = async (req, res) => {
  const articles = (await loadArticles()).filter(a => a && a.id && a.date);
  const latest = articles.map(a => a.date).sort().pop() || new Date().toISOString().slice(0, 10);
  const urls = [];
  PAGES.forEach(([slug, freq, prio]) => {
    urls.push(`  <url>\n    <loc>${ORIGIN}/${slug}</loc>\n    <lastmod>${latest}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`);
  });
  articles.forEach(a => {
    const type = a.type === 'blog' ? 'blog' : 'news';
    urls.push(`  <url>\n    <loc>${ORIGIN}/${type}/${encodeURIComponent(a.id)}</loc>\n    <lastmod>${a.date}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>${type === 'blog' ? '0.6' : '0.4'}</priority>\n  </url>`);
  });
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
};
