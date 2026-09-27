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
| Database | Neon Serverless PostgreSQL via Prisma 5 |
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
- Uploads: admin-only, same-origin, PNG/JPEG/WebP/GIF/AVIF only (no SVG), ≤ 8 MB.

---

## Environment variables

| Name | Used for |
|---|---|
| `DATABASE_URL` | Neon connection |
| `ADMIN_PASSWORD` | Admin sign-in |
| `ADMIN_SESSION_SECRET` | Cookie signing (32+ random characters) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Editor image uploads |

See `.env.example`.

---

## Other DB models

| Model | Shown at |
|---|---|
| `Project` | `/work`, `/work/[slug]`, home "Selected work" (featured) |
| `Milestone` | Home "Changelog" |
| `SystemArchitecture` | `/systems` (2D plan / 3D exploded view) |
| `Video` | `/videos` |

These are still managed with `npx prisma studio`.
