import { clsx } from 'clsx';

interface DisclosureTriangleProps {
  open: boolean;
  className?: string;
}

/**
 * Points right when collapsed and down when open. Decorative: the button
 * that holds it carries aria-expanded. Colour comes from currentColor.
 */
export function DisclosureTriangle({ open, className }: DisclosureTriangleProps) {
  return (
    <svg
      aria-hidden="true"
      data-state={open ? 'open' : 'closed'}
      viewBox="0 0 12 12"
      fill="currentColor"
      className={clsx(
        'size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none',
        open && 'rotate-90',
        className
      )}
    >
      <path d="M4 1.5 10 6l-6 4.5z" />
    </svg>
  );
}
