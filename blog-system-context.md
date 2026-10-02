# Blog Publishing System — Context

> Portfolio website of Shashi Bhushan Vijay (`d:\portFolioWebsite`)

Articles are written and published from a built-in admin editor at **`/admin`**. Publishing (or updating a
published article) refreshes the live site immediately via on-demand revalidation — no redeploy, no Prisma
Studio, no waiting for the 60-second ISR window.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack), React 19 |
| Database | Neon Serverless PostgreSQL via Prisma 7 + `@prisma/adapter-neon` (CLI config in `prisma.config.ts`) |
| Rendering | ISR (`revalidate = 60`) + on-demand `revalidatePath` from the editor |
| Content | Markdown (GFM) stored in `Article.content` |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-slug` + `rehype-highlight` (one renderer for site and editor) |
| Images | Uploaded from the editor to Cloudinary (`portfolio/blog` folder) |
| Auth | Single admin password → HMAC-signed, httpOnly session cookie (7 days) |

---

## Database — `Article`

```prisma
enum ArticleStatus { DRAFT PUBLISHED }

model Article {
  id          String        @id @default(cuid())
  slug        String        @unique          // /insights/[slug]
  title       String
  excerpt     String                         // auto-filled from the first paragraph on publish if empty
  content     String?                        // Markdown
  category    String
  readingTime Int                            // computed on every save
  publishedAt DateTime                       // controls ordering; editable in the editor
  tags        String[]
  featured    Boolean       @default(false)  // "Pin to top" → pinned row on /insights
  status      ArticleStatus @default(PUBLISHED)
  coverImage  String?                        // optional https URL (usually Cloudinary)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt       // also used for edit-conflict detection
}
```

`status` defaults to `PUBLISHED` so rows that existed before the editor stay live after migrating.
Public queries only ever return `PUBLISHED` rows; drafts 404 on the public site.

---

## Writing and publishing

1. Go to `/admin` and sign in with `ADMIN_PASSWORD`.
2. **New article** creates an empty draft and opens the editor (an existing blank draft is reused).
3. Write in Markdown. Drafts **autosave** ~2.5 s after you stop typing. A copy is also kept in the browser's
   localStorage, and the editor offers to restore it after a crash or closed tab.
4. **Publish** → live immediately at `/insights/<slug>`, on `/insights`, on the home page, in `/feed.xml`,
   the sitemap and the ⌘K search.
5. Editing a published article does **not** autosave (half-finished edits never go live). Press
   **Update live** (⌘/Ctrl S) to push changes. **Unpublish** takes it off the site; **Delete** removes it.

If the same article was saved elsewhere (another tab or device) since you opened it, saving shows a conflict
banner: **Load latest** (discard yours) or **Overwrite with mine**.

### Editor features
- Write / Split / Preview layouts; the preview uses the exact renderer the public page uses.
- Toolbar + shortcuts: ⌘B bold, ⌘I italic, ⌘E code, ⌘K link, Alt+2/3 headings, Tab/Shift-Tab indent,
  Enter continues lists, ⌘S save, ⌘⇧Enter publish.
- Paste, drop, or pick images → uploaded to Cloudinary → inserted as Markdown.
- Settings panel: URL slug (auto from title until edited; warns when changing a live URL), excerpt
  (with "use first paragraph"), category (suggests existing), tags (suggests existing), publish date,
  pin to top, cover image, and a live outline.
- Full-page preview of drafts at `/admin/articles/<id>/preview`.

### Markdown notes
- Use `##` for sections and `###` for subsections. If a post uses `#` headings, all headings are shifted
  down one level so the article title remains the only `<h1>` (older posts mix `#` and `##`).
