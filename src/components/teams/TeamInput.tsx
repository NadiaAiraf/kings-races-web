import { useState } from 'react';
import { clsx } from 'clsx';

interface TeamInputProps {
  onAdd: (name: string) => void;
  disabled?: boolean;
  error?: string;
}

export function TeamInput({ onAdd, disabled, error }: TeamInputProps) {
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const canAdd = trimmed.length > 0 && !disabled;

  const handleSubmit = () => {
    if (!canAdd) return;
    onAdd(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Team name"
          disabled={disabled}
          className="flex-1 h-12 text-base px-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canAdd}
          className={clsx(
            'h-12 px-4 text-sm font-semibold rounded-lg min-w-[100px] bg-blue-600 text-white',
            !canAdd && 'opacity-40 cursor-not-allowed'
          )}
        >
          Add Team
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
