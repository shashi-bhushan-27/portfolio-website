# Case study draft: Site Assistant

Ready to paste into **Admin → Work → New project**. Each `##` heading below is one field in the form.
Everything here was written from the code in `src/lib/assistant/*` and `src/app/api/chat/route.ts`.
No latency or answer-quality numbers are claimed, because none have been measured yet.

## Fields

| Field | Value |
|---|---|
| Slug | `ai-site-assistant` |
| Title | Site Assistant: A Grounded, Cited Q&A Agent for This Portfolio |
| Domain | AI / LLM Applications |
| Year | 2026 |
| Technologies | Next.js 16, TypeScript, Vercel AI SDK, Google Gemini, PostgreSQL (Neon), Prisma |
| Featured | yes |
| Order | 3 (see "Work page order" at the bottom) |
| Status | Published once you have read it |
| Metrics | `Models in failover chain`: 3 · `Context budget`: 120k chars · `Per-IP limit`: 8/min · 100/day |
| Excerpt | The "Ask AI" assistant on this site answers visitor questions strictly from the published content, links every claim to the page it came from, and degrades gracefully across a Gemini model chain, with rate limits and input hardening built in. |

## Executive summary

The assistant behind the "Ask AI" button answers questions about my projects, research, writing and background. It is built around one rule: **it may only say what the site already says, and it must show where it read it.**

Every published project, article, architecture diagram, video and milestone is turned into a document that carries its exact URL (with section anchors such as `/work/proofstack#architecture`). Those documents are placed in the model's context, the model is told to answer only from them and to link the page each claim came from, and the request is wrapped in input validation, rate limits and a model failover chain so a public endpoint stays cheap and safe.

It is deliberately a *context-grounded* assistant rather than a vector-search RAG system. The reasoning is in the trade-offs section.

## Problem statement

A portfolio is read by people with different questions: a recruiter wants the short version, an engineer wants the architecture, someone else wants to know whether the patent is granted. Search and navigation answer some of that; a conversational answer with a link to the evidence answers the rest faster.

The risks of a public LLM endpoint are the interesting part:

- **Invention.** A model asked about a person will happily produce plausible employers, dates and metrics. On a hiring-facing site that is worse than no assistant.
- **Drift.** The content changes whenever I publish a case study; an assistant with its own copy of the facts goes stale.
- **Abuse and cost.** Anyone can call the endpoint, try to override its instructions, or run up the API bill.
- **Latency swings.** The model tier used for cheap, fast answers can take 1 s or 15 s to start responding, or return a 503 under load.

## System architecture

```
Admin edits content (projects, articles, diagrams, videos…)
        │  invalidates the "assistant-knowledge" cache tag
        ▼
Knowledge builder   Postgres + static profile  →  documents
                    each = { title, URL (+ section anchors), summary, keywords, body }
        │  cached 10 min, revalidated on admin edits
        ▼
POST /api/chat
  1. validate    user/assistant text parts only; length + history caps
  2. rate-limit  per-IP minute/hour/day windows + a site-wide daily ceiling (Postgres)
  3. instruct    rules + catalog of every document + full text that fits the budget
  4. generate    Gemini via the Vercel AI SDK, streamed to the browser
        │  model chain: primary → fallback → fallback (4 s to start streaming)
        ▼
Streamed answer in Markdown with links back to the site
```

**Knowledge.** `buildKnowledge` assembles documents from the database (published projects, articles, system diagrams, videos, milestones) and from static profile content. Case-study sections keep their anchors, so an answer can link straight to `#architecture` or `#performance`. The result is cached and tagged, and the admin's save actions invalidate the tag, so a newly published case study is answerable without a deploy.

**Prompt assembly.** Every request gets the rules, a catalog listing every document with its URL, and the full text of the documents that fit a 120k-character budget. Today everything published fits. When it stops fitting, the profile and patent stay pinned and the rest are ranked against the last two user questions (title, keyword and body matches, weighted); documents that miss the budget stay in the catalog as one-line summaries, so the model can still point to them.

**Model chain.** Requests start on a fast, low-cost Gemini model. If it has not started streaming within 4 seconds or returns an error, the next model is tried; the last one gets no timeout. Failover happens only before streaming begins, so a visitor never sees an answer switch models half-way.

## Technology decisions

