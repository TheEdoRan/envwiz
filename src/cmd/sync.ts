import prompts from "prompts";
import { writeEnvironmentVariablesToFiles } from "./_shared";

export async function askToSyncEnvironmentVariables() {
	const { choice } = await prompts({
		type: "confirm",
		name: "choice",
		message: "Do you want to sync environment variables from .env?",
		initial: true,
	});

	if (!choice) {
		process.exit(0);
	}
}

export function syncEnvironmentVariables(envs: Record<string, string>) {
	writeEnvironmentVariablesToFiles(envs, "sync");
}
