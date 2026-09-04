const GRAPH_BASE = 'https://graph.instagram.com';

// Exchange the short-lived code from OAuth for a token, then upgrade it to
// a long-lived (60 day) token in one flow.
export async function exchangeCodeForToken(code) {
  const form = new URLSearchParams({
    client_id: process.env.IG_APP_ID,
    client_secret: process.env.IG_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.IG_REDIRECT_URI,
    code
  });

  const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: form
  });
  const shortData = await shortRes.json();
  if (!shortRes.ok) throw new Error(JSON.stringify(shortData));

  const longRes = await fetch(
    `${GRAPH_BASE}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.IG_APP_SECRET}&access_token=${shortData.access_token}`
  );
  const longData = await longRes.json();
  if (!longRes.ok) throw new Error(JSON.stringify(longData));

  return {
    userId: shortData.user_id,
    accessToken: longData.access_token,
    expiresInSeconds: longData.expires_in // ~5,184,000 (60 days)
  };
}

export async function refreshLongLivedToken(accessToken) {
  const res = await fetch(
    `${GRAPH_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data; // { access_token, expires_in }
}

export async function fetchRecentMedia(accessToken, limit = 12) {
  const res = await fetch(
    `${GRAPH_BASE}/me/media?fields=id,caption,permalink,thumbnail_url,media_url,media_type,timestamp&limit=${limit}&access_token=${accessToken}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.data;
}

export async function replyToComment(commentId, message, accessToken) {
  const res = await fetch(
    `${GRAPH_BASE}/${commentId}/replies?access_token=${accessToken}`,
    { method: 'POST', body: new URLSearchParams({ message }) }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Sends a DM to the commenter, triggered by their comment ("private reply").
// Only works within 7 days of the comment and once per comment — an Instagram
// platform limit, not something this code controls.
export async function sendPrivateReply(igUserId, commentId, message, accessToken) {
  const res = await fetch(`${GRAPH_BASE}/${igUserId}/messages?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text: message }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}
