// Lazily-created offscreen canvas used purely for text measurement.
let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
    if (measureCtx) return measureCtx;
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d");
    return measureCtx;
}

export function measureTextWidth(text: string, font: string): number {
    const ctx = getMeasureContext();
    if (!ctx) return text.length * 7;
    ctx.font = font;
    return ctx.measureText(text).width;
}

/** Greedy word-wrap: splits text into lines that fit within maxWidth for the given font. */
export function wrapText(text: string, font: string, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (current && measureTextWidth(candidate, font) > maxWidth) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
}

export const TITLE_FONT = "700 14px system-ui, sans-serif";
export const CONTENT_FONT = "400 11px system-ui, sans-serif";
export const TITLE_LINE_HEIGHT = 18;
export const CONTENT_LINE_HEIGHT = 14;
/** Vertical padding above the title + gap between title/content block + bottom padding. */
const VERTICAL_PADDING = 34;

export type MeasuredBlock = {
    titleLines: string[];
    contentLines: string[];
    titleLineHeight: number;
    contentLineHeight: number;
    /** Minimum height required to fit the wrapped title + content within the box. */
    height: number;
};

export function measureBlock(title: string, content: string, maxWidth: number, maxContentLines = 4): MeasuredBlock {
    const titleLines = wrapText(title, TITLE_FONT, maxWidth);
    let contentLines = wrapText(content, CONTENT_FONT, maxWidth);
    if (contentLines.length > maxContentLines) {
        contentLines = contentLines.slice(0, maxContentLines);
        const last = contentLines[maxContentLines - 1];
        contentLines[maxContentLines - 1] = last.replace(/\s*$/, "") + "…";
    }

    const height =
        VERTICAL_PADDING +
        titleLines.length * TITLE_LINE_HEIGHT +
        (contentLines.length ? 6 + contentLines.length * CONTENT_LINE_HEIGHT : 0);

    return {
        titleLines,
        contentLines,
        titleLineHeight: TITLE_LINE_HEIGHT,
        contentLineHeight: CONTENT_LINE_HEIGHT,
        height,
    };
}
