declare module "react-native-svg" {
  import type { ComponentType, ReactNode } from "react"

  export type SvgProps = Record<string, unknown>

  const Svg: ComponentType<SvgProps & { children?: ReactNode }>
  export const Path: ComponentType<Record<string, unknown>>
  export const Circle: ComponentType<Record<string, unknown>>
  export const Rect: ComponentType<Record<string, unknown>>
  export const Line: ComponentType<Record<string, unknown>>
  export const Polyline: ComponentType<Record<string, unknown>>
  export const Polygon: ComponentType<Record<string, unknown>>
  export const Ellipse: ComponentType<Record<string, unknown>>
  export default Svg
}
