import { supabase } from '../../../../lib/supabase';
import { replyToComment, sendPrivateReply } from '../../../../lib/instagram';
import { generateReply } from '../../../../lib/groq';

// Meta calls this once when you register the webhook URL in the app dashboard.
export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.IG_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// Meta POSTs here every time someone comments on one of your posts.
export async function POST(request) {
  const body = await request.json();

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'comments') continue;
        await handleComment(change.value);
      }
    }
  } catch (e) {
    console.error('Webhook processing error:', e);
    // Still return 200 — Meta retries aggressively on non-200s and we don't
    // want a single bad comment to trigger a retry storm.
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
}

async function handleComment(value) {
  const { id: commentId, text, media, from } = value;
  if (!text || !media?.id) return;

  const { data: account } = await supabase
    .from('ig_account')
    .select('ig_user_id, access_token')
    .limit(1)
    .single();
  if (!account) return;

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('ig_media_id', media.id)
    .single();
  if (!post) return; // comment on a post we haven't imported/configured — skip

  // --- DM mode: if enabled for this post, EVERY comment gets the link DM'd,
  // no keyword matching, no AI, your own written text. Takes priority. ---
  if (post.dm_enabled && post.dm_message_text) {
    const dmText = post.dm_link_url
      ? `${post.dm_message_text}\n${post.dm_link_url}`
      : post.dm_message_text;

    try {
      await sendPrivateReply(account.ig_user_id, commentId, dmText, account.access_token);
      await replyToComment(commentId, post.public_ack_text, account.access_token);

      await supabase.from('reply_log').insert({
        ig_comment_id: commentId,
        post_id: post.id,
        commenter_username: from?.username,
        comment_text: text,
        reply_sent: `[DM] ${dmText} | [comment] ${post.public_ack_text}`,
        reply_source: 'dm_link'
      });
    } catch (e) {
      console.error('DM send failed:', e.message);
      // Common cause: the 7-day / once-per-comment window on private replies has passed.
      await supabase.from('reply_log').insert({
        ig_comment_id: commentId,
        post_id: post.id,
        commenter_username: from?.username,
        comment_text: text,
        reply_sent: null,
        reply_source: 'dm_failed'
      });
    }
    return;
  }

  // --- Fallback: keyword rules + optional AI reply (unchanged) ---
  const { data: rules } = await supabase
    .from('keyword_rules')
    .select('*')
    .eq('post_id', post.id);

  const lowerText = text.toLowerCase();
  const matchedRule = (rules || []).find(r =>
    lowerText.includes(r.keyword.toLowerCase())
  );

  let replyText;
  let source;

  if (matchedRule) {
    replyText = matchedRule.reply_text;
    source = 'rule';
  } else if (post.ai_fallback_enabled) {
    replyText = await generateReply({
      commentText: text,
      postCaption: post.caption,
      extraContext: post.ai_context
    });
    source = 'ai';
  } else {
    return; // no match, AI fallback off for this post — stay silent
  }

  await replyToComment(commentId, replyText, account.access_token);

  await supabase.from('reply_log').insert({
    ig_comment_id: commentId,
    post_id: post.id,
    commenter_username: from?.username,
    comment_text: text,
    matched_rule_id: matchedRule?.id || null,
    reply_sent: replyText,
    reply_source: source
  });
}
