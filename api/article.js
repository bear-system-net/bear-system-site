const { loadArticles } = require('./_articles');

const ORIGIN = 'https://www.bear-system.net';
const SITE = '株式会社ベアシステム';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function linkify(escaped) {
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, function (url) {
    const clean = url.replace(/[.,;:!?)）」]+$/, '');
    const trail = url.slice(clean.length);
    return '<a href="' + clean + '" target="_blank" rel="noopener">' + clean + '</a>' + trail;
  });
}

function renderBody(body) {
  return String(body || '').replace(/\r\n/g, '\n').split(/\n{2,}/).map(function (block) {
    const t = block.trim();
    if (!t) return '';
    if (t.charAt(0) === '■' && t.indexOf('\n') === -1) {
      return '<h2>' + esc(t.replace(/^■\s*/, '')) + '</h2>';
    }
    return '<p>' + linkify(esc(t)).replace(/\n/g, '<br>') + '</p>';
  }).join('\n');
}

function makeDescription(body) {
  const first = String(body || '').replace(/\r\n/g, '\n').split(/\n{2,}/)
    .map(function (b) { return b.trim(); })
    .find(function (b) { return b && b.charAt(0) !== '■'; }) || '';
  const flat = first.replace(/\s+/g, ' ');
  return flat.length > 110 ? flat.slice(0, 110) + '…' : flat;
}

function notFound(res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(404).send('<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>ページが見つかりません｜' + SITE + '</title></head><body style="font-family:sans-serif;padding:48px"><p>ページが見つかりませんでした。</p><p><a href="/">株式会社ベアシステム トップへ</a></p></body></html>');
}

