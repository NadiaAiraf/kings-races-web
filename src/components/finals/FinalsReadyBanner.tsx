import { useId } from 'react';

interface FinalsReadyBannerProps {
  onConfirm: () => void;
}

export function FinalsReadyBanner({ onConfirm }: FinalsReadyBannerProps) {
  const descriptionId = useId();

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-green-50 border border-green-200 rounded-lg p-4"
    >
      <h2 className="text-lg font-semibold text-green-800">Group stage complete</h2>
      <p id={descriptionId} className="text-sm text-green-700 mt-1">
        All races scored with no ties. Ready to begin finals.
      </p>
      <button
        type="button"
        aria-describedby={descriptionId}
        onClick={onConfirm}
        className="w-full bg-blue-600 text-white text-base font-semibold min-h-16 rounded-lg mt-4 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Confirm Finals
      </button>
    </div>
  );
}
