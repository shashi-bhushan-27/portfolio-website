import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoMark } from '@/components/ui/logo-mark';
import { LoginForm } from '@/components/admin/login-form';
import { adminConfigured } from '@/lib/auth';

export const metadata: Metadata = { title: 'Sign in' };

// Configuration comes from runtime env, so never prerender this page.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const configured = adminConfigured();

  return (
    <main className="grid min-h-dvh place-items-center bg-blueprint px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 text-fg">
          <LogoMark />
          <span className="text-sm font-medium">Studio</span>
        </Link>

        <div className="crosshairs mt-8 border border-line bg-bg p-6">
          <h1 className="text-xl font-medium tracking-[-0.02em]">Sign in</h1>
          <p className="mt-1.5 text-sm text-fg-muted">Writing desk for the Insights blog.</p>
          {configured ? (
            <LoginForm />
          ) : (
            <div className="mt-6 border border-warn/40 bg-warn/5 p-4 text-sm leading-relaxed text-fg-muted">
              <p className="font-medium text-fg">Admin isn&apos;t configured yet.</p>
              <p className="mt-2">
                Set <code className="font-mono text-[12px] text-fg">ADMIN_PASSWORD</code> and{' '}
                <code className="font-mono text-[12px] text-fg">ADMIN_SESSION_SECRET</code> (32+
                characters) in your environment, then restart.
              </p>
            </div>
          )}
        </div>
        <p className="label-mono mt-4 text-fg-faint">Sessions last 7 days.</p>
      </div>
    </main>
  );
}