module.exports = async (req, res) => {
  const type = req.query.type === 'blog' ? 'blog' : 'news';
  const id = String(req.query.id || '');
  const articles = await loadArticles();
  const a = articles.find(function (x) { return String(x.id) === id && (x.type === 'blog' ? 'blog' : 'news') === type; });
  if (!a) { notFound(res); return; }

  const listLabel = type === 'blog' ? 'ブログ' : 'お知らせ';
  const url = ORIGIN + '/' + type + '/' + encodeURIComponent(a.id);
  const title = a.title + '｜' + SITE;
  const desc = makeDescription(a.body);
  const dateDot = String(a.date).replace(/-/g, '.');
  const related = articles
    .filter(function (x) { return x.type === a.type && String(x.id) !== id; })
    .sort(function (x, y) { return String(y.date).localeCompare(String(x.date)); })
    .slice(0, 5);

  const ld = [
    {
      '@context': 'https://schema.org', '@type': type === 'blog' ? 'BlogPosting' : 'NewsArticle',
      headline: a.title, description: desc, datePublished: a.date, dateModified: a.date,
      inLanguage: 'ja', mainEntityOfPage: url, image: ORIGIN + '/hero-top.jpg',
      author: { '@type': 'Organization', name: SITE, url: ORIGIN + '/' },
      publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: ORIGIN + '/icon-512.png' } }
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: listLabel, item: ORIGIN + '/' + type },
        { '@type': 'ListItem', position: 3, name: a.title, item: url }
      ]
    }
  ].map(function (o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>'; }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${ORIGIN}/hero-top.jpg">
<meta property="og:site_name" content="${SITE}">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/hero-top.jpg">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@500;600;700&display=swap">
${ld}
<style>
*{box-sizing:border-box;margin:0}
body{font-family:'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif;color:#1a2033;background:#F6F3EC;line-height:1.95;font-size:1rem}
a{color:#8A6D33}
header{background:#0B1020;padding:0 max(20px,env(safe-area-inset-left,0px))}
.hd{max-width:1040px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:68px;flex-wrap:wrap;padding:8px 0}
.brand{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;font-weight:700;letter-spacing:.08em;font-size:.9rem}
.brand img{height:32px;width:auto;display:block}
nav{display:flex;gap:4px;flex-wrap:wrap}
nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:.78rem;letter-spacing:.08em;padding:6px 10px}
nav a:hover{color:#D8BF8A}
main{max-width:760px;margin:0 auto;padding:40px 20px 72px}
.crumb{font-size:.78rem;color:#6b7080;margin-bottom:28px}
.crumb a{color:#6b7080;text-decoration:none}
.crumb a:hover{color:#8A6D33}
.date{font-size:.82rem;letter-spacing:.14em;color:#8A6D33;margin-bottom:10px}
h1{font-family:'Noto Serif JP','Hiragino Mincho ProN',serif;font-weight:600;font-size:clamp(1.4rem,3.4vw,2rem);line-height:1.6;color:#0B1020;margin-bottom:36px;text-wrap:balance}
article p{margin-bottom:1.5em}
article h2{font-family:'Noto Serif JP','Hiragino Mincho ProN',serif;font-weight:600;font-size:1.15rem;line-height:1.6;color:#0B1020;margin:2.2em 0 .8em;padding-left:14px;border-left:3px solid #B89B5E}
.cta{margin-top:56px;background:#0B1020;color:#fff;padding:36px 28px;text-align:center;border:1px solid #B89B5E}
.cta p{font-family:'Noto Serif JP',serif;font-size:1.05rem;margin-bottom:20px;line-height:1.8}
.cta a{display:inline-block;margin:6px;padding:12px 24px;text-decoration:none;font-size:.9rem;letter-spacing:.06em}
.cta .p{background:#B89B5E;color:#0B1020;font-weight:700}
.cta .g{border:1px solid #D8BF8A;color:#D8BF8A}
.rel{margin-top:56px}
.rel h3{font-family:'Noto Serif JP',serif;font-size:1rem;margin-bottom:12px;color:#0B1020}
.rel ul{list-style:none;padding:0}
.rel li{border-top:1px solid rgba(11,16,32,.12);padding:12px 0;font-size:.92rem}
.rel li span{display:block;font-size:.75rem;color:#6b7080;letter-spacing:.1em}
.rel a{color:#1a2033;text-decoration:none}
.rel a:hover{color:#8A6D33}
footer{background:#0B1020;color:rgba(255,255,255,.6);text-align:center;font-size:.78rem;padding:28px 20px;letter-spacing:.08em}
footer a{color:rgba(255,255,255,.75);text-decoration:none}
</style>
</head>
<body>
<header><div class="hd">
<a class="brand" href="/"><img src="/logo-mark-nav.png" alt="" width="45" height="32">${SITE}</a>
<nav aria-label="メインメニュー"><a href="/">ホーム</a><a href="/news">お知らせ</a><a href="/blog">ブログ</a><a href="/cases">活用事例</a><a href="/about">当社について</a><a href="/contact">お問い合わせ</a></nav>
</div></header>
<main>
<div class="crumb"><a href="/">ホーム</a> ＞ <a href="/${type}">${listLabel}</a> ＞ ${esc(a.title)}</div>
<article>
<p class="date">${esc(dateDot)}</p>
<h1>${esc(a.title)}</h1>
${renderBody(a.body)}
</article>
<div class="cta">
<p>「うちの場合はどうなるか」が気になりましたら、<br>30分ほど、オンラインでお話を伺えます。</p>
<a class="p" href="/contact">まずは30分のご相談</a><a class="g" href="/shiryo">ご紹介資料をダウンロード</a>
</div>
${related.length ? '<section class="rel"><h3>他の' + listLabel + '</h3><ul>' + related.map(function (r) { return '<li><span>' + esc(String(r.date).replace(/-/g, '.')) + '</span><a href="/' + type + '/' + encodeURIComponent(r.id) + '">' + esc(r.title) + '</a></li>'; }).join('') + '</ul></section>' : ''}
</main>
<footer>© ${SITE}　<a href="/privacy">個人情報保護方針</a></footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
};
