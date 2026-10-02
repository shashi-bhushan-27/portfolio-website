/** One-off effects the store asks the world scene to play. State lives in the store; this is just "do it now". */
export type WorldEffect =
  | { kind: 'celebrate' }
  | { kind: 'secret-opened' }
  | { kind: 'coffee' }
  | { kind: 'konami' }
  | { kind: 'boss-hit' };

type Listener = (e: WorldEffect) => void;
const listeners = new Set<Listener>();

export const worldEffects = {
  emit(e: WorldEffect) {
    for (const l of listeners) l(e);
  },
  on(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
