interface ExportButtonProps {
  disabled: boolean;
  onExport: () => void;
}

export function ExportButton({ disabled, onExport }: ExportButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onExport}
      className={`w-full bg-blue-600 text-white text-base font-semibold min-h-14 rounded-lg flex items-center justify-center gap-2 ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
      aria-disabled={disabled ? 'true' : undefined}
      aria-label={
        disabled
          ? 'Export CSV - complete finals to export results'
          : 'Export CSV'
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export CSV
    </button>
  );
}
