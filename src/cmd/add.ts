import prompts from "prompts";
import { logError, stringToUpperSnakeCase } from "../utils";
import { writeEnvironmentVariablesToFiles } from "./_shared";

export async function askEnvironmentVariableInfos(clear?: boolean) {
	const { name, value } = (await prompts([
		{
			type: "text",
			name: "name",
			message: "Environment variable name:",
			validate: (value) => value.length > 0,
			format: stringToUpperSnakeCase,
		},
		{
			type: clear ? "text" : "password",
			name: "value",
			message: (prev) => `${prev} value:`,
			validate: (value) => value.length > 0,
		},
	])) as { name: string | undefined; value: string | undefined };

	if (!name || !value) {
		process.exit(1);
	}

	return { name, value };
}

export function addEnvironmentVariable(
	currentEnvs: Record<string, string>,
	{ name, value }: { name: string; value: string }
) {
	if (Object.keys(currentEnvs).includes(name)) {
		logError(`Environment variable ${name} already exists.`);
		process.exit(1);
	}

	const newEnvs = { ...currentEnvs, [name]: value };

	writeEnvironmentVariablesToFiles(newEnvs, "add");
}
