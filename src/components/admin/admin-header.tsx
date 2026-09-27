import Link from 'next/link';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { LogoMark } from '@/components/ui/logo-mark';
import { logout } from '@/app/admin/actions';

export function AdminHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="flex h-12 items-center gap-4 px-4">
        <Link href="/admin" className="flex items-center gap-2 text-fg">
          <LogoMark className="size-[18px]" />
          <span className="text-[13px] font-medium">Studio</span>
        </Link>
        <span className="label-mono text-fg-faint">/</span>
        {children}
        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/insights"
            target="_blank"
            className="label-mono inline-flex h-8 items-center gap-1 rounded-[4px] px-2.5 text-fg-muted hover:bg-surface hover:text-fg"
          >
            Live site <ArrowUpRight className="size-3" />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="label-mono inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-fg-muted hover:bg-surface hover:text-fg"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
