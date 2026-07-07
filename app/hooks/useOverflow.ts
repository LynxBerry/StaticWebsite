import { RefObject, useEffect, useState } from 'react';

export function useOverflow(ref: RefObject<HTMLElement | null>) {
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight);
    };

    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => observer.disconnect();
  }, [ref]);

  return hasOverflow;
}
