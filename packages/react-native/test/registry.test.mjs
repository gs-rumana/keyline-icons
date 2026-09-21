import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const registry = JSON.parse(readFileSync(join(root, "src", "registry.json"), "utf8"))

const STYLES = ["stroke", "two-tone", "duotone", "fill"]
const CORNERS = ["rounded", "sharp"]

test("stroke rounded includes check", () => {
  assert.ok(registry.stroke.rounded.includes("check"))
})

test("unknown name not listed", () => {
  assert.equal(registry.stroke.rounded.includes("not-a-real-icon-zzz"), false)
})

test("every style has rounded and sharp name lists", () => {
  for (const style of STYLES) {
    assert.ok(registry[style], `missing style ${style}`)
    for (const corners of CORNERS) {
      assert.ok(Array.isArray(registry[style][corners]), `${style}.${corners} is not a list`)
      assert.ok(registry[style][corners].length > 0, `${style}.${corners} is empty`)
    }
  }
})

test("sharp covers the same names as rounded per style", () => {
  for (const style of STYLES) {
    assert.deepEqual(registry[style].sharp, registry[style].rounded)
  }
})
