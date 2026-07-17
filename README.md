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

## Known limits of this beta
- All data (saved meals, the weekly plan, stock levels) lives only in your
  browser tab for now — refreshing loses it. Persistent storage is planned
  for v2.
- Recipe links often can't be auto-read due to sites blocking automated
  requests (CORS) — pasting the ingredients or attaching a photo works
  reliably in that case.
- Photo uploads for recipes are limited by Vercel's request size on the free
  tier (a few MB) — very large photos may need to be resized first.
