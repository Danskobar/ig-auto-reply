import { createClient } from '@supabase/supabase-js';

// Service role key — this file is only ever imported in server-side code
// (API routes / server components), never shipped to the browser.
//
// Lazily created on first real use (not at module load / build time).
// Creating this eagerly crashes the Next.js build when env vars aren't
// set yet, because @supabase/supabase-js throws synchronously on an
// empty URL — and that happens during Vercel's static "collect page
// data" pass, before any request ever comes in.
let _client = null;

function getClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

// Proxy so existing `supabase.from(...)` call sites don't need to change —
// each property access lazily creates the real client first.
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getClient()[prop];
    }
  }
);
