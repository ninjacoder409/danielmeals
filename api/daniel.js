// Serverless proxy for Daniel's AI calls.
// Keeps the Anthropic API key on the server — the browser never sees it.
// Deploy target: Vercel (zero-config: any file in /api becomes an endpoint at /api/<filename>).

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project settings under Environment Variables.' });
    return;
  }

  try {
    const body = req.body || {};
    let messages = body.messages;

    // Optional server-side page fetch — avoids the browser CORS restrictions
    // that block most recipe sites from being read directly by client-side JS.
    if (body.fetchUrl) {
      let fetchedText = null;
      let fetchNote = '';
      try {
        const pageRes = await fetch(body.fetchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DanielMealPlanner/1.0; +https://vercel.com)' },
          redirect: 'follow',
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          fetchedText = html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 8000);
        } else {
          fetchNote = `The page responded with status ${pageRes.status} when fetched from the server.`;
        }
      } catch (fetchErr) {
        fetchNote = 'The server could not retrieve that page either — it may require a login, block automated requests entirely, or the URL may be invalid.';
      }

      const appendText = fetchedText
        ? `\n\nPage text fetched server-side (may be noisy):\n${fetchedText}`
        : `\n\n${fetchNote}`;

      messages = JSON.parse(JSON.stringify(messages)); // clone, don't mutate caller's data
      const lastMsg = messages[messages.length - 1];
      if (Array.isArray(lastMsg.content)) {
        const textBlock = lastMsg.content.find(b => b.type === 'text');
        if (textBlock) textBlock.text += appendText;
        else lastMsg.content.unshift({ type: 'text', text: appendText });
      } else if (typeof lastMsg.content === 'string') {
        lastMsg.content += appendText;
      }
    }

    const payload = {
      model: body.model || 'claude-sonnet-4-6',
      max_tokens: body.max_tokens || 1000,
      messages,
    };
    if (body.system) payload.system = body.system;

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', detail: String(err && err.message ? err.message : err) });
  }
};
