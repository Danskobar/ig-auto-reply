export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <h1>IG Auto-Reply</h1>
      <p style={{ color: '#999' }}>Connect your Instagram account to start managing keyword replies.</p>
      <a
        href="/api/auth/instagram"
        style={{
          display: 'inline-block',
          marginTop: 24,
          padding: '12px 24px',
          background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        Connect Instagram
      </a>
      <p style={{ marginTop: 24 }}>
        <a href="/dashboard/posts" style={{ color: '#66b3ff' }}>Already connected? Go to dashboard →</a>
      </p>
    </main>
  );
}
