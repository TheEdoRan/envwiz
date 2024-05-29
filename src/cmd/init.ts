import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import pc from "picocolors";
import prompts from "prompts";
import ts from "typescript";
import { CWD, ENV_FILES, logError, logSuccess, type EnvFile } from "../utils";
import { newDeclarationFileBody } from "./_shared";

const supportedLockFiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"];

export function readDirFiles() {
	const files = readdirSync(CWD);
	return files;
}

export function assertSupportedLockFile(dirFiles: string[]) {
	if (!dirFiles.some((f) => supportedLockFiles.includes(f))) {
		console.error(
			"Could not file supported lock file in current dir! Supported package managers: npm, pnpm, yarn"
		);
		process.exit(1);
	}
}

export function assertTsconfigExists(dirFiles: string[]) {
	if (!dirFiles.includes("tsconfig.json")) {
		console.error("Could not find tsconfig.json in current dir!");
		process.exit(1);
	}
}

export function getExistingEnvFiles(dirFiles: string[]) {
	return dirFiles.filter((file) => (ENV_FILES as unknown as string[]).includes(file)) as EnvFile[];
}

export async function createEnvFiles(filesFound: EnvFile[]) {
	if (!filesFound.length) {
		console.log(pc.bold("No environment files found."));
	} else {
		console.log(
			pc.bold("Environment files found: ") + filesFound.map((f) => pc.cyan(f)).join(", ")
		);

		// If all files are found, no need to do anything.
		if (filesFound.length === ENV_FILES.length) {
			console.log("All required files are already present.");

			process.exit(0);
		}
	}

	const { choice } = await prompts({
		type: "confirm",
		name: "choice",
		message: "Do you want to create all the required files?",
		initial: true,
	});

	if (!choice) {
		process.exit(0);
	}

	ENV_FILES.forEach((file) => {
		// If the file already exists, skip creation.
		if (filesFound.includes(file)) {
			return;
		}

		let body = "";
		if (file === "env.d.ts") {
			body = newDeclarationFileBody;

			try {
				const tsconfig = ts.readConfigFile(join(CWD, "tsconfig.json"), ts.sys.readFile).config;

				if (!tsconfig.include?.includes("env.d.ts")) {
					tsconfig.include = [...(tsconfig.include || []), "env.d.ts"];
					writeFileSync(join(CWD, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
					logSuccess("Added env.d.ts to tsconfig.json `include` array.");
				}
			} catch {
				logError("Could not open and/or edit tsconfig.json file.");
				console.error("Please add this entry to the `include` array in tsconfig.json:");
				console.error(`["env.d.ts"]`);
			}
		}

		try {
			writeFileSync(join(CWD, file), body);
			logSuccess(`Created ${file} file.`);
		} catch (e) {
			logError(`Could not create ${file} file: ${e}`);
			process.exit(1);
		}
	});
}
