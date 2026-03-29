interface FinalsBlockedBannerProps {
  reason: 'incomplete' | 'ties';
}

const MESSAGES: Record<FinalsBlockedBannerProps['reason'], string> = {
  incomplete: 'Complete all group stage races to unlock finals.',
  ties: 'Resolve tied standings in groups before proceeding to finals.',
};

export function FinalsBlockedBanner({ reason }: FinalsBlockedBannerProps) {
  return (
    <div
      role="status"
      className="bg-slate-100 border border-slate-200 rounded-lg p-4"
    >
      <p className="text-base text-slate-500">{MESSAGES[reason]}</p>
    </div>
  );
}
