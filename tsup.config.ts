import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/bin.ts"],
	format: ["cjs"],
	clean: true,
	splitting: false,
});
