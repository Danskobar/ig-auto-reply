'use client';

import { useEffect, useState } from 'react';

export default function PostsDashboard() {
  const [posts, setPosts] = useState([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({}); // postId -> { keyword, replyText }

  async function load() {
    setLoading(true);
    const res = await fetch('/api/posts');
    const data = await res.json();
    setConnected(data.connected);
    setPosts(data.posts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addRule(postId) {
    const draft = drafts[postId];
    if (!draft?.keyword || !draft?.replyText) return;
    await fetch('/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, keyword: draft.keyword, replyText: draft.replyText })
    });
    setDrafts(prev => ({ ...prev, [postId]: { keyword: '', replyText: '' } }));
    load();
  }

  async function removeRule(id) {
    await fetch('/api/keywords', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    load();
  }

  async function toggleAi(postId, current) {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, ai_fallback_enabled: !current })
    });
    load();
  }

  async function toggleDm(postId, current) {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, dm_enabled: !current })
    });
    load();
  }

  async function saveDmField(postId, field, value) {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, [field]: value })
    });
    load();
  }

  if (loading) return <main style={{ padding: 24 }}>Loading...</main>;
  if (!connected) {
    return (
      <main style={{ padding: 24, textAlign: 'center' }}>
        <p>No Instagram account connected yet.</p>
        <a href="/api/auth/instagram" style={{ color: '#66b3ff' }}>Connect Instagram</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h1>Your posts</h1>
      <p style={{ color: '#999' }}>New posts pulled from Instagram appear here automatically — refresh after posting.</p>
      <button onClick={load} style={{ marginBottom: 24, padding: '8px 16px', cursor: 'pointer' }}>
        Refresh posts
      </button>

      {posts.map(post => (
        <div key={post.id} style={{ border: '1px solid #333', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', gap: 16 }}>
          {post.thumbnail_url && (
            <img src={post.thumbnail_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: '#ccc', fontSize: 14 }}>{(post.caption || '').slice(0, 100)}</p>
            <a href={post.permalink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#66b3ff' }}>
              View on Instagram
            </a>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={post.ai_fallback_enabled}
                  onChange={() => toggleAi(post.id, post.ai_fallback_enabled)}
                />{' '}
                AI reply for comments that don't match a keyword
              </label>
            </div>

            <div style={{ marginTop: 16, padding: 12, border: '1px dashed #555', borderRadius: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={post.dm_enabled}
                  onChange={() => toggleDm(post.id, post.dm_enabled)}
                />{' '}
                DM the link to EVERY commenter on this post
              </label>
              {post.dm_enabled && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    placeholder="Link to send (e.g. https://...)"
                    defaultValue={post.dm_link_url || ''}
                    onBlur={e => saveDmField(post.id, 'dm_link_url', e.target.value)}
                    style={{ padding: 6 }}
                  />
                  <textarea
                    placeholder="Your DM message (the link is appended automatically on a new line)"
                    defaultValue={post.dm_message_text || ''}
                    onBlur={e => saveDmField(post.id, 'dm_message_text', e.target.value)}
                    rows={2}
                    style={{ padding: 6 }}
                  />
                  <input
                    placeholder="Public reply shown under their comment"
                    defaultValue={post.public_ack_text || 'Sent you the link in your DMs! 📩'}
                    onBlur={e => saveDmField(post.id, 'public_ack_text', e.target.value)}
                    style={{ padding: 6 }}
                  />
                  <span style={{ fontSize: 11, color: '#888' }}>
                    While this is on, every comment gets the DM — keyword rules below are skipped for this post.
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              {(post.keyword_rules || []).map(rule => (
                <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>"{rule.keyword}" → {rule.reply_text}</span>
                  <button onClick={() => removeRule(rule.id)} style={{ color: '#f66', background: 'none', border: 'none', cursor: 'pointer' }}>
                    remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <input
                placeholder="keyword"
                value={drafts[post.id]?.keyword || ''}
                onChange={e => setDrafts(prev => ({ ...prev, [post.id]: { ...prev[post.id], keyword: e.target.value } }))}
                style={{ flex: '0 0 100px', padding: 6 }}
              />
              <input
                placeholder="reply text"
                value={drafts[post.id]?.replyText || ''}
                onChange={e => setDrafts(prev => ({ ...prev, [post.id]: { ...prev[post.id], replyText: e.target.value } }))}
                style={{ flex: 1, padding: 6 }}
              />
              <button onClick={() => addRule(post.id)} style={{ padding: '6px 12px', cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
