<img src="https://keylineicons.com/icon.svg" width="56" height="56" alt="Keyline Icons logo">

# @keyline-icons/react-native

1,000 icons on one 24×24 grid, as React Native components. Pure JS on
`react-native-svg`, free under MIT.

[keylineicons.com](https://keylineicons.com) to browse the full set.

```bash
npm i @keyline-icons/react-native react-native-svg
```

Peer dependencies: `react` >= 18, `react-native` >= 0.79, `react-native-svg` >= 15.

React Native 0.79 is the floor because the style entry points (`/fill`,
`/sharp/duotone` and the rest) resolve through the package `exports` map, which
Metro reads by default from that release (Metro 0.82). On an older Metro they fail to
resolve unless you set `resolver.unstable_enablePackageExports = true`.

```tsx
import { ArrowUpRight, Check, Menu } from "@keyline-icons/react-native"

export function Example() {
  return (
    <>
      <Check size={16} color="#111" />
      <ArrowUpRight size={16} />
      <Menu strokeWidth={1.5} />
    </>
  )
}
```

## Props

Every named icon takes `react-native-svg`'s `SvgProps` plus `size`:

| Prop | Default | Notes |
| --- | --- | --- |
| `size` | `24` | Sets both `width` and `height`. |
| `color` | | Applied on the root `Svg`; every painted stroke and fill in the set is `currentColor`, so this is the icon's colour. Left unset, `react-native-svg` paints it black. |
| `strokeWidth` | `2` | The set is drawn at 2 on a 24 grid. Fill drawings carry no stroke of their own. |
| `style` | | React Native layout style on the root `Svg`. |

There is no `className`, no provider, no context and no theme object. Colour
comes from the `color` prop (and `currentColor` on the paths).

## Notes

**Four styles, two corner treatments, eight entry points.**

```tsx
import { Bell } from "@keyline-icons/react-native"          // stroke,  1,000 icons
import { Bell } from "@keyline-icons/react-native/two-tone" // two-tone, 1,000 icons
import { Bell } from "@keyline-icons/react-native/duotone"  // duotone, 1,000 icons
import { Bell } from "@keyline-icons/react-native/fill"     // fill,    1,000 icons

import { Bell } from "@keyline-icons/react-native/sharp"           // the same four,
import { Bell } from "@keyline-icons/react-native/sharp/two-tone"  // cut sharp,
import { Bell } from "@keyline-icons/react-native/sharp/duotone"  // with butt caps and
import { Bell } from "@keyline-icons/react-native/sharp/fill"     // square corners
```

Sharp covers exactly the names the rounded entry point beside it does, and the
export is called the same thing in both, so switching a file over is a change
to the import path and nothing else.

Separate imports rather than one component with a `weight` prop, so an app
ships only the styles it imports. Since 1.0.0 all four cover every name.
`two-tone` is the outline over a 40% plate; `/duotone` has no outline, a grey
body with the detail at full strength.

**Name-based lookup** via a default export from `/icon`. Use this when the
icon is chosen at runtime. Importing it loads the full cross-style registry,
so prefer named imports when the icons are known at build time.

```tsx
import KeylineIcon from "@keyline-icons/react-native/icon"

export function Dynamic({ name }: { name: string }) {
  return (
    <>
      <KeylineIcon name="check" iconStyle="stroke" size={24} color="#111" />
      <KeylineIcon name="bell" iconStyle="duotone" corners="sharp" />
      <KeylineIcon name={name} />
    </>
  )
}
```

| Prop | Default | Notes |
| --- | --- | --- |
| `name` | required | Kebab-case SVG basename (`check`, `arrow-up-right`). Typed as `IconName` for autocomplete, but any string is accepted. |
| `iconStyle` | `"stroke"` | `'stroke' \| 'two-tone' \| 'duotone' \| 'fill'` |
| `corners` | `"rounded"` | `'rounded' \| 'sharp'` |

An unknown `name` or a style/corners combination the set does not have renders
`null`. In development it also `console.warn`s. It does not throw.

`KeylineIcon` is also a named export from the same module.

**Each icon carries its own root attributes** rather than inheriting a shared
preset. Some drawings are solid by definition, `square-half` and the other
fraction sectors among them, and forcing a stroke onto those paints an outline
over every knockout.

**`sideEffects: false` and ESM.** The flag lets webpack-style bundlers (Expo
web, `react-native-web`) drop the icons you do not import. Metro does not
tree-shake by default: importing from `@keyline-icons/react-native` puts every
component of that style in your bundle, however few you use. They are plain
functions with no work at import time, so the cost is bundle size, not startup.
Importing `/icon` loads all eight styles.

**Generated, not written.** The components come from `icons/<style>/*.svg` via
`pipeline/build-react-native.mjs`. Do not edit `packages/react-native/src/`.

## Licence

MIT. Use them in anything, commercial included, without attribution. The licence
does not grant rights in the name "Keyline Icons".
