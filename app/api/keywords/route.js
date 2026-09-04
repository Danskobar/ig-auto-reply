import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  const { postId, keyword, replyText } = await request.json();
  const { data, error } = await supabase
    .from('keyword_rules')
    .insert({ post_id: postId, keyword, reply_text: replyText })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(request) {
  const { id } = await request.json();
  const { error } = await supabase.from('keyword_rules').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
