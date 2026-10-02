/**
 * The Startup Garage: a deliberately tiny model of a first year. Same choices, same
 * result — the "market noise" is seeded by the choices so runs are comparable.
 */

export const STARTING_CASH = 10_00_000;
export const MONTHS = 12;
const BASE_INFRA = 15_000;

type Option = { id: string; label: string; hint: string };

export const PRODUCTS = [
  { id: 'devtool', label: 'Developer tool', hint: 'Small market, users who pay', growth: 0.1, arpu: 1.2, infra: 0 },
  { id: 'ai-saas', label: 'AI SaaS', hint: 'Fast growth, real LLM bills', growth: 0.14, arpu: 1, infra: 25_000 },
  { id: 'marketplace', label: 'Campus marketplace', hint: 'Network effects, thin margins', growth: 0.04, arpu: 0.4, infra: 0 },
] as const;

export const PRICING = [
  { id: 'free', label: 'Free, ad-supported', hint: 'Everyone joins; few rupees each', conversion: 1, price: 3, signups: 1.3 },
  { id: 'freemium', label: 'Freemium', hint: '~4% upgrade to ₹499/month', conversion: 0.04, price: 499, signups: 1 },
  { id: 'paid', label: 'Paid only', hint: '₹299/month from day one', conversion: 1, price: 299, signups: 0.15 },
] as const;

export const MARKETING = [
  { id: 'community', label: 'Content & community', hint: '₹10k/month, compounds slowly', cost: 10_000 },
  { id: 'ads', label: 'Paid ads', hint: '₹1L/month, steady signups', cost: 1_00_000 },
  { id: 'launch', label: 'Launch on Product Hunt + HN', hint: '₹15k once, one big spike', cost: 0 },
] as const;

export const TEAM = [
  { id: 'solo', label: 'Solo founder', hint: '₹25k/month ramen salary', cost: 25_000, retention: 0.92, boost: 1 },
  { id: 'plus-one', label: 'Founder + 1 engineer', hint: '₹1.05L/month', cost: 1_05_000, retention: 0.95, boost: 1.02 },
  { id: 'plus-three', label: 'Founder + 3 hires', hint: '₹3.25L/month', cost: 3_25_000, retention: 0.965, boost: 1.05 },
] as const;

export type StartupChoices = {
  product: (typeof PRODUCTS)[number]['id'];
  pricing: (typeof PRICING)[number]['id'];
  marketing: (typeof MARKETING)[number]['id'];
  team: (typeof TEAM)[number]['id'];
};

export const CHOICE_GROUPS: { key: keyof StartupChoices; title: string; options: readonly Option[] }[] = [
  { key: 'product', title: 'Product', options: PRODUCTS },
  { key: 'pricing', title: 'Pricing', options: PRICING },
  { key: 'marketing', title: 'Marketing', options: MARKETING },
  { key: 'team', title: 'Hiring', options: TEAM },
];

export type MonthResult = { month: number; users: number; revenue: number; burn: number; cash: number };

export type Outcome = {
  months: MonthResult[];
  verdict: string;
  lesson: string;
  alive: boolean;
  /** Month revenue first covered costs, if it did. */
  breakEven: number | null;
};

/** Tiny seeded PRNG (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

export function simulate(c: StartupChoices): Outcome {
  const product = PRODUCTS.find((p) => p.id === c.product)!;
  const pricing = PRICING.find((p) => p.id === c.pricing)!;
  const marketing = MARKETING.find((m) => m.id === c.marketing)!;
  const team = TEAM.find((t) => t.id === c.team)!;
  const noise = rng(hash(`${c.product}|${c.pricing}|${c.marketing}|${c.team}`));

  let users = 0;
  let cash = STARTING_CASH;
  let breakEven: number | null = null;
  const months: MonthResult[] = [];

  for (let m = 1; m <= MONTHS; m++) {
    const acquired =
      marketing.id === 'community' ? 40 * 1.25 ** m : marketing.id === 'ads' ? 600 : m === 1 ? 1200 : 60;
    const growth = product.id === 'marketplace' ? product.growth + Math.min(0.08, users / 50_000) : product.growth;
    const organic = users * growth * team.boost;
    const market = 0.9 + noise() * 0.2;
    users = Math.round((users * team.retention + organic + acquired * pricing.signups) * market);

    const revenue = Math.round(users * pricing.conversion * pricing.price * product.arpu);
    const burn = BASE_INFRA + product.infra + team.cost + marketing.cost + (marketing.id === 'launch' && m === 1 ? 15_000 : 0);
    cash += revenue - burn;
    if (breakEven === null && revenue >= burn) breakEven = m;
    months.push({ month: m, users, revenue, burn, cash });
    if (cash < 0) break;
  }

  const last = months[months.length - 1];
  const alive = last.cash >= 0;
  const net = last.burn - last.revenue;

  if (!alive) {
    return {
      months,
      alive,
      breakEven,
      verdict: `Out of cash in month ${last.month}.`,
      lesson:
        last.revenue < last.burn / 4
          ? 'The product might have been fine; the burn wasn’t. Revenue never came close to costs.'
          : 'Close — revenue was catching up, but not fast enough to outrun the burn.',
    };
  }
  if (net <= 0) {
    return {
      months,
      alive,
      breakEven,
      verdict: `Default alive — revenue covered costs from month ${breakEven}.`,
      lesson: 'Profitable on a small team. Now the question is whether the channel scales.',
    };
  }
  if (last.users > 3_000 && last.revenue < 20_000) {
    return {
      months,
      alive,
      breakEven,
      verdict: 'Lots of users, no business model.',
      lesson: 'Investors will call it traction. Your bank will call it a loss. Pricing is a product decision.',
    };
  }
  const runway = Math.floor(last.cash / net);
  return {
    months,
    alive,
    breakEven,
    verdict: `Still alive, with about ${runway} month${runway === 1 ? '' : 's'} of runway left.`,
    lesson: 'Not dead, not thriving. Find the channel that compounds before the runway runs out.',
  };
}

export const formatInr = (n: number) =>
  `${n < 0 ? '−' : ''}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
