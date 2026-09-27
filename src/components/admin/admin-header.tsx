import Link from 'next/link';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { LogoMark } from '@/components/ui/logo-mark';
import { logout } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

const sections = [
  { key: 'articles', label: 'Articles', href: '/admin', live: '/insights' },
  { key: 'videos', label: 'Videos', href: '/admin/videos', live: '/videos' },
] as const;

export type AdminSection = (typeof sections)[number]['key'];

export function AdminHeader({ current }: { current: AdminSection }) {
  const live = sections.find((s) => s.key === current)?.live ?? '/';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="flex h-12 items-center gap-3 px-4">
        <Link href="/admin" className="flex items-center gap-2 text-fg">
          <LogoMark className="size-[18px]" />
          <span className="text-[13px] font-medium">Studio</span>
        </Link>
        <span className="label-mono text-fg-faint">/</span>
        <nav className="flex items-center gap-0.5" aria-label="Studio sections">
          {sections.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              aria-current={s.key === current ? 'page' : undefined}
              className={cn(
                'rounded-[4px] px-2.5 py-1 text-[13px] transition-colors',
                s.key === current ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href={live}
            target="_blank"
            aria-label="Open the live site"
            className="label-mono inline-flex h-8 items-center gap-1 rounded-[4px] px-2.5 text-fg-muted hover:bg-surface hover:text-fg"
          >
            <span className="hidden sm:inline">Live site</span>
            <ArrowUpRight className="size-3" />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="label-mono inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-fg-muted hover:bg-surface hover:text-fg"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
