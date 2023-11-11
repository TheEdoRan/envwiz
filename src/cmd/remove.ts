import prompts from "prompts";
import { logError } from "../utils";
import { writeEnvironmentVariablesToFiles } from "./_shared";

export async function askEnvironmentVariablesToRemove(envs: Record<string, string>) {
	if (!Object.keys(envs).length) {
		logError("No environment variables found.");
		process.exit(1);
	}

	const { names } = (await prompts({
		type: "autocompleteMultiselect",
		name: "names",
		message: "Choose which environment variables to remove:",
		choices: Object.keys(envs).map((name) => ({ title: name, value: name })),
		min: 1,
	})) as { names: string[] | undefined };

	if (!names) {
		process.exit(1);
	}

	return names;
}

export function getFilteredEnvironmentVariables(
	envs: Record<string, string>,
	envsToRemove: string[]
) {
	for (const env of envsToRemove) {
		delete envs[env];
	}

	return envs;
}

export function removeEnvironmentVariables(filteredEnvs: Record<string, string>) {
	writeEnvironmentVariablesToFiles(filteredEnvs, "remove");
}
