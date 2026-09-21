import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
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
