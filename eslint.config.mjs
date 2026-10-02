import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `const { node, ...props } = …` is the idiomatic way to drop a prop.
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },
  // The RPG must never reach the portfolio's bundle: only /play may import game code,
  // and only through game-loader's dynamic import.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/game/**", "src/app/play/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "phaser", message: "Phaser belongs to the game bundle (src/game)." }],
          patterns: [
            { group: ["@/game", "@/game/*", "phaser/*"], message: "Game code is only reachable from /play." },
          ],
        },
      ],
    },
  },
  // Inside the game, the React layer reaches Phaser only via the dynamic engine import.
  {
    files: ["src/game/**/*.{ts,tsx}", "src/app/play/**/*.{ts,tsx}"],
    ignores: ["src/game/engine/**", "src/game/scenes/**", "src/game/entities/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "phaser",
              message: "Import the engine with import('@/game/engine/create-game') so Phaser stays lazy.",
            },
            {
              name: "@/game/engine/create-game",
              message: "Use a dynamic import() so Phaser stays in its own chunk.",
            },
            {
              name: "motion/react",
              message:
                "Sharing motion with this route changes how it's chunked for the home page (+4.6 KB gzip on /). Use useAppear (Web Animations API).",
            },
          ],
          patterns: [
            {
              group: ["@/game/scenes/*", "@/game/entities/*"],
              message: "Scenes and entities import Phaser; reach them through the engine.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
