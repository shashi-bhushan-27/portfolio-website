import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon as Github, LinkedinIcon as Linkedin, TwitterIcon as X, InstagramIcon as Instagram } from "@/components/icons";
import { siteConfig } from "@/lib/constants";

const socialLinks = [
  {
    name: "GitHub",
    href: siteConfig.links.github,
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: siteConfig.links.linkedin,
    icon: Linkedin,
  },
  {
    name: "X",
    href: siteConfig.links.twitter,
    icon: X,
  },
  {
    name: "Instagram",
    href: siteConfig.links.instagram,
    icon: Instagram,
  },
  {
    name: "Email",
    href: `mailto:${siteConfig.links.email}`,
    icon: Mail,
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-3 md:gap-8 lg:py-20">
          {/* Column 1: Identity */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block text-lg font-semibold tracking-tight text-foreground transition-colors duration-200 hover:text-foreground/80"
              style={{
                fontFamily:
                  "var(--font-display, var(--font-sans, var(--font-geist-sans)))",
              }}
            >
              SBV
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              Software Engineer &amp; System Designer building intelligent
              systems that understand, locate, and scale.
            </p>
            <p className="text-xs text-muted-foreground/60 tracking-wide">
              {siteConfig.location}
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">
              Navigation
            </h3>
            <nav className="flex flex-col gap-2.5">
              {siteConfig.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground w-fit"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Connect */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">
              Connect
            </h3>
            <div className="flex flex-col gap-2.5">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground w-fit"
                >
                  <link.icon className="h-3.5 w-3.5 transition-colors duration-200" />
                  <span>{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/20 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground/50">
            &copy; 2026 Shashi Bhushan Vijay. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Built with{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200 hover:text-muted-foreground/70"
            >
              Next.js
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
