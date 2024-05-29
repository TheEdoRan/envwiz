import { execSync } from "child_process";
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import pc from "picocolors";
import prompts from "prompts";
import ts from "typescript";
import { CWD, ENV_FILES, logError, logSuccess, type EnvFile } from "../utils";
import { newDeclarationFileBody } from "./_shared";

const supportedPackageManagers = [
	{
		name: "npm",
		lockfile: "package-lock.json",
	},
	{
		name: "pnpm",
		lockfile: "pnpm-lock.yaml",
	},
] as const;

type PackageManager = (typeof supportedPackageManagers)[number]["name"];

export function detectPackageManager() {
	const files = readdirSync(CWD);
	const lockfileIdx = supportedPackageManagers.findIndex((pm) => files.includes(pm.lockfile));

	if (lockfileIdx < 0) {
		console.error(
			"Could not find a supported package manager. Please install one of the following: npm, pnpm"
		);
		process.exit(1);
	}

	return supportedPackageManagers[lockfileIdx]!.name as PackageManager;
}

export function assertTypescriptInstalled(packageManager: PackageManager) {
	try {
		// Local check.
		if (packageManager === "npm") {
			execSync("npm list typescript", { stdio: "ignore" });
		} else if (packageManager === "pnpm") {
			const res = execSync("pnpm list typescript", { stdio: "pipe" }).toString("utf-8");
			if (!res) {
				throw new Error("Local TypeScript not detected with pnpm");
			}
		}
	} catch {
		try {
			// Global check.
			if (packageManager === "npm") {
				execSync("npm list -g typescript", { stdio: "ignore" });
			} else if (packageManager === "pnpm") {
				const res = execSync("pnpm list -g typescript", { stdio: "pipe" }).toString("utf-8");
				if (!res) {
					throw new Error("Global TypeScript not detected with pnpm");
				}
			}
		} catch {
			console.error("Could not detect TypeScript installation!");
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
