import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  sourcemap: true,
  dts: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
