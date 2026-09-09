import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import obsidianmd from "eslint-plugin-obsidianmd";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores([
        "**/node_modules/",
        "**/main.js",
        "esbuild.config.mjs",
        "eslint.config.mjs",
        "version-bump.mjs"
    ]),
    ...obsidianmd.configs.recommended,
    {
        files: ["**/*.ts"],
        extends: compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            "plugin:@typescript-eslint/recommended",
        ),
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parserOptions: {
                projectService: { allowDefaultProject: ["eslint.config.*"] },
            },
            parser: tsParser,
            ecmaVersion: 5,
            sourceType: "module",
        },
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error", {args: "none",}
            ],
            "@typescript-eslint/ban-ts-comment": "off",
            "no-prototype-builtins": "off",
            "@typescript-eslint/no-empty-function": "off",
            // Turn off capitalization warnings for the word "cursor" because 
            // we are not refering to the code editor.
            "obsidianmd/ui/sentence-case": [
                "warn", { ignoreRegex: ["cursor"] } 
            ],
        },
    }
]);