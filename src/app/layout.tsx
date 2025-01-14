import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RTFL - Song Guessing Game',
  description: 'Daily song guessing game with lyrics',
};

export default function RootLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <html lang="en" className="h-full">
      <body className={`${jetbrainsMono.className} antialiased h-full`}>{children}</body>
    </html>
  );
}
