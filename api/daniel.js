// Serverless proxy for Daniel's AI calls.
// Keeps the Anthropic API key on the server — the browser never sees it.
// Deploy target: Vercel (zero-config: any file in /api becomes an endpoint at /api/<filename>).

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};

  // Lightweight mode: just grab a page's og:image, no Claude call involved.
  // Used to get a small thumbnail for Daniel's suggested-meal cards.
  if (body.mode === 'og_image' && body.url) {
    try {
      const pageRes = await fetch(body.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' },
        redirect: 'follow',
      });
      if (!pageRes.ok) { res.status(200).json({ ogImage: null }); return; }
      const html = await pageRes.text();
      const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
             || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      res.status(200).json({ ogImage: m ? m[1] : null });
    } catch (err) {
      res.status(200).json({ ogImage: null });
    }
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project settings under Environment Variables.' });
    return;
  }

  try {
    let messages = body.messages;

    // Optional server-side page fetch — avoids the browser CORS restrictions
    // that block most recipe sites from being read directly by client-side JS.
    if (body.fetchUrl) {
      let fetchedText = null;
      let fetchNote = '';
      try {
        const pageRes = await fetch(body.fetchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' },
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
          fetchNote = [401,402,403,429].includes(pageRes.status)
            ? `The site returned status ${pageRes.status}, which on most sites means it detected and blocked this as automated traffic — not a real login or subscription requirement on the recipe itself.`
            : `The page responded with status ${pageRes.status} when fetched from the server.`;
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
    if (body.useWebSearch) payload.tools = [{ type: 'web_search_20250305', name: 'web_search' }];

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
