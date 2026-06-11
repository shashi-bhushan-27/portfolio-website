# Project Context & Handoff Document

This document serves as the single source of truth for the portfolio website of Shashi Bhushan Vijay. It must be read before any architectural or implementation changes are made.

## 1. Project Vision

**Goal:** Create a premium, production-grade engineering portfolio for Shashi Bhushan Vijay, showcasing his work in AI, Machine Learning, Systems Design, and Edge Computing.
**Aesthetics:** Premium, minimalist, editorial, high-end "Engineering > Academics", "Projects > Skills". The goal is to evoke the feeling: "This engineer builds complex systems and understands architecture."
**Tone:** Confident, concise, data-driven, avoiding typical "student portfolio" tropes.

## 2. Architecture Decisions

- **Framework:** Next.js 16.2 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (using the `@import 'tailwindcss'` pattern with inline `@theme` configuration).
- **Animations:** `motion/react` (Framer Motion v12). All animated components must use the `'use client'` directive.
- **Data Strategy:** Phase 1 (current) is static-first, using `lib/constants.ts` and `lib/sample-articles.ts` as the data store. Phase 4 will introduce a Postgres database (Neon) with Prisma ORM.
- **Icons:** We are using custom SVG icons for brand icons (GitHub, LinkedIn, X, Instagram) in `components/icons.tsx` because `lucide-react` deprecated them. Standard UI icons continue to use `lucide-react`.

## 3. Database Schema (Planned)

The project is currently entirely static. The planned schema for Neon via Prisma includes:
- `Project`: id, title, slug, excerpt, content, domain, coverGradient, isFeatured
- `Article`: id, title, slug, content, publishedAt, category
- `Metrics`: relationship to Projects
- `Contact`: simple message storage model

## 4. Folder Structure

```text
d:\portFolioWebsite\
├── src\
│   ├── app\                 # Next.js App Router
│   │   ├── about\           # Professional narrative and principles
│   │   ├── contact\         # Contact form and info
│   │   ├── exploring\       # Current active research areas
│   │   ├── insights\        # Engineering blog/articles
│   │   ├── research\        # Patents and publications
│   │   ├── systems\         # Interactive system architecture diagrams
│   │   ├── work\            # Case studies and projects
│   │   ├── globals.css      # Tailwind v4 theme and custom utilities
│   │   ├── layout.tsx       # Root layout with providers
│   │   └── page.tsx         # Landing page hero and featured sections
│   ├── components\          # Reusable UI components
│   │   ├── layout\          # Navbar and Footer
│   │   ├── icons.tsx        # Custom SVGs for brand logos
│   │   └── [feature]\       # Feature-specific client components
│   └── lib\                 # Utilities and static data
│       ├── constants.ts     # Core site config and project data
│       ├── sample-articles.ts # Placeholder article data
│       └── utils.ts         # `cn` tailwind merge utility
```

## 5. Design System

- **Colors:** Defined via OKLCH in `globals.css`. Primary is a vibrant coral/amber (`oklch(0.7 0.15 45)`). Background is a deep dark slate (`oklch(0.145 0 0)`).
- **Typography:** Inter (Sans), JetBrains Mono (Mono), Outfit (Display).
- **Effects:** Heavy use of `.glass` utility for backdrop blurs, `.gradient-text` for coral/amber text effects, and animated orbs in the background.
- **Spacing:** `.section-padding` and `.container-custom` enforce consistent margins and max-widths across all pages.

## 6. Remaining Tasks

1. **Database Integration:** Move `constants.ts` and `sample-articles.ts` into a Neon PostgreSQL database and wire up Prisma ORM.
2. **External Services:**
   - Resend: Wire up the contact form in `components/contact/contact-content.tsx` to actually send emails.
   - Cloudinary: Migrate static images to Cloudinary.
   - Google Analytics (GA4): Integrate the measurement ID.
3. **Content Hydration:** Write the actual content for the insights/articles (`insights/[slug]/page.tsx` currently shows a placeholder).
4. **Performance Polish:** Fine-tune animations and ensure optimal Core Web Vitals.

## 7. Current Progress

- ✅ Project initialized with Next.js 16 and React 19.
- ✅ Tailwind v4 design system implemented.
- ✅ All core static data defined in `lib/constants.ts`.
- ✅ All pages and dynamic routes built, animated, and fully functioning.
- ✅ Build passes successfully with 0 errors (fully static exported).

## 8. Open Issues

- The CSS contains a warning regarding the `@import url(...)` rule for Google Fonts in `globals.css` not preceding all rules. This is a minor Tailwind v4 / PostCSS ordering warning that doesn't break the build but should be resolved.
- Custom brand icons are statically defined. If more are needed, they must be manually added to `icons.tsx`.

## 9. Technical Debt

- Currently mixing `"use client"` heavily in top-level page components for scroll animations. Some of these could be refactored to wrap specific sections rather than the whole page content to maximize Server Component benefits.
- Article content is fully hardcoded.

## 10. Next Steps

The recommended next step is to initialize the Prisma ORM, push the schema to the Neon database, and build the API routes to transition the site from static data to dynamic database-driven content.
