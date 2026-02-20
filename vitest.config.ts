import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: true, // Allows us to use describe, it, expect without importing
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
  },
});
