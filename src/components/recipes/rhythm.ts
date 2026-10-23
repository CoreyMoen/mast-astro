/**
 * How the layout dials translate into Row/Col/Spacer choices. Recipes
 * share these so a dial means the same thing in every section; anything
 * specific to one recipe stays in that recipe.
 */
import type { Choices } from "@/dials.ts";

type Span = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Roles a block of content can play in a section. Alignment `mixed`
 * centers intros and calls to action but keeps body content left.
 */
export type Role = "intro" | "body" | "cta";

export function isCentered(layout: Choices, role: Role): boolean {
  if (layout.alignment === "center") return true;
  if (layout.alignment === "left") return false;
  return role !== "body";
}

/** Text measure for a standalone block of copy, as a column span. */
export function measure(layout: Choices): Span {
  return ({ condensed: 10, balanced: 8, generous: 6 } as const)[
    layout.whitespace
  ];
}

/** Space between a section's header and its body, or null for none. */
export function breath(layout: Choices): "main" | "lg" | null {
  return ({ condensed: null, balanced: "main", generous: "lg" } as const)[
    layout.whitespace
  ];
}

/** Gap between columns of content. */
export function gap(layout: Choices): "main" | "md" {
  return layout.whitespace === "condensed" ? "md" : "main";
}
