/** @type {import('eslint').Linter.Config} */
module.exports = {
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json",
		ecmaVersion: "latest",
		sourceType: "module",
	},
	plugins: ["@typescript-eslint"],
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	rules: {
		"@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-inferrable-types": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-floating-promises": "warn",
	},
};
