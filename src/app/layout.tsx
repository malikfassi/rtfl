import './globals.css';

export const metadata = {
  title: 'RTFL',
  description: 'Read the F***ing Lyrics!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `dark` is static: the app is dark-only since the 2026 redesign, so
    // there's no theme to detect. It stays on <html> because the legacy
    // token set (still used by admin and the shared ui/* primitives) defines
    // its dark values under a `.dark` block.
    <html lang="en" className="h-full dark">
      <body className="h-full bg-rtfl-bg text-rtfl-ink">{children}</body>
    </html>
  );
} 