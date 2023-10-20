export const CWD = process.cwd();

export const ENV_FILES = [".env", ".env.example", "env.d.ts"] as const;
export type EnvFile = (typeof ENV_FILES)[number];

export function stringToUpperSnakeCase(s: string) {
	return s
		.replace(/[a-z][A-Z]/g, (l) => l[0] + "_" + l[1])
		.replace(/\W+/g, "_")
		.toUpperCase();
}
