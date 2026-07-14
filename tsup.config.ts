import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    nic: "src/nic.ts",
    format: "src/format.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2020",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
