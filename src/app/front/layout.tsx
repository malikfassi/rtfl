import './globals.css';

import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-background">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 