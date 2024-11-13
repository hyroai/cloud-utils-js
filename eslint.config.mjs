import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import jest from "eslint-plugin-jest";
import js from "@eslint/js";

const compat = new FlatCompat({
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});


export default [{
    ignores: ["dist/**/*"],
}, ...compat.extends("eslint:recommended"), {
    plugins: {
        jest,
    },
    languageOptions: {
        globals: {
            ...globals.node,
            ...jest.environments.globals.globals,
            Atomics: "readonly",
            SharedArrayBuffer: "readonly",
        },

        ecmaVersion: 2018,
        sourceType: "module",
    },

    rules: {
        "spaced-comment": "error",
        "no-unused-vars": "off",
        "no-return-await": "error",
        "require-await": "error",
        "object-shorthand": "error",
        "sort-imports": "error",
        "prefer-const": "error",
        "prefer-destructuring": "error",
        "prefer-arrow-callback": "error",
        "no-useless-rename": "error",
        "no-var": "error",
        yoda: "error",
        "arrow-body-style": "error",
    },
}];