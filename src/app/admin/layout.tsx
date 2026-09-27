import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Studio', template: '%s · Studio' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-bg text-fg">{children}</div>;
}
