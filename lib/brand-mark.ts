/**
 * The logo's geometry: three shapes, a line, a plate and a fill, the three ways
 * the set draws.
 *
 * - on top, centred, a diamond in **sharp**: no fillet, a 2-unit line with the
 *   round join every sharp outline in `icons/sharp/stroke/` carries,
 * - bottom left, the circle from `icons/duotone/shapes-2.svg`, its 0.4 plate
 *   under its ring,
 * - bottom right, the square from `icons/fill/shapes-2.svg`.
 *
 * The diamond takes the place `shapes-2` gives its triangle, centred over the
 * gap between the two below. It is the one shape drawn for the logo, no icon
 * in the set is a bare diamond, and its tips sit half a unit outside a 9-unit
 * cell: a diamond covers half the area of the square beside it, so at the same
 * box it reads smaller, and the overshoot is what makes the three look the
 * same size.
 *
 * The circle and square are copied verbatim, and `npm run brand:check` fails if
 * either stops matching its icon, here or in `public/logo/logo.svg`, so a
 * redraw cannot leave the logo behind without saying so.
 *
 * The box is square and holds the ink, 1.5..22 tall with the diamond's
 * overshoot, 2..22 wide, centred to 1.75..22.25: a logo carries no side
 * bearing, and an inline `<svg>` clips whatever its viewBox leaves out.
 */
export const BRAND_MARK_VIEWBOX = "1.75 1.5 20.5 20.5"

export const BRAND_MARK = {
  diamond: "M12 2.5L16 6.5L12 10.5L8 6.5Z",
  plate:
    "M6.5 13C8.9853 13 11 15.0147 11 17.5C11 19.9853 8.9853 22 6.5 22C4.0147 22 2 19.9853 2 17.5C2 15.0147 4.0147 13 6.5 13Z",
  ring: "M10 17.5C10 19.433 8.433 21 6.5 21C4.567 21 3 19.433 3 17.5C3 15.567 4.567 14 6.5 14C8.433 14 10 15.567 10 17.5Z",
  square:
    "M19 13C20.6569 13 22 14.3431 22 16L22 19C22 20.6569 20.6569 22 19 22L16 22C14.3431 22 13 20.6569 13 19L13 16C13 14.3431 14.3431 13 16 13L19 13Z",
} as const

/** The duotone plate's opacity, the set's own. */
export const BRAND_MARK_PLATE_OPACITY = 0.4
