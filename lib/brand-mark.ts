/**
 * The logo's geometry: four shapes in a 2x2, one for each style the set ships
 * since 1.0.0 split two-tone from duotone.
 *
 * - top left, a diamond in **stroke**, cut **sharp**: no fillet, a 2-unit line
 *   with the round join every outline in `icons/sharp/stroke/` carries,
 * - top right, a triangle in **duotone**: the 0.4 plate on its own, no outline,
 *   which is what duotone means now,
 * - bottom left, a circle in **two-tone**: the same plate under its ring,
 * - bottom right, a square in **fill**.
 *
 * The three `shapes-2` shapes are copied verbatim from the drawings that define
 * those styles, `icons/two-tone/shapes-2.svg` and `icons/fill/shapes-2.svg`
 * (the triangle moves to its cell by a `transform`, not by rewriting its path),
 * and `npm run brand:check` fails if any stops matching, here or in
 * `public/logo/logo.svg`. The diamond is the one shape drawn for the logo: no
 * icon in the set is a bare diamond.
 *
 * The diamond's tips sit half a unit outside its 9-unit cell. A diamond covers
 * half the area of the shapes beside it, so at the same box it reads smaller,
 * and the overshoot is what makes the four look the same size.
 *
 * The box is the ink, 1.5..22 on both axes with that overshoot: a logo carries
 * no side bearing, and an inline `<svg>` clips whatever its viewBox leaves out.
 */
export const BRAND_MARK_VIEWBOX = "1.5 1.5 20.5 20.5"

export const BRAND_MARK = {
  diamond: "M6.5 2.5L10.5 6.5L6.5 10.5L2.5 6.5Z",
  trianglePlate:
    "M9.3182 3.6589 C10.4236 1.447 13.5801 1.447 14.6854 3.6589 L16.1835 6.657 C17.1798 8.6515 15.7295 10.9978 13.4999 10.9978 L10.5038 10.9978 C8.274 10.9978 6.8236 8.6516 7.8202 6.657 L9.3182 3.6589 Z",
  plate:
    "M6.5 13C8.9853 13 11 15.0147 11 17.5C11 19.9853 8.9853 22 6.5 22C4.0147 22 2 19.9853 2 17.5C2 15.0147 4.0147 13 6.5 13Z",
  ring: "M10 17.5C10 19.433 8.433 21 6.5 21C4.567 21 3 19.433 3 17.5C3 15.567 4.567 14 6.5 14C8.433 14 10 15.567 10 17.5Z",
  square:
    "M19 13C20.6569 13 22 14.3431 22 16L22 19C22 20.6569 20.6569 22 19 22L16 22C14.3431 22 13 20.6569 13 19L13 16C13 14.3431 14.3431 13 16 13L19 13Z",
} as const

/** Where the duotone triangle sits: `shapes-2` centres it, the logo puts it top right. */
export const BRAND_MARK_TRIANGLE_TRANSFORM = "translate(5.5 0)"

/** The plate's opacity, the set's own, for both two-tone and duotone. */
export const BRAND_MARK_PLATE_OPACITY = 0.4