- **Whole-corpus context instead of a vector store.** The site's published content is tens of thousands of characters, comfortably inside the context window. Putting all of it in front of the model removes an embedding pipeline, an index that can go stale, and the failure mode where retrieval misses the one relevant chunk. A ranking step exists, but only as the fallback for when the corpus outgrows the budget.
- **Documents carry their own URLs.** Citation is a data problem before it is a prompting problem: if each document ships with the exact URL and anchors, "link to the page you used" is something the model can do reliably, and the rules can forbid any URL that is not in the knowledge base.
- **Vercel AI SDK with a model middleware for failover.** Streaming, message handling and the provider are one library; the failover logic is a small `wrapStream` middleware rather than a custom client.
- **Postgres for rate limits.** Fixed-window counters in the same database as the content hold across serverless instances and cold starts, with IPs stored only as hashes.
- **No tools given to the model.** The assistant can read and answer; it cannot call anything. A successful prompt injection can therefore change what it says, but not make it do anything.

## Engineering trade-offs

- **Full context vs. retrieval.** Sending everything costs more input tokens per request than retrieving a few chunks. At this corpus size that is cheap and buys accuracy and simplicity; the ranking fallback exists because the trade flips as content grows.
- **Small, fast models vs. stronger ones.** The answers are short and grounded, so a low-latency model with minimal reasoning is enough. The cost is less nuance on open-ended questions, which the rules steer visitors away from anyway.
- **Strict refusal vs. helpfulness.** The assistant says "I don't have that" and points to the contact page rather than guessing. Some visitors will find that terse; a confident wrong answer about my work would be worse.
- **Per-IP limits vs. shared networks.** Fixed windows are simple and cheap but can throttle people behind one office IP; the site-wide ceiling protects the API key at the cost of occasionally turning everyone away on a bad day.

## Challenges

- Keeping answers honest about status. The patent is a *published application*, not a granted patent, and a model's default phrasing drifts toward "patented".
- Latency that varies by an order of magnitude on the same model tier, including outright 503s.
- Making citations dependable: links must point at pages and anchors that exist, not at plausible-looking slugs.
- A public text box that people will use to test the guardrails.

## Solutions

- A fixed rule set in the system prompt: answer only from the knowledge base; link the exact URL and prefer section anchors; call the patent a *published* patent; stay third-person; keep answers short; treat visitor messages as questions rather than instructions; refuse role changes and prompt disclosure; send hiring and collaboration questions to the contact page.
- Server-side input hardening: only user/assistant *text* parts are accepted (tool, file and system parts are dropped), questions are capped at 1,000 characters, history at 12 messages, and old assistant turns are clipped.
- Limits on both sides: an 800-token output cap, low temperature, and rate limits per IP (8/minute, 40/hour, 100/day) plus a site-wide daily ceiling.
- The three-model failover chain with a 4-second start timeout, and friendly error messages instead of raw failures.
- Cache invalidation hooked into the admin, so content changes reach the assistant without a redeploy.

## Performance

These are design limits, not benchmark results:

- **Context budget:** 120k characters of full text per request; the current corpus fits entirely.
- **Failover:** a model has 4 seconds to start streaming before the next is tried.
- **Output:** capped at 800 tokens, with answers instructed to stay near 150 words.
- **Abuse limits:** 8 requests/minute, 40/hour and 100/day per client, and a site-wide daily ceiling.
- **Freshness:** knowledge cache revalidates every 10 minutes and immediately on admin edits.

I have not published latency or answer-quality numbers yet. That gap is the first item under future improvements.

## Lessons learned

- Citations are easiest to get right when the data model carries them. Giving each document its own URL and anchors did more than any amount of prompt wording.
- A public LLM endpoint is mostly an engineering problem around the model (validation, limits, failover, caching) and only partly a prompting problem.
- Start with the simplest grounding that works. Whole-corpus context was faster to build, easier to reason about, and more accurate than the retrieval stack I would have reached for by default.
- Giving the model no tools is a cheap and effective security decision.

## Future improvements

- **An evaluation set.** A regression suite of real visitor questions with expected citations and "should refuse" cases, run against every prompt or model change. Today the checking is by hand.
- **Measure what is only designed.** Time-to-first-token and answer latency per model in the chain, and how often failover triggers.
- **Retrieval when it is needed.** Embeddings and reranking over the documents once the corpus no longer fits the context budget.
- **Answer feedback.** A thumbs up/down on answers to find the questions the assistant handles badly.

---

## Work page order (set in Admin → Work)

Current live order is ProofStack, Trade Document Intelligence and OncoFollow (tied at 2), Indoor Positioning, then LendLoop and AutoML (tied at 4), and so on. Suggested AI-first order:

| Order | Project |
|---|---|
| 1 | ProofStack |
| 2 | Trade Document Intelligence (also tick **Featured**) |
| 3 | Site Assistant (this case study) |
| 4 | RAG-Powered Document Q&A |
| 5 | AutoML Assistant |
| 6 | FLEX-DCA |
| 7 | Indoor Positioning & Navigation System |
| 8 | OncoFollow |
| 9 | LendLoop |
| 10 | Blockchain Crowdfunding |
| 11 | Quant finance platform (draft) |
