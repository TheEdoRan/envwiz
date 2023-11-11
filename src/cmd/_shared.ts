import dotenv from "dotenv";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { CWD, ENV_FILES, logError, logSuccess } from "../utils";

export const newDeclarationFileBody = `declare namespace NodeJS {\n\tinterface ProcessEnv {}\n}\n`;
export function buildDeclarationFileContent(entries: [string, string][]) {
	return `declare namespace NodeJS {
  interface ProcessEnv {
${entries.map(([key]) => `\t\t${key}: string;`).join("\n")}
  }
}`;
}

export function assertRequiredFilesExist() {
	const files = readdirSync(CWD);
	if (!ENV_FILES.every((file) => files.includes(file as any))) {
		logError("Not all required files are present.");
		console.error("Please run `npx envwiz init` first.");
		process.exit(1);
	}
}

export function getParsedEnvs() {
	try {
		const envFile = readFileSync(join(CWD, ".env"), "utf8");
		const envs = dotenv.parse(envFile);
		if (!envs) {
			throw new Error("Invalid parsing");
		}
		return envs as Record<string, string>;
	} catch {
		logError("Could not parse .env file.");
		process.exit(1);
	}
}

export function writeEnvironmentVariablesToFiles(
	envs: Record<string, string>,
	action: "add" | "remove" | "sync"
) {
	const entries = Object.entries(envs);
	let content = "";

	for (const file of ENV_FILES) {
		switch (file) {
			case ".env":
				content = entries.map(([key, value]) => `${key}="${value}"`).join("\n");
				break;
			case ".env.example":
				content = entries.map(([key]) => `${key}=""`).join("\n");
				break;
			case "env.d.ts":
				if (!entries.length) {
					content = newDeclarationFileBody;
				} else {
					content = buildDeclarationFileContent(entries);
				}
		}

		try {
			// We don't have to process .env file if we're syncing its content
			// to other files.
			if (action === "sync" && file === ".env") {
				continue;
			}

			writeFileSync(join(CWD, file), content);

			switch (action) {
				case "add":
					logSuccess(`Entry added to ${file} file.`);
					break;
				case "remove":
					logSuccess(`Entries removed from ${file} file.`);
					break;
				case "sync":
					logSuccess(`Entries synced to ${file} file.`);
			}
		} catch {
			logError(`Could not write to ${file} file.`);
			process.exit(1);
		}
	}
}
