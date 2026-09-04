export const metadata = {
  title: 'IG Auto-Reply',
  description: 'Automated Instagram comment replies for MAX'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#0b0b0d', color: '#eee' }}>
        {children}
      </body>
    </html>
  );
}
