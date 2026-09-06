export interface Point {
  x: number
  y: number
}

/** A position expressed as a fraction (0..1) of the current field width/height — resolved to a `Point` at runtime via the live field size, since the field itself is resizable (`Scale.RESIZE`). */
export interface RelativePoint {
  xFraction: number
  yFraction: number
}
