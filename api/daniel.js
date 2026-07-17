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
    const payload = {
      model: body.model || 'claude-sonnet-4-6',
      max_tokens: body.max_tokens || 1000,
      messages: body.messages,
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
