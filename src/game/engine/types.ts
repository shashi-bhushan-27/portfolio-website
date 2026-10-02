/**
 * The contract between the React shell and the Phaser game.
 *
 * Nothing in this file may import Phaser: the shell imports these types statically,
 * and the engine (Phaser + scenes) must stay behind a dynamic import.
 */

export type RendererKind = 'WebGL' | 'Canvas';

/** Engine → shell notifications. Scenes call these; the shell turns them into UI. */
export type GameBridge = {
  onRendererReady: (renderer: RendererKind) => void;
  /** World asset loading, 0–1. */
  onAssetProgress: (progress: number) => void;
  /** Everything the first scene needs is loaded; waiting for the player to enter. */
  onReady: () => void;
};

/** Shell → engine commands. */
export type GameHandle = {
  enterWorld: () => void;
  destroy: () => void;
};
