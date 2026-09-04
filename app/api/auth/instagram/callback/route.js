import { exchangeCodeForToken } from '../../../../../lib/instagram';
import { supabase } from '../../../../../lib/supabase';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`Instagram login failed: ${error}`, { status: 400 });
  }
  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  try {
    const { userId, accessToken, expiresInSeconds } = await exchangeCodeForToken(code);

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // Single-account app: wipe any previous connection, store the new one.
    await supabase.from('ig_account').delete().neq('ig_user_id', '');
    await supabase.from('ig_account').insert({
      ig_user_id: userId,
      access_token: accessToken,
      token_expires_at: expiresAt
    });

    return Response.redirect(new URL('/dashboard/posts', request.url));
  } catch (e) {
    return new Response(`Token exchange failed: ${e.message}`, { status: 500 });
  }
}
