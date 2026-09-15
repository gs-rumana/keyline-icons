/**
 * The logo's geometry: four shapes in the layout of the set's own `shapes`
 * drawing, one for each collection the set ships.
 *
 * - top left, a diamond in **sharp**: no fillet, a 2-unit line with the round
 *   join every sharp outline in `icons/sharp/stroke/` carries,
 * - top right, the triangle from `icons/stroke/shapes-2.svg`, moved 5.5 right,
 * - bottom left, the circle from the duotone drawing, its 0.4 plate under its
 *   ring,
 * - bottom right, the square from the fill drawing.
 *
 * The three `shapes-2` paths are copied verbatim (the triangle moves by a
 * `transform`, not by rewriting its path) and `npm run brand:check` fails if
 * any stops matching its icon, here or in `public/logo/logo.svg`, so a redraw
 * cannot leave the logo behind without saying so. The diamond is the one shape
 * drawn for the logo: no icon in the set is a bare diamond.
 *
 * The diamond's tips sit half a unit outside its 9-unit cell, the way the
 * triangle's do. A diamond covers half the area of the square beside it, so at
 * the same box it reads smaller; the overshoot is what makes the four look the
 * same size.
 *
 * The box is the ink box, 1.5..22.5, including those overshoots, not the
 * icon's 24 grid: a logo carries no side bearing, and an inline `<svg>` clips
 * whatever its viewBox leaves out.
 */
export const BRAND_MARK_VIEWBOX = "1.5 1.5 21 21"

export const BRAND_MARK = {
  diamond: "M6.5 2.5L10.5 6.5L6.5 10.5L2.5 6.5Z",
  triangle:
    "M10.2117 4.106 C10.9487 2.6313 13.0529 2.6313 13.7898 4.106 L15.288 7.104 C15.9526 8.4338 14.9856 9.998 13.499 9.998 L10.5026 9.998 C9.016 9.998 8.049 8.4338 8.7135 7.104 L10.2117 4.106 Z",
  plate:
    "M6.5 13C8.9853 13 11 15.0147 11 17.5C11 19.9853 8.9853 22 6.5 22C4.0147 22 2 19.9853 2 17.5C2 15.0147 4.0147 13 6.5 13Z",
  ring: "M10 17.5C10 19.433 8.433 21 6.5 21C4.567 21 3 19.433 3 17.5C3 15.567 4.567 14 6.5 14C8.433 14 10 15.567 10 17.5Z",
  square:
    "M19 13C20.6569 13 22 14.3431 22 16L22 19C22 20.6569 20.6569 22 19 22L16 22C14.3431 22 13 20.6569 13 19L13 16C13 14.3431 14.3431 13 16 13L19 13Z",
} as const

/** Where the triangle sits: `shapes-2` centres it, `shapes` puts it top right. */
export const BRAND_MARK_TRIANGLE_TRANSFORM = "translate(5.5 0)"

/** The duotone plate's opacity, the set's own. */
export const BRAND_MARK_PLATE_OPACITY = 0.4
