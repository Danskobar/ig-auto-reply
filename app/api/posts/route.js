import { supabase } from '../../../lib/supabase';
import { fetchRecentMedia } from '../../../lib/instagram';

export async function GET() {
  const { data: account } = await supabase
    .from('ig_account')
    .select('access_token')
    .limit(1)
    .single();

  if (!account) {
    return Response.json({ connected: false, posts: [] });
  }

  const media = await fetchRecentMedia(account.access_token);

  // Upsert each into our posts table so keyword rules have somewhere to attach to
  for (const m of media) {
    await supabase.from('posts').upsert(
      {
        ig_media_id: m.id,
        caption: m.caption || '',
        permalink: m.permalink,
        thumbnail_url: m.thumbnail_url || m.media_url,
        posted_at: m.timestamp
      },
      { onConflict: 'ig_media_id' }
    );
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*, keyword_rules(*)')
    .order('posted_at', { ascending: false });

  return Response.json({ connected: true, posts });
}

export async function PATCH(request) {
  const { postId, ai_fallback_enabled, ai_context, dm_enabled, dm_link_url, dm_message_text, public_ack_text } = await request.json();
  const updates = {};
  if (ai_fallback_enabled !== undefined) updates.ai_fallback_enabled = ai_fallback_enabled;
  if (ai_context !== undefined) updates.ai_context = ai_context;
  if (dm_enabled !== undefined) updates.dm_enabled = dm_enabled;
  if (dm_link_url !== undefined) updates.dm_link_url = dm_link_url;
  if (dm_message_text !== undefined) updates.dm_message_text = dm_message_text;
  if (public_ack_text !== undefined) updates.public_ack_text = public_ack_text;

  const { error } = await supabase.from('posts').update(updates).eq('id', postId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
