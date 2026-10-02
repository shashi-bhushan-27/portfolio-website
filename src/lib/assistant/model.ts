import 'server-only';
import { createGoogle } from '@ai-sdk/google';
import { wrapLanguageModel } from 'ai';

/**
 * Gemini latency swings a lot under load (the same model can take 1 s or 15 s
 * to start answering, or return 503 "high demand"), so requests walk a chain:
 * each model gets a few seconds to start streaming before the next one is
 * tried. The last model in the chain gets no time limit. Override with
 * GEMINI_MODEL and a comma-separated GEMINI_FALLBACK_MODELS.
 */
export const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
export const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.1-flash-lite,gemini-3.5-flash')
  .split(',')
  .map((m) => m.trim())
  .filter((m) => m && m !== PRIMARY_MODEL);

/** How long a model may take to start streaming before the next one is tried. */
const START_TIMEOUT_MS = 4000;

/** Null when GEMINI_API_KEY is missing, so the route can say so instead of crashing. */
export function assistantModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const google = createGoogle({ apiKey });
  const chain = [PRIMARY_MODEL, ...FALLBACK_MODELS].map((id) => google(id));
  if (chain.length === 1) return chain[0];

  return wrapLanguageModel({
    model: chain[0],
    middleware: {
      // Only the initial request fails over; once a model starts streaming, it finishes the answer.
      wrapStream: async ({ params }) => {
        for (let i = 0; ; i++) {
          const model = chain[i];
          if (i === chain.length - 1) return model.doStream(params);

          const giveUp = new AbortController();
          const timer = setTimeout(() => giveUp.abort(new Error('slow to respond')), START_TIMEOUT_MS);
          const signal = params.abortSignal
            ? AbortSignal.any([params.abortSignal, giveUp.signal])
            : giveUp.signal;
          try {
            return await model.doStream({ ...params, abortSignal: signal });
          } catch (error) {
            if (params.abortSignal?.aborted) throw error; // the visitor cancelled
            const reason = giveUp.signal.aborted
              ? `no response in ${START_TIMEOUT_MS / 1000}s`
              : error instanceof Error
                ? error.message
                : String(error);
            console.warn(`[chat] ${model.modelId} failed (${reason}); trying ${chain[i + 1].modelId}`);
          } finally {
            clearTimeout(timer);
          }
        }
      },
    },
  });
}
