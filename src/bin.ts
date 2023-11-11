#!/usr/bin/env node

import { Command } from "commander";
import { assertRequiredFilesExist, getParsedEnvs } from "./cmd/_shared";
import { addEnvironmentVariable, askEnvironmentVariableInfos } from "./cmd/add";
import {
	assertNPMInstalled,
	assertTypescriptInstalled,
	createEnvFiles,
	getExistingFiles,
} from "./cmd/init";
import {
	askEnvironmentVariablesToRemove,
	getFilteredEnvironmentVariables,
	removeEnvironmentVariables,
} from "./cmd/remove";

function run() {
	const program = new Command();

	program
		.name("envwiz")
		.description("Manage your TypeScript environment variables with ease.")
		.version("1.0.1");

	program
		.command("init")
		.description("Create required environment files")
		.action(async () => {
			assertNPMInstalled();
			assertTypescriptInstalled();
			const filesFound = getExistingFiles();
			await createEnvFiles(filesFound);
		});

	program
		.command("add")
		.description("Add a new environment variable")
		.option("-c, --clear", "Don't hide the environment variable value")
		.action(async (opts) => {
			assertRequiredFilesExist();
			const envs = getParsedEnvs();
			const { name, value } = await askEnvironmentVariableInfos(opts?.clear);
			addEnvironmentVariable(envs, { name, value });
		});

	program
		.command("remove")
		.description("Remove environment variables")
		.action(async () => {
			assertRequiredFilesExist();
			const envs = getParsedEnvs();
			const envsToRemove = await askEnvironmentVariablesToRemove(envs);
			const filteredEnvs = getFilteredEnvironmentVariables(envs, envsToRemove);
			removeEnvironmentVariables(filteredEnvs);
		});

	program
		.command("sync")
		.description("Sync environment variables from .env to other files")
		.action(async () => {
			assertRequiredFilesExist();
			const envs = getParsedEnvs();
			await askToSyncEnvironmentVariables();
			syncEnvironmentVariables(envs);
		});

	program.parse();
}

run();
