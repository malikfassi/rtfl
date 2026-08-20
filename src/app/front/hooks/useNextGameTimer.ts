import { useEffect, useState } from 'react';

function timeUntilTomorrow(now: Date): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return [hours, minutes, seconds].map(n => n.toString().padStart(2, '0')).join(':');
}

/**
 * `HH:MM:SS` until the next local midnight, ticking every second.
 *
 * The initial value is a fixed placeholder rather than the real remaining time:
 * this renders on the server too, and a computed clock there never matches the
 * one the client computes a moment later. That mismatch fails hydration, and a
 * failed hydration costs the whole page its event handlers - the guess form
 * stops submitting. The first tick fills in the real value immediately.
 */
export function useNextGameTimer(): string {
  const [timer, setTimer] = useState('00:00:00');

  useEffect(() => {
    const update = () => setTimer(timeUntilTomorrow(new Date()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return timer;
}
