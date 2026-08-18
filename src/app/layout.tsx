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
      <head>
        <script
          // Applies the saved/system theme before first paint so there's no
          // flash of the wrong theme on load. Kept as a plain inline script
          // (not a component) specifically so it runs before hydration.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rtfl_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="h-full bg-background">{children}</body>
    </html>
  );
} 