- GFM tables, task lists, strikethrough and fenced code blocks with a language (```` ```ts ````) are supported.
- Raw HTML in Markdown is intentionally **not** rendered.

---

## Key files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | `Article` model + `ArticleStatus` enum |
| `src/lib/articles.ts` | Public queries (published only), serialization, related-article scoring |
| `src/lib/markdown.ts` | Heading shift plugin, TOC extraction, word count / reading time, slugify, excerpt suggestion |
| `src/components/markdown/markdown.tsx` | The shared Markdown renderer (site + editor preview) |
| `src/components/insights/article-view.tsx` | Article page layout (TOC, progress bar, share, related) |
| `src/app/(site)/insights/…` | Public listing and article routes |
| `src/app/feed.xml/route.ts`, `src/app/sitemap.ts` | RSS feed and sitemap |
| `src/app/admin/actions.ts` | Server actions: login/logout, createDraft, update/publish/unpublish, delete, flags |
| `src/app/admin/(panel)/…` | Dashboard, editor, preview pages |
| `src/components/admin/article-editor.tsx` | The editor |
| `src/components/admin/markdown-editor.tsx` | Textarea editor: toolbar, shortcuts, image paste/drop |
| `src/app/api/admin/upload/route.ts` | Authenticated image upload → Cloudinary |
| `src/lib/session.ts`, `src/lib/auth.ts`, `src/proxy.ts` | Session tokens, auth helpers, route guard |

---

## Security model
- `src/proxy.ts` redirects unauthenticated requests for `/admin/*` and returns 401 for `/api/admin/*`.
- Every admin page, server action and the upload route re-checks the session (`requireAdmin()` /
  `isAdmin()`); the proxy is not relied on alone.
- Session cookie: `sbv_admin`, httpOnly, `SameSite=Lax`, `Secure` in production, 7-day expiry, HMAC-SHA256
  signed with a key derived from `ADMIN_SESSION_SECRET` + `ADMIN_PASSWORD` (changing either signs everyone out).
- Login: constant-time password comparison, a delay on failure, and 5 failures / 10 min per IP (per server
  instance, best effort — use a long password).
- Uploads: admin-only, same-origin, PNG/JPEG/WebP/GIF/AVIF only (no SVG), ≤ 8 MB. Résumés: PDF only
  (checked by file signature, not just the name), ≤ 4 MB.
- Public endpoints are rate limited in Postgres (`src/lib/rate-limit.ts`, `RateLimit` table), so limits hold
  across serverless instances. IPs are stored hashed. Assistant: 8/min, 40/hour, 100/day per IP and
  `CHAT_DAILY_LIMIT` (default 2000) for the whole site. Contact form: 3 per 10 min, 10/day per IP, 200/day site-wide.

---

## Environment variables

| Name | Used for |
|---|---|
| `DATABASE_URL` | Neon connection |
| `ADMIN_PASSWORD` | Admin sign-in |
| `ADMIN_SESSION_SECRET` | Cookie signing (32+ random characters) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Editor image uploads |
| `GEMINI_API_KEY` | Site assistant (Google AI Studio key) |
| `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `CHAT_DAILY_LIMIT` | Optional assistant overrides |
| `RESEND_API_KEY` | Contact form email |

See `.env.example`.

---

## Other DB models

| Model | Shown at |
|---|---|
| `Project` | `/work`, `/work/[slug]`, home "Selected work" — managed at **`/admin/work`** (see below) |
| `Milestone` | Home "Changelog" |
| `SystemArchitecture` | `/systems` (2D plan / 3D exploded view) |
| `Video` | `/videos` — managed in the admin at **`/admin/videos`** (see below) |
| `Resume` | `/resume` — managed in the admin at **`/admin/resumes`** (see below) |
| `RateLimit` | Not shown; counters for the assistant and contact form |

Milestones and architectures are still managed with `npx prisma studio`. Each architecture can be linked
directly as `/systems#<architectureId>` (e.g. `/systems#flex-dca`).

## Work admin (`/admin/work`)

- **New project** creates a private draft and opens the editor (an existing blank draft is reused).
- Editor: name, one-line summary, domain (the part before the first `/` becomes the filter on `/work`), year,
  URL slug, tech stack, source/live links, "show on the home page", metrics (name → value rows), and the ten
  case-study sections, each Markdown with a Write/Preview toggle. Empty sections are hidden on the page.
- Drafts autosave and are never public. **Publish** needs a name, summary and domain. Edits to a published
  project wait for **Update live**; **Unpublish** takes it off the site. Same crash backup and edit-conflict
  protection as articles. Full-page draft preview at `/admin/work/<id>/preview`.
- The list: drag or arrows to reorder `/work` (new projects start at the top), ★ to show on the home page,
  delete with confirmation. Reordering doesn't count as an edit (it leaves `updatedAt` alone).
- Every change revalidates `/`, `/work`, all case study pages (their "Next project" link depends on the
  order), the sitemap and the ⌘K search index.
- Schema: `Project.status` (`DRAFT | PUBLISHED`, default `PUBLISHED`) and `Project.order` (default `0`; ties
  fall back to newest first), so existing rows keep their current place and visibility.
- Code: `src/app/admin/project-actions.ts`, `src/components/admin/project-editor.tsx`,
  `src/components/admin/project-manager.tsx`, `src/lib/projects.ts`, `src/lib/project-sections.ts`.

## Videos admin (`/admin/videos`)

- Paste a YouTube link (watch, youtu.be, shorts, live, embed, or a bare ID); the title is fetched from
  YouTube's public oEmbed endpoint and can be edited. Add a category and an optional description.
- New videos go to the top. Reorder by dragging or with the arrow buttons.
- **★ Star** a video to put it in the big player at the top of `/videos` (only one can be starred; with none
  starred, the first video in the list gets it).
- Edit or delete inline. Every change revalidates `/videos`, so it's live on the next request.
- Code: `src/app/admin/video-actions.ts`, `src/components/admin/video-manager.tsx`, `src/lib/youtube.ts`.

## Résumés admin (`/admin/resumes`)

- Upload PDFs (drag-drop or pick, ≤ 4 MB) and keep every version. Each gets a private label.
- Exactly one version is **live**: pick it with the radio button (or tick "Make it live" while uploading).
  Visitors get the live one at **`/resume`** — the Résumé buttons, the ⌘K menu and the assistant all link there.
  It downloads as `Shashi-Bhushan-Vijay-Resume.pdf` whatever the uploaded file was called.
- With nothing live (or nothing uploaded), `/resume` redirects to the bundled
  `public/resume/shashi-bhushan-vijay-resume.pdf`, so the link never breaks.
- Open any version privately via the ↗ button (`/api/admin/resumes/<id>`, admin-only). Rename or delete inline.
- PDFs are stored in Postgres (`Resume.data`) — Cloudinary blocks PDF delivery on this account, and résumés are small.
- Code: `src/app/resume/route.ts`, `src/app/api/admin/resumes/`, `src/app/admin/resume-actions.ts`,
  `src/components/admin/resume-manager.tsx`, `src/lib/resumes.ts`.

## Site assistant (`/api/chat`)

- The "ask ai" widget answers **only** from the site's content and links to the exact page each fact came
  from (e.g. `/work/proofstack#architecture`, `/insights/<slug>#<heading>`, `/systems#flex-dca`). Answers show a
  "Sources on this site" list. Anything not on the site gets "I don't know" plus a pointer to `/contact`.
- Knowledge (`src/lib/assistant/knowledge.ts`): profile, patent and research facts (`src/lib/content.ts`), every
  published project (all case-study sections), every published article (body capped at 8k characters, with
  heading anchors), system diagrams, videos, the Exploring log and milestones. Cached for 10 minutes and
  refreshed immediately when an article, project or video is changed in the admin.
- Prompt (`src/lib/assistant/prompt.ts`): everything fits in the prompt today (~60k characters). Past 120k,
  the documents most relevant to the question are included in full and the rest only by title + URL.
- Models (`src/lib/assistant/model.ts`): `gemini-3.5-flash-lite`, falling back to `gemini-3.1-flash-lite` and
  then `gemini-3.5-flash` when a model errors (Gemini returns 503 under load) or takes over 4 s to start answering.
- The client only sends plain user/assistant text; the server drops other parts, caps questions at 1,000
  characters and keeps the last 12 messages. The chat UI is loaded on first open, not with every page.
