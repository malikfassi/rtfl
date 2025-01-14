import type { ReactElement } from 'react';

export default function Home(): ReactElement {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-primary">RTFL</h1>
        <div className="space-y-4">
          <p className="text-deep-purple">Deep Purple Text</p>
          <p className="text-royal-purple">Royal Purple Text</p>
          <p className="text-light-purple">Light Purple Text</p>
          <p className="text-pink">Pink Text</p>
          <p className="text-coral">Coral Text</p>
          <p className="text-yellow">Yellow Text</p>
          <p className="text-mint">Mint Text</p>
        </div>
        <div className="p-4 bg-deep-purple/10 rounded-lg">
          <p>JetBrains Mono Font Test: 1Il|0O</p>
          <p className="font-mono">1234567890</p>
          <p className="font-mono">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p className="font-mono">abcdefghijklmnopqrstuvwxyz</p>
        </div>
      </div>
    </main>
  );
}
