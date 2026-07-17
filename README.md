# Daniel — Meal Planner (beta)

A weekly meal planner with drag-and-drop planning, an ingredients tracker, an
auto-generated shopping list, and an AI assistant (Daniel) that can read
recipes from links or photos and update your plan.

## What's in here

- `index.html` — the whole app (static, no build step)
- `api/daniel.js` — a small serverless function that holds your Anthropic API
  key server-side and relays Daniel's AI calls. The browser never sees the key.
- `package.json` — minimal project file so Vercel recognizes this as a Node
  project (no dependencies needed)

## Deploying (about 5 minutes, no coding required)

### 1. Push this folder to a new GitHub repo
If you don't already have this in a repo:
```bash
cd daniel-app
git init
git add .
git commit -m "Daniel meal planner beta"
```
Then create a new empty repo at https://github.com/new (don't add a README —
we already have one), copy the URL it gives you, and:
```bash
git remote add origin <the-url-github-gave-you>
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to https://vercel.com and sign up / log in (using your GitHub account is fastest)
2. Click **Add New → Project**
3. Import the GitHub repo you just created
4. Leave all the build settings as default (this is a static site — Vercel
   will detect `index.html` and the `api/` folder automatically)
5. Before clicking Deploy, open **Environment Variables** and add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (from https://console.anthropic.com)
6. Click **Deploy**

That's it — Vercel gives you a live URL like `daniel-meal-planner.vercel.app`
that works from your phone, your laptop, anywhere. Every time you push a new
commit to the `main` branch, Vercel automatically redeploys.

### If you ever need to update the API key
Project → Settings → Environment Variables → edit `ANTHROPIC_API_KEY` → the
next deploy (or a manual "Redeploy") will pick up the new value.

## Persistence (v2, first slice)

Meals and your weekly plan now persist across sessions and devices via
Supabase — everything else (chat history, stock levels, quiz answers) still
lives only in the browser tab for now, that's a deliberate scope cut, not an
oversight.

**Important limitation:** there's no login yet. Everyone who opens this app's
URL shares one household record. That's fine for a private family beta where
the URL isn't shared publicly — it is not fine once more people could
plausibly find the link. Real auth is the natural next step after this.

### Setup (about 5 minutes)
1. Go to https://supabase.com, sign up / log in, create a new project (pick
   any name/region, free tier is plenty)
2. Once it's ready, go to the **SQL Editor** in the left sidebar → **New
   query**, paste in the contents of `supabase-schema.sql` from this repo,
   and run it
3. Go to **Project Settings → API** and copy two values: the **Project URL**
   and the **anon public** key (not the `service_role` key — that one must
   never appear in frontend code)
4. Open `index.html`, find these two lines near the top of the `<script>`
   block, and replace the placeholders with your real values:
   ```js
   const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
5. Push the updated `index.html` to GitHub as usual — Vercel redeploys, and
   the app now saves and loads your household's meals and plan automatically

The anon key is meant to be public (Supabase's security model relies on
database policies, not on hiding this key) — that part is normal. What's
*not* fully locked down yet is the open access policy described above.

If you skip this setup entirely, the app still works exactly as before —
it just won't be configured, so it will fall back to in-memory only.

## Known limits of this beta

- Chat history, stock/ingredient levels, and quiz answers still live only in
  your browser tab — refreshing loses those. Meals and the weekly plan now
  persist via Supabase (see above) if you've set that up.
- No login yet — see the persistence section above for what that means.
- Recipe links often can't be auto-read due to sites blocking automated
  requests (CORS) — pasting the ingredients or attaching a photo works
  reliably in that case.
- Photo uploads for recipes are limited by Vercel's request size on the free
  tier (a few MB) — very large photos may need to be resized first.
