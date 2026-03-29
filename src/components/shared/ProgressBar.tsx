interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-500">
          {total > 0 ? `Race ${current} of ${total}` : 'No races yet'}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={total > 0 ? `Race ${current} of ${total}` : 'No races yet'}
        className="h-1 w-full bg-slate-200 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
