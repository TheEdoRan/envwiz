import { execSync } from "child_process";
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import pc from "picocolors";
import prompts from "prompts";
import ts from "typescript";
import { CWD, ENV_FILES, type EnvFile } from "../utils";
import { newDeclarationFileBody } from "./_shared";

export function assertNPMInstalled() {
	try {
		execSync("npm -v", { stdio: "ignore" });
	} catch {
		console.error("npm is not installed!");
		process.exit(1);
	}
}

export function assertTypescriptInstalled() {
	try {
		// Local check.
		execSync("npm list typescript", { stdio: "ignore" });
	} catch {
		try {
			// Global check.
			execSync("npm list -g typescript", { stdio: "ignore" });
		} catch {
			console.error("TypeScript is not installed!");
			process.exit(1);
		}
	}
}

export function getExistingFiles() {
	const files = readdirSync(CWD);
	return files.filter((file) => ENV_FILES.includes(file as any)) as EnvFile[];
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
					console.log(pc.green("Added env.d.ts to tsconfig.json `include` array."));
				}
			} catch {
				console.error(pc.red("Could not open and/or edit tsconfig.json file."));
				console.error("Please add this entry to the `include` array in tsconfig.json:");
				console.error(`["env.d.ts"]`);
			}
		}

		try {
			writeFileSync(join(CWD, file), body);
			console.log(pc.green(`Created ${file} file.`));
		} catch (e) {
			console.error(pc.red(`Could not create ${file} file: ${e}`));
			process.exit(1);
		}
	});
}
