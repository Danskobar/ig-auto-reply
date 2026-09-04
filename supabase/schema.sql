-- Single-account setup: stores the one connected Instagram account's token
create table if not exists ig_account (
  id uuid primary key default gen_random_uuid(),
  ig_user_id text not null,
  username text,
  access_token text not null,
  token_expires_at timestamptz,
  connected_at timestamptz default now()
);

-- Posts you've dropped, pulled from Instagram, with per-post keyword rules
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  ig_media_id text unique not null,
  caption text,
  permalink text,
  thumbnail_url text,
  posted_at timestamptz,
  ai_fallback_enabled boolean default true,
  ai_context text, -- optional extra instructions for the AI fallback on this specific post
  created_at timestamptz default now()
);

-- Keyword -> reply rules, scoped to one post
create table if not exists keyword_rules (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  keyword text not null,       -- matched case-insensitively, substring match
  reply_text text not null,
  created_at timestamptz default now()
);

-- Log of every comment we saw and how we responded, for auditing/debugging
create table if not exists reply_log (
  id uuid primary key default gen_random_uuid(),
  ig_comment_id text,
  post_id uuid references posts(id),
  commenter_username text,
  comment_text text,
  matched_rule_id uuid references keyword_rules(id),
  reply_sent text,
  reply_source text, -- 'rule' | 'ai' | 'skipped'
  created_at timestamptz default now()
);

create index if not exists idx_keyword_rules_post on keyword_rules(post_id);
create index if not exists idx_posts_media_id on posts(ig_media_id);
