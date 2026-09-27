"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo-mark";
import { LocalTime } from "@/components/ui/local-time";
import { openCommandPalette } from "@/components/layout/command-palette";
import { useIsClient, useScrolledPast } from "@/lib/hooks";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();
  // The stored theme is unknown on the server; stay on the server's answer until hydrated.
  const dark = !mounted || resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      className={cn(
        "flex size-8 items-center justify-center rounded-[4px] text-fg-muted transition-colors hover:bg-surface hover:text-fg",
        className
      )}
    >
      {mounted ? (
        dark ? <Sun className="size-4" /> : <Moon className="size-4" />
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const scrolled = useScrolledPast(12);
  const isClient = useIsClient();
  const [open, setOpen] = useState(false);
  const modKey = isClient && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300",
          scrolled || open
            ? "border-line bg-bg/80 backdrop-blur-md backdrop-saturate-150"
            : "border-transparent bg-transparent"
        )}
      >
        <nav className="container-page flex h-14 items-center gap-6" aria-label="Primary">
          <Link href="/" onClick={() => setOpen(false)} className="group flex items-center gap-2.5 text-fg">
            <LogoMark />
            <span className="text-[14px] font-medium tracking-[-0.01em]">
              {siteConfig.name}
            </span>
          </Link>

          <ul className="ml-auto hidden items-center lg:flex">
            {siteConfig.navigation.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] transition-colors",
                      active ? "text-fg" : "text-fg-muted hover:text-fg"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1 bg-signal transition-opacity",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <LocalTime className="label-mono mr-2 hidden text-fg-faint xl:block" />
            <button
              type="button"
              onClick={openCommandPalette}
              className="flex h-8 items-center gap-2 rounded-[4px] border border-line px-2 text-fg-muted transition-colors hover:border-border hover:text-fg"
              aria-label="Open command menu"
            >
              <Search className="size-3.5" />
              <kbd className="hidden font-mono text-[11px] sm:inline">{modKey} K</kbd>
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex size-8 items-center justify-center rounded-[4px] text-fg-muted hover:text-fg lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-bg pt-14 lg:hidden"
          >
            <ul className="container-page mt-6 border-t border-line">
              {siteConfig.navigation.map((item, i) => {
                const active = isActive(pathname, item.href);
                return (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i, duration: 0.25 }}
                    className="border-b border-line"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 py-4"
                    >
                      <span className="label-mono w-6 text-fg-faint">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "text-3xl font-medium tracking-[-0.03em]",
                          active ? "text-fg" : "text-fg-muted"
                        )}
                      >
                        {item.name}
                      </span>
                      {active && <span className="ml-auto size-1.5 self-center bg-signal" />}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
            <div className="container-page mt-8 flex items-center justify-between">
              <span className="label-mono text-fg-faint">{siteConfig.location}</span>
              <LocalTime className="label-mono text-fg-faint" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
