'use client';

import { motion, useInView } from 'motion/react';
import { useRef, useState, type FormEvent } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GithubIcon as Github, LinkedinIcon as Linkedin, TwitterIcon as X } from '@/components/icons';
import { siteConfig } from '@/lib/constants';

/* ─── Animation wrapper ─── */
function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */
const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: siteConfig.links.email,
    href: `mailto:${siteConfig.links.email}`,
  },
  {
    icon: Phone,
    label: 'Phone',
    value: siteConfig.phone,
    href: `tel:${siteConfig.phone.replace(/\s/g, '')}`,
  },
  {
    icon: MapPin,
    label: 'Location',
    value: siteConfig.location,
    href: undefined,
  },
];

const socials = [
  { icon: Github, href: siteConfig.links.github, label: 'GitHub' },
  { icon: Linkedin, href: siteConfig.links.linkedin, label: 'LinkedIn' },
  { icon: X, href: siteConfig.links.twitter, label: 'X' },
];

/* ─── Form helpers ─── */
type FormState = 'idle' | 'submitting' | 'success' | 'error';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ─── Component ─── */
export function ContactContent() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [state, setState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email';
    if (!form.message.trim()) errs.message = 'Message is required';
    return errs;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e: FormEvent) {
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

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      setState('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error(error);
      setState('error');
    }
  }

  const inputClass =
    'w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow';

  return (
    <div className="section-padding">
      <div className="container-custom max-w-5xl">
        {/* ── Header ── */}
        <FadeIn>
          <h1 className="font-display text-5xl font-bold tracking-tight">
            Contact
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Have a project in mind, an engineering challenge to discuss, or just
            want to connect? I&apos;d love to hear from you.
          </p>
        </FadeIn>

        {/* ── Split layout ── */}
        <div className="mt-16 grid gap-12 lg:grid-cols-5">
          {/* ── Left: Info ── */}
          <FadeIn className="lg:col-span-2 space-y-10" delay={0.1}>
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Get in Touch
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                I&apos;m available for consulting, collaborations, and full-time
                opportunities. Feel free to reach out through any of the
                channels below.
              </p>
            </div>

            {/* Contact items */}
            <div className="space-y-5">
              {contactInfo.map((c) => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <c.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60">
                      {c.label}
                    </p>
                    {c.href ? (
                      <a
                        href={c.href}
                        className="text-sm text-foreground transition-colors hover:text-primary"
                      >
                        {c.value}
                      </a>
                    ) : (
                      <p className="text-sm text-foreground">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-10 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </FadeIn>

          {/* ── Right: Form ── */}
          <FadeIn className="lg:col-span-3" delay={0.2}>
            {state === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card p-12 text-center"
              >
                <CheckCircle2 className="size-10 text-emerald-500" />
                <h3 className="mt-4 font-display text-xl font-semibold">
                  Message Sent
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thanks for reaching out. I&apos;ll get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => setState('idle')}
                  className="mt-6 text-sm text-primary transition-colors hover:text-primary/80"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5 rounded-2xl border border-border/50 bg-card p-8 lg:p-10"
              >
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground/70"
                  >
                    Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  {errors.name && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="size-3" /> {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground/70"
                  >
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="size-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground/70"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="What's this about?"
                    value={form.subject}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground/70"
                  >
                    Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell me about your project or idea..."
                    value={form.message}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                  />
                  {errors.message && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="size-3" /> {errors.message}
                    </p>
                  )}
                </div>

                {/* Error banner */}
                {state === 'error' && (
                  <p className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="size-4" /> Something went wrong.
                    Please try again.
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {state === 'submitting' ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
