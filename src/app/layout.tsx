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
    <html lang="en" className="h-full">
      <body className="h-full bg-background">{children}</body>
    </html>
  );
} 