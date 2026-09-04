# IG Auto-Reply

Dashboard-driven Instagram comment auto-reply. Connect your account, drop keyword → reply rules per post, and let Groq handle anything that doesn't match a rule.

## How it works
1. You connect Instagram once via OAuth (button on the home page).
2. Your recent posts sync into the dashboard.
3. For each post, add keyword rules ("price" → "Sent you a DM!").
4. Instagram sends every new comment to `/api/webhook/instagram`.
5. The webhook checks keyword rules first; if nothing matches and AI fallback is on for that post, Groq (llama-3.3-70b) writes a short reply.
6. Every reply is logged in the `reply_log` table.

## One-time setup

### 1. Supabase
Run `supabase/schema.sql` in your Supabase project's SQL editor. Grab your project URL and **service role key** (Settings → API) for the env vars.

### 2. Meta Developer App
1. Go to developers.facebook.com → **My Apps** → **Create App** → choose **Business**.
2. In the app dashboard, click **Add Product** → find **Instagram** → **Instagram API with Instagram Login** → **Set up**.
3. Under Instagram API setup, add yourself (your Instagram account) as a **tester** — this lets you use the app before Meta reviews it.
4. Copy the **Instagram App ID** and **Instagram App Secret** into your env vars.
5. Under **Business Login Settings**, set the **OAuth redirect URI** to:
   `https://YOUR-DOMAIN/api/auth/instagram/callback`
6. Under **Webhooks**, subscribe to the `comments` field, with:
   - Callback URL: `https://YOUR-DOMAIN/api/webhook/instagram`
   - Verify token: the same string you put in `IG_WEBHOOK_VERIFY_TOKEN`

### 3. Groq
Get a free API key at console.groq.com → API Keys.

### 4. Deploy
Set all vars from `.env.example` in your Vercel project settings, then deploy. Visit your domain, click **Connect Instagram**, log in with your Instagram credentials, accept the permissions.

### 5. Go live
Post normally. Open the dashboard after posting, refresh, and attach keyword rules to the new post. Comments start getting replies within seconds of the webhook firing.

## Notes
- This is scoped to **your own account only** (self-use), so it doesn't need Meta's full app review — being a tester on your own app is enough.
- Long-lived tokens last 60 days and need refreshing before they expire — `lib/instagram.js` has `refreshLongLivedToken()` ready; wire it into a daily cron (Vercel Cron or a scheduled route) once this is live.
- Comments on posts you haven't imported into the dashboard yet are silently skipped — refresh the dashboard after each new post.
