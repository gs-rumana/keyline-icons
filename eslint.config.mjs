import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated RN components import react-native-svg primitives the Next
    // eslint config does not resolve, and unused Circle/Rect imports are
    // intentional so every module shares one header.
    "packages/react-native/src/**",
  ]),
]);

export default eslintConfig;
