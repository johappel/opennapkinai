import type { SmartArtStructure, RoughStyle } from "./types";
import COLORS from "../data/colors";

export const ROUGH_STYLES: RoughStyle[] = [
    "hachure",
    "solid",
    "zigzag",
    "cross-hatch",
    "dots",
    "dashed",
    "zigzag-line",
];

export type ThemeName = keyof typeof COLORS;

export const THEME_NAMES = Object.keys(COLORS) as ThemeName[];

export type Presentation = {
    theme: ThemeName;
    isRough: boolean;
    roughStyle: RoughStyle;
};

export const DEFAULT_PRESENTATION: Presentation = {
    theme: "default",
    isRough: false,
    roughStyle: "hachure",
};

/**
 * Reads a presentation object out of persisted (and therefore untrusted) block
 * data. Anything missing or unknown falls back to the default, so an old block
 * with only `originalText` still opens.
 */
export function sanitizePresentation(value: unknown): Presentation {
    const candidate = (value ?? {}) as Partial<Presentation>;
    const theme =
        candidate.theme && THEME_NAMES.includes(candidate.theme as ThemeName)
            ? (candidate.theme as ThemeName)
            : DEFAULT_PRESENTATION.theme;
    const roughStyle =
        candidate.roughStyle && ROUGH_STYLES.includes(candidate.roughStyle as RoughStyle)
            ? (candidate.roughStyle as RoughStyle)
            : DEFAULT_PRESENTATION.roughStyle;
    return {
        theme,
        isRough: candidate.isRough === true,
        roughStyle,
    };
}

/**
 * The structure as it lives in `DiagramData`: one shared node set plus the
 * archetype the user picked. The former `archetype` field of the AI response is
 * gone on purpose, see the note in apps/backend/src/routes/ai.ts.
 */
export function normalizeStructure(value: unknown): SmartArtStructure | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<SmartArtStructure>;
    if (typeof candidate.archetype !== "string") return null;
    if (!Array.isArray(candidate.nodes) || candidate.nodes.length === 0) return null;
    return candidate as SmartArtStructure;
}
