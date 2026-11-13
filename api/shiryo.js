module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_TO = 's.inoue@bear-system.net';
  const FROM_ADDRESS = 'ベアシステム <info@bear-system.net>';
  const REPLY_TO = 's.inoue@bear-system.net';

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { company, name, email, phone, message, _hp } = body || {};

  // ハニーポット：入力があれば、送信者には気づかせず静かに拒否
  if (_hp) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!company || !name || !email) {
    res.status(400).json({ ok: false, error: '必須項目が入力されていません' });
    return;
  }

  const notifyBody =
    `会社名：${company}\n` +
    `担当者：${name}\n` +
    `メール：${email}\n` +
    `電話：${phone || ''}\n` +
    `ご相談：${message || ''}`;

  const autoReplyBody =
`${company}
${name}さま

このたびは、ベアシステムのご紹介資料をお申し込みいただき、
ありがとうございます。代表の井上です。

資料は、こちらからダウンロードいただけます。
https://www.bear-system.net/shiryo/bearsystem-shokai.pdf

「うちの場合はどうなるか」が気になりましたら、
30分ほど、オンラインでお話を伺えます。
このメールに「話を聞きたい」と一言ご返信ください。日程はこちらで合わせます。

――――――――――
株式会社ベアシステム　代表取締役　井上 俊
TEL：03-6367-2529　メール：s.inoue@bear-system.net
https://www.bear-system.net`;

  async function sendEmail({ to, subject, text }) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], reply_to: REPLY_TO, subject, text })
    });
    if (!r.ok) throw new Error(await r.text());
  }

  try {
    await sendEmail({ to: NOTIFY_TO, subject: `【資料DL】${company}`, text: notifyBody });
  } catch (e) {
    res.status(500).json({ ok: false, error: '送信に失敗しました' });
    return;
  }

  try {
    await sendEmail({ to: email, subject: '【ベアシステム】ご紹介資料をお送りします', text: autoReplyBody });
  } catch (e) {
    // 井上さんあての通知は送れているので、処理自体は成功として返す
  }

  res.status(200).json({ ok: true });
};
