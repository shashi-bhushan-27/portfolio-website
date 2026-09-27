'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { siteConfig } from '@/lib/constants';
import { buttonStyles } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { LocalTime } from '@/components/ui/local-time';
import { cn } from '@/lib/utils';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const channels = [
  { label: 'GitHub', href: siteConfig.links.github },
  { label: 'LinkedIn', href: siteConfig.links.linkedin },
  { label: 'X / Twitter', href: siteConfig.links.twitter },
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-mono flex justify-between text-fg-faint">
        <span>
          {label}
          {required && <span className="text-signal-ink"> *</span>}
        </span>
        {error && (
          <span id={`${id}-error`} className="normal-case tracking-normal text-danger">
            {error}
          </span>
        )}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function ContactContent() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [state, setState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!isValidEmail(form.email)) errs.email = 'Check the address';
    if (!form.message.trim()) errs.message = 'Required';
    return errs;
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setState('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setState('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setState('error');
    }
  }

  const input = (hasError?: string) =>
    cn(
      'w-full rounded-[4px] border bg-surface/40 px-3.5 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg-faint focus:bg-surface',
      hasError ? 'border-danger/60' : 'border-line'
    );

  return (
    <div className="container-page grid gap-16 lg:grid-cols-12">
      <aside className="lg:col-span-4">
        <dl className="divide-y divide-line border-y border-line">
          <div className="py-5">
            <dt className="label-mono text-fg-faint">Email</dt>
            <dd className="mt-2 flex items-center justify-between gap-3">
              <a href={`mailto:${siteConfig.links.email}`} className="truncate text-fg link-underline">
                {siteConfig.links.email}
              </a>
              <CopyButton value={siteConfig.links.email} showLabel={false} />
            </dd>
          </div>
          <div className="py-5">
            <dt className="label-mono text-fg-faint">Phone</dt>
            <dd className="mt-2">
              <a href={`tel:${siteConfig.phone.replace(/\s/g, '')}`} className="text-fg link-underline">
                {siteConfig.phone}
              </a>
            </dd>
          </div>
          <div className="py-5">
            <dt className="label-mono text-fg-faint">Location</dt>
            <dd className="mt-2 flex items-center justify-between text-fg">
              {siteConfig.location}
              <LocalTime className="font-mono text-[12px] text-fg-muted" />
            </dd>
          </div>
          <div className="py-5">
            <dt className="label-mono text-fg-faint">Elsewhere</dt>
            <dd className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {channels.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
                >
                  {c.label}
                  <ArrowUpRight className="size-3" />
                </a>
              ))}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-sm leading-relaxed text-fg-muted">
          Available for consulting, collaborations, and full-time opportunities.
        </p>
      </aside>

      <div className="lg:col-span-7 lg:col-start-6">
        {state === 'success' ? (
          <div className="border border-line p-8 sm:p-10" role="status">
            <p className="label-mono flex items-center gap-2 text-signal-ink">
              <Check className="size-3.5" /> Sent
            </p>
            <h2 className="mt-4 text-2xl font-medium tracking-[-0.02em] text-fg">
              Thanks — your message is in my inbox.
            </h2>
            <p className="mt-2 text-fg-muted">I&apos;ll get back to you soon.</p>
            <button
              type="button"
              onClick={() => setState('idle')}
              className="label-mono mt-8 text-fg-muted link-underline hover:text-fg"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="name" label="Name" required error={errors.name}>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={onChange}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={input(errors.name)}
                />
              </Field>
              <Field id="email" label="Email" required error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={input(errors.email)}
                />
              </Field>
            </div>
            <Field id="subject" label="Subject">
              <input id="subject" name="subject" value={form.subject} onChange={onChange} className={input()} />
            </Field>
            <Field id="message" label="Message" required error={errors.message}>
              <textarea
                id="message"
                name="message"
                rows={7}
                value={form.message}
                onChange={onChange}
                placeholder="What are you building, and where could I help?"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : undefined}
                className={cn(input(errors.message), 'resize-y')}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-5">
              <button
                type="submit"
                disabled={state === 'submitting'}
                className={buttonStyles({ variant: 'primary', size: 'lg' })}
              >
                {state === 'submitting' ? 'Sending…' : 'Send message'}
                {state !== 'submitting' && <ArrowRight className="size-4" />}
              </button>
              {state === 'error' && (
                <p className="text-sm text-danger" role="alert">
                  Something went wrong. Try again, or email me directly.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
