# Project Handoff Context

## 1. Project Vision
A premium, high-performance software engineering portfolio for Shashi Bhushan Vijay. The design aesthetic is minimalist, editorial, and prioritizes "Engineering > Academics" and "Projects > Skills". The goal is to showcase technical depth, patent ownership, and production-level architecture through a "wow-factor" user interface.

## 2. Architecture Decisions
- **Framework**: Next.js 16.2 (App Router) using Turbopack for compilation.
- **Rendering**: Static Site Generation (SSG) via `generateStaticParams` for blazing-fast edge delivery. Dynamic API routes for the contact form and AI assistant.
- **Styling**: Tailwind CSS v4 paired with Framer Motion for sophisticated, scroll-triggered micro-animations.
- **Database**: Neon Serverless PostgreSQL, managed via Prisma ORM v5. Hydrates static pages at build time.
- **State/Interactive**: Client components heavily utilized for interactive UI elements (`motion.div`, `useChat`).

## 3. Database Schema
- **Project**: Represents engineering case studies (slug, title, domain, role, excerpt, content, architecture, metrics, links).
- **Insight**: Represents technical articles/research (slug, title, date, readTime, excerpt, content, tags).
- **Milestone**: Represents timeline events (year, title, description).

## 4. Folder Structure
```text
/src
  /app           # Next.js App Router (Pages, Layout, API Routes)
  /components    # React Components (UI, Chat, Contact, Home, Work)
  /lib           # Utilities, Constants, Prisma Client
  /prisma        # Prisma schema and seed scripts
/public
  /images        # Static assets (now migrated to Cloudinary)
  /resume        # Resume PDF
```

## 5. Design System
- **Typography**: `Inter` (Sans), `JetBrains Mono` (Code), `Outfit` (Display/Headings).
- **Colors**: Deep dark mode background (`oklch(0.145 0 0)`) with coral/amber gradient accents. High-contrast foregrounds for readability.
- **Effects**: Premium scrollbar, CSS-based glassmorphism (`.glass`), smooth interactive element transitions, and semantic container padding.

## 6. Completed Integrations (Phase 5)
- **Cloudinary**: Assets are served via a global CDN.
- **Resend**: Transactional emails routed from the Contact form.
- **Groq AI**: Personal embedded assistant powered by `llama-3.1-8b-instant`.
- **Google Analytics 4**: Pageview tracking via `@next/third-parties/google`.

## 7. Remaining Tasks / Next Steps
- **Custom Domain Integration**: Purchasing a domain, mapping it to Vercel, and verifying it in Resend.
- **Google Search Console**: Submitting the sitemap for indexing.
- **Content Expansion**: Adding new case studies or insights via Prisma Studio.

## 8. Technical Debt
- **Image Optimization**: Currently relying on standard Next.js `<Image>`. As the portfolio grows, integrating `next-cloudinary` could yield better auto-cropping and format selection.
- **Analytics Event Tracking**: GA4 is tracking pageviews, but custom event triggers (like tracking "Resume Downloads" or "AI Chat Initiations") have not been explicitly coded yet.

## 9. Next Maintainer Instructions
- Run `npm run dev` for local development.
- Run `npx prisma studio` to manage the database content visually.
- Do NOT rewrite the styling to standard CSS or CSS modules; strictly adhere to Tailwind v4.
- Preserve the existing `.env` structure. Ensure the Neon pooled connection string is used in production.
