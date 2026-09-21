import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))

const expected = [
  ".",
  "./two-tone",
  "./duotone",
  "./fill",
  "./sharp",
  "./sharp/two-tone",
  "./sharp/duotone",
  "./sharp/fill",
  "./icon",
  "./package.json",
]

test("exports map has eight styles + icon", () => {
  assert.deepEqual(Object.keys(pkg.exports).sort(), [...expected].sort())
})

test("every export compiles from a source module", () => {
  // `dist/sharp-two-tone.js` exists only if `src/sharp-two-tone.tsx` does, so a
  // typo in the map is a published path that 404s, not a build error.
  for (const [key, target] of Object.entries(pkg.exports)) {
    if (typeof target === "string") continue
    for (const cond of ["types", "default"]) {
      const m = target[cond].match(/^\.\/dist\/(.+)\.(d\.ts|js)$/)
      assert.ok(m, `${key} ${cond} does not point into dist/: ${target[cond]}`)
      assert.ok(existsSync(join(root, "src", `${m[1]}.tsx`)), `${key} -> src/${m[1]}.tsx is missing`)
    }
  }
})
