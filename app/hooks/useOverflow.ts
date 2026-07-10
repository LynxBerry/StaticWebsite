import { RefObject, useEffect, useState } from 'react';

/**
 * Reports whether a scroll container's content overflows its visible box.
 *
 * A ResizeObserver alone misses content add/remove when the container has a
 * fixed max-height (its border box doesn't change, only scrollHeight does),
 * so the fade hint could stay stale after filtering/adding words. We pair the
 * ResizeObserver with a MutationObserver on the container's subtree so any
 * content change re-checks overflow.
 */
export function useOverflow(ref: RefObject<HTMLElement | null>) {
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight);
    };

    check();

    const resizeObserver = new ResizeObserver(check);
    resizeObserver.observe(el);

    // Catch content changes (children added/removed/resized) that don't
    // resize the clamped container itself.
    const mutationObserver = new MutationObserver(check);
    mutationObserver.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [ref]);

  return hasOverflow;
}
