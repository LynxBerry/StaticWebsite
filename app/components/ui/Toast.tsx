'use client';

import { useEffect } from 'react';

export interface ToastData {
  /** Main message, e.g. "已删除 apple". */
  message: string;
  /** Optional action button (e.g. "撤销"). */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** How long to stay visible before auto-dismissing (ms). Default 5000. */
  duration?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

/**
 * Minimal glass-capsule toast that anchors to the bottom-center of the
 * viewport. Used for transient feedback like "已删除" with an optional
 * "撤销" action. Auto-dismisses after `duration` ms; the action button
 * also dismisses after firing.
 *
 * Renders null when no toast is active, so it's safe to mount permanently.
 */
export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, toast.duration ?? 5000);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const handleAction = () => {
    toast.action?.onClick();
    onDismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className="flat-card animate-toast-in pointer-events-auto flex items-center gap-3 px-5 py-3 max-w-full"
      >
        <span className="text-sm text-farm-text">
          {toast.message}
        </span>
        {toast.action && (
          <button
            type="button"
            onClick={handleAction}
            className="text-sm font-semibold text-farm-accent hover:text-sprout-600 transition-colors duration-200 px-2 py-1 -my-1 rounded-full hover:bg-farm-bg"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
