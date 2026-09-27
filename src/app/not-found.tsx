import Link from 'next/link';
import { LogoMark } from '@/components/ui/logo-mark';
import { buttonStyles } from '@/components/ui/button';
import { siteConfig } from '@/lib/constants';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="container-page flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2.5 text-fg">
          <LogoMark />
          <span className="text-[14px] font-medium">{siteConfig.name}</span>
        </Link>
      </header>
      <div className="container-page flex flex-1 flex-col justify-center py-20">
        <p className="label-mono text-fg-faint">Error 404</p>
        <h1 className="mt-4 text-[clamp(2.5rem,7vw,5rem)] leading-none font-medium tracking-[-0.05em] text-fg">
          Signal lost.
        </h1>
        <p className="mt-5 max-w-md text-fg-muted">
          No route resolves to this address. It may have moved, or it was never here.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className={buttonStyles({ variant: 'primary' })}>
            Back to home
          </Link>
          <Link href="/insights" className={buttonStyles()}>
            Read the blog
          </Link>
        </div>
      </div>
    </main>
  );
}
