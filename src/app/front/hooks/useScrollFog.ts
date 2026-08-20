import { useEffect, useState, type RefObject } from 'react';

export interface ScrollFog {
  showTop: boolean;
  showBottom: boolean;
}

/**
 * Tracks whether a scroll container has content hidden above or below, so the
 * caller can fade its edges.
 *
 * A plain scroll listener is not enough: the lyrics body rewrites itself in
 * place as words are revealed, changing scrollHeight without any scroll event.
 * The MutationObserver is what keeps the bottom fog honest after a guess.
 */
export function useScrollFog(ref: RefObject<HTMLElement | null>): ScrollFog {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowTop(scrollTop > 0);
      setShowBottom(scrollTop < scrollHeight - clientHeight - 1);
    };

    container.addEventListener('scroll', handleScroll);
    const observer = new MutationObserver(handleScroll);
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [ref]);

  return { showTop, showBottom };
}
