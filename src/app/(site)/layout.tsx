import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CommandPalette } from '@/components/layout/command-palette';
import { AiAssistant } from '@/components/chat/ai-assistant';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-[4px] focus:bg-signal focus:px-3 focus:py-2 focus:text-on-signal"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer />
      <CommandPalette />
      <AiAssistant />
    </div>
  );
}
