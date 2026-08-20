// The scheduler owns its own viewport lock and surfaces, the same way the game
// and archive pages do - this layout no longer imposes a light-theme shell.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
