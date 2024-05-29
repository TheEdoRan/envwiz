import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/bin.ts"],
	format: ["cjs", "esm"],
	clean: true,
	splitting: false,
});
