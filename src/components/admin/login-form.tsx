'use client';

import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { login, type LoginState } from '@/app/admin/actions';
import { buttonStyles } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="label-mono text-fg-faint">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={!!state.error}
          aria-describedby={state.error ? 'login-error' : undefined}
          className={cn(
            'mt-2 h-11 w-full rounded-[4px] border bg-surface/40 px-3 font-mono text-sm text-fg outline-none transition-colors focus:border-fg-faint',
            state.error ? 'border-danger/60' : 'border-line'
          )}
        />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={cn(buttonStyles({ variant: 'primary' }), 'w-full')}
      >
        {pending ? 'Checking…' : 'Continue'}
        {!pending && <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}
