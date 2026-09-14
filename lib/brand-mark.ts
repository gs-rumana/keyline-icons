/**
 * The logo's geometry: `shapes-2` from the set with each shape in a different
 * style, the three styles the set ships in one mark.
 *
 * - the triangle is the stroke drawing's (`icons/stroke/shapes-2.svg`),
 * - the circle is the duotone drawing's, its 0.4 plate under its ring,
 * - the square is the fill drawing's.
 *
 * Every path is copied verbatim from those files and `npm run brand:check`
 * fails if any of them stops matching, here or in `public/logo/logo.svg`, so a
 * redraw of the icon cannot leave the logo behind without saying so.
 *
 * The box is the ink box, 2..22, not the icon's 24 grid: a logo carries no side
 * bearing, so a mark sized 24px is 24px of shapes.
 */
export const BRAND_MARK_VIEWBOX = "2 2 20 20"

export const BRAND_MARK = {
  triangle:
    "M10.2117 4.106 C10.9487 2.6313 13.0529 2.6313 13.7898 4.106 L15.288 7.104 C15.9526 8.4338 14.9856 9.998 13.499 9.998 L10.5026 9.998 C9.016 9.998 8.049 8.4338 8.7135 7.104 L10.2117 4.106 Z",
  plate:
    "M6.5 13C8.9853 13 11 15.0147 11 17.5C11 19.9853 8.9853 22 6.5 22C4.0147 22 2 19.9853 2 17.5C2 15.0147 4.0147 13 6.5 13Z",
  ring: "M10 17.5C10 19.433 8.433 21 6.5 21C4.567 21 3 19.433 3 17.5C3 15.567 4.567 14 6.5 14C8.433 14 10 15.567 10 17.5Z",
  square:
    "M19 13C20.6569 13 22 14.3431 22 16L22 19C22 20.6569 20.6569 22 19 22L16 22C14.3431 22 13 20.6569 13 19L13 16C13 14.3431 14.3431 13 16 13L19 13Z",
} as const

/** The duotone plate's opacity, the set's own. */
export const BRAND_MARK_PLATE_OPACITY = 0.4
