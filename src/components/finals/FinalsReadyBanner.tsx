import { useId } from 'react';
import { useCanEdit } from '../../auth/editAccess';

interface FinalsReadyBannerProps {
  onConfirm: () => void;
}

export function FinalsReadyBanner({ onConfirm }: FinalsReadyBannerProps) {
  const descriptionId = useId();
  const canEdit = useCanEdit();

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-green-50 border border-green-200 rounded-sm p-4"
    >
      <h2 className="text-lg font-semibold text-green-800">Group stage complete</h2>
      <p id={descriptionId} className="text-sm text-green-700 mt-1">
        All races scored with no ties. Ready to begin finals.
      </p>
      {canEdit ? (
        <button
          type="button"
          aria-describedby={descriptionId}
          onClick={onConfirm}
          className="w-full bg-brand-600 text-white text-base font-semibold min-h-16 rounded-sm mt-4 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Confirm Finals
        </button>
      ) : (
        <p className="text-sm text-green-700 mt-2">Waiting for an official to confirm finals.</p>
      )}
    </div>
  );
}
