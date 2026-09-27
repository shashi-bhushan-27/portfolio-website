import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { CopyButton } from "@/components/ui/copy-button";
import { LocalTime } from "@/components/ui/local-time";

const elsewhere = [
  { name: "GitHub", href: siteConfig.links.github },
  { name: "LinkedIn", href: siteConfig.links.linkedin },
  { name: "X / Twitter", href: siteConfig.links.twitter },
  { name: "YouTube", href: siteConfig.links.youtube },
  { name: "Instagram", href: siteConfig.links.instagram },
];

const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
const branch = process.env.VERCEL_GIT_COMMIT_REF;

export function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="container-page">
        <div className="grid gap-12 py-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="label-mono text-fg-faint">Contact</p>
            <a
              href={`mailto:${siteConfig.links.email}`}
              className="mt-4 block text-[clamp(1.4rem,3.2vw,2.25rem)] font-medium tracking-[-0.03em] text-fg transition-colors hover:text-signal-ink"
            >
              {siteConfig.links.email}
            </a>
            <div className="mt-4 flex items-center gap-5 text-[13px]">
              <CopyButton value={siteConfig.links.email} label="Copy address" />
              <Link href="/contact" className="text-fg-muted link-underline hover:text-fg">
                Or use the form
              </Link>
            </div>
          </div>

          <nav className="md:col-span-2" aria-label="Footer">
            <p className="label-mono text-fg-faint">Index</p>
            <ul className="mt-4 space-y-2 text-[13px]">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-fg-muted transition-colors hover:text-fg">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <p className="label-mono text-fg-faint">Elsewhere</p>
            <ul className="mt-4 space-y-2 text-[13px]">
              {elsewhere.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-fg-muted transition-colors hover:text-fg"
                  >
                    {link.name}
                    <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
              <li>
                <a href="/feed.xml" className="text-fg-muted transition-colors hover:text-fg">
                  RSS
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="label-mono text-fg-faint">Colophon</p>
            <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">
              Next.js, Three.js, Postgres. Set in Geist &amp; Geist&nbsp;Mono.
            </p>
            <p className="mt-3 font-mono text-[11px] text-fg-faint">
              {commit ? (
                <>
                  build {commit}
                  {branch ? ` · ${branch}` : ""}
                </>
              ) : (
                "build local"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 label-mono text-fg-faint">
          <span>© {new Date().getFullYear()} {siteConfig.name}</span>
          <span className="flex items-center gap-3">
            {siteConfig.location}
            <span aria-hidden>·</span>
            <LocalTime />
          </span>
        </div>
      </div>
    </footer>
  );
}
