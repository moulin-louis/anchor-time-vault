import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["./tests/**/*.ts", "../tests/**/*.ts"],
    // Enable timeout of 30 seconds
    testTimeout: 30000,
    // Environment setup
    environment: "node",
    //enable watch mode (re run test on file change)
    watch: true,
    server: {
      watch: true,
    },
    forceRerunTriggers: ["./tests/**/*.ts", "../tests/**/*.ts"],
  },
});
