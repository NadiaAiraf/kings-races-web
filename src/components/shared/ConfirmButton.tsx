import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}

export function ConfirmButton({ label, confirmLabel, onConfirm, className }: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const handleClick = () => {
    if (confirming) {
      setConfirming(false);
      onConfirm();
    } else {
      setConfirming(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'min-h-14 px-4 rounded-lg font-semibold text-sm transition-colors',
        confirming
          ? 'bg-red-600 text-white'
          : 'bg-slate-100 text-slate-600',
        className
      )}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}
