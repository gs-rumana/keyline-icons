// Runs the real `KeylineIcon` and the eight generated modules, not just the
// name lists. `src/` is TSX importing `react-native-svg`, which needs a native
// view manager, so the test transpiles `src/` into a scratch directory under
// `test/` (where `react` resolves from the repo's node_modules) and points
// `react-native-svg` at a stub. Nothing is mounted: `KeylineIcon` is a plain
// function returning an element, and the element's `type` says what it chose.

import test, { before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"
import ts from "typescript"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = join(root, "src")
const out = join(root, "test", ".build")

let KeylineIcon

before(async () => {
  rmSync(out, { recursive: true, force: true })
  mkdirSync(join(out, "node_modules", "react-native-svg"), { recursive: true })

  // `"type": "module"` so the scratch `.js` files are ESM, like the published ones.
  writeFileSync(join(out, "package.json"), '{ "type": "module" }\n')
  writeFileSync(
    join(out, "node_modules", "react-native-svg", "package.json"),
    '{ "name": "react-native-svg", "type": "module", "main": "index.js" }\n'
  )
  const names = ["Path", "Circle", "Rect", "Line", "Polyline", "Polygon", "Ellipse"]
  writeFileSync(
    join(out, "node_modules", "react-native-svg", "index.js"),
    `export default function Svg() { return null }\n` +
      names.map((n) => `export function ${n}() { return null }`).join("\n") +
      "\n"
  )

  for (const file of readdirSync(src).filter((f) => f.endsWith(".tsx"))) {
    const { outputText } = ts.transpileModule(readFileSync(join(src, file), "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
    })
    writeFileSync(join(out, file.replace(/\.tsx$/, ".js")), outputText)
  }

  globalThis.__DEV__ = true
  ;({ KeylineIcon } = await import(pathToFileURL(join(out, "icon.js")).href))
})

after(() => {
  delete globalThis.__DEV__
  rmSync(out, { recursive: true, force: true })
})

/** Run `fn` with `console.warn` captured, returning what it was called with. */
function warnings(fn) {
  const seen = []
  const original = console.warn
  console.warn = (...args) => seen.push(args.join(" "))
  try {
    fn()
  } finally {
    console.warn = original
  }
  return seen
}

test("a known name renders that icon", () => {
  const el = KeylineIcon({ name: "check" })
  assert.equal(el.type.name, "Check")
})

test("props reach the icon", () => {
  const el = KeylineIcon({ name: "check", size: 16, color: "#111" })
  assert.equal(el.props.size, 16)
  assert.equal(el.props.color, "#111")
})

test("style and corners pick different modules", () => {
  const seen = new Set()
  for (const iconStyle of ["stroke", "two-tone", "duotone", "fill"]) {
    for (const corners of ["rounded", "sharp"]) {
      const el = KeylineIcon({ name: "check", iconStyle, corners })
      assert.ok(el, `${iconStyle}/${corners} rendered nothing`)
      seen.add(el.type)
    }
  }
  assert.equal(seen.size, 8)
})

test("an unknown name renders null and warns in development", () => {
  const seen = warnings(() => {
    assert.equal(KeylineIcon({ name: "not-a-real-icon-zzz" }), null)
  })
  assert.equal(seen.length, 1)
  assert.match(seen[0], /unknown icon: name=not-a-real-icon-zzz/)
})

test("inherited object members are not icon names", () => {
  // `map[name]` finds these on Object.prototype: a function or an object, both
  // truthy, so React would throw rather than get the documented `null`.
  const names = ["constructor", "toString", "hasOwnProperty", "__proto__", "valueOf"]
  warnings(() => {
    for (const name of names) {
      assert.equal(KeylineIcon({ name }), null, `${name} should render null`)
    }
  })
})

test("inherited members are not styles or corners either", () => {
  warnings(() => {
    assert.equal(KeylineIcon({ name: "check", iconStyle: "constructor" }), null)
    assert.equal(KeylineIcon({ name: "check", corners: "__proto__" }), null)
  })
})

test("every registry name resolves to a component in its own style", () => {
  const registry = JSON.parse(readFileSync(join(src, "registry.json"), "utf8"))
  for (const [iconStyle, byCorners] of Object.entries(registry)) {
    for (const [corners, names] of Object.entries(byCorners)) {
      for (const name of names) {
        assert.ok(
          KeylineIcon({ name, iconStyle, corners }),
          `${name} missing from ${iconStyle}/${corners}`
        )
      }
    }
  }
})
