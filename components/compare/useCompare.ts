"use client";

import { useCallback, useState } from "react";

/**
 * Selection state for a two-way comparison.
 *
 * Picking a third replaces the oldest rather than refusing, so you can walk a
 * list swapping one side without having to clear first. The dialog opens on
 * demand from the tray — not automatically on the second pick, which would fire
 * while you were still browsing.
 */
export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const toggle = useCallback((id: string) => {
    setIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 2
          ? [prev[1], id]
          : [...prev, id],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    setOpen(false);
  }, []);

  return {
    ids,
    isPicked: (id: string) => ids.includes(id),
    toggle,
    remove,
    clear,
    ready: ids.length === 2,
    open,
    show: () => setOpen(true),
    hide: useCallback(() => setOpen(false), []),
  };
}
