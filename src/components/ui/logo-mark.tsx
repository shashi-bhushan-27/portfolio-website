import { cn } from '@/lib/utils';

/** Beacon mark: a frame, a transmitter, and one wavefront. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn('size-5 shrink-0', className)}
    >
      <rect
        x="0.5"
        y="0.5"
        width="19"
        height="19"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      <path
        d="M5.5 12.5a4.5 4.5 0 0 1 9 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="10" cy="12.5" r="1.75" className="fill-signal" />
    </svg>
  );
}
