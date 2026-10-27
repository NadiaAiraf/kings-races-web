import { useEffect, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface ConfirmDialogProps {
  triggerLabel: string;
  title: string;
  /** Says exactly what will be lost. */
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  /** Applied to the trigger button. */
  className?: string;
}

export const CONFIRM_GUARD_MS = 500;

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  onConfirm,
  className,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const openedAt = useRef(0);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleOpen = () => {
    openedAt.current = Date.now();
    setOpen(true);
  };

  const handleConfirm = () => {
    // A habitual double tap on the trigger lands here; ignore it.
    if (Date.now() - openedAt.current < CONFIRM_GUARD_MS) return;
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={clsx(
          'min-h-14 px-4 rounded-sm font-semibold text-sm bg-slate-100 text-slate-600',
          className
        )}
      >
        {triggerLabel}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full max-w-sm bg-white rounded-sm p-4 shadow-lg flex flex-col gap-3"
          >
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            <p id={descId} className="text-sm text-slate-600">
              {description}
            </p>
            <div className="flex gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 min-h-11 rounded-sm bg-slate-100 text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 min-h-11 rounded-sm bg-red-600 text-white font-semibold text-sm"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
