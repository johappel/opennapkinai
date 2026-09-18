import type { Archetype, SmartArtNode } from "./types";

export type FitVerdict = {
    archetype: Archetype;
    /** Whether rendering this archetype with these nodes can be trusted. */
    ok: boolean;
    /** Shown to the user when the variant is not offered. One short sentence. */
    reason: string;
    /** True when the diagram would be arithmetically valid but reads badly. */
    advisory: boolean;
};

const MIN_NODES = 3;
const MAX_NODES = 9;

const ARCHETYPE_ORDER: Archetype[] = [
    "process",
    "cycle",
    "hierarchy",
    "pyramid",
    "matrix",
    "comparison",
];

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
    process: "Ablauf",
    cycle: "Kreislauf",
    hierarchy: "Hierarchie",
    pyramid: "Stufen",
    matrix: "Raster",
    comparison: "Gegenüberstellung",
};

/**
 * Textbook node counts per archetype. These are the shapes each layout was
 * designed for; outside them the diagrams still render, but less convincingly.
 * The ranges match SMARTART_SYSTEM_PROMPT in apps/backend/src/routes/ai.ts.
 */
const COMFORT: Record<Archetype, { min: number; max: number }> = {
    process: { min: 3, max: 6 },
    cycle: { min: 3, max: 8 },
    hierarchy: { min: 3, max: 9 },
    pyramid: { min: 3, max: 5 },
    matrix: { min: 4, max: 9 },
    comparison: { min: 4, max: 8 },
};

/**
 * Decides which diagram archetypes a given node set can honestly carry. Pure
 * arithmetic on the nodes, no layout involved, so it also runs without a DOM.
 *
 * Two kinds of answer are possible:
 * - `ok: false` means the layout cannot render or would be misleading. Those
 *   variants are not offered at all.
 * - `ok: true` with `advisory: true` means it renders, but the node count is
 *   outside the comfortable range, so the user is told.
 */
export function archetypeFit(nodes: SmartArtNode[]): FitVerdict[] {
    const count = nodes.length;
    const hasSingleRoot = countRoots(nodes) === 1;
    const parentsResolve = everyParentResolves(nodes);

    return ARCHETYPE_ORDER.map((archetype) => {
        if (count < MIN_NODES) {
            return {
                archetype,
                ok: false,
                reason: `Zu wenig Inhalt fuer ein Diagramm, ${count} von mindestens ${MIN_NODES} Knoten.`,
                advisory: false,
            };
        }
        if (count > MAX_NODES) {
            return {
                archetype,
                ok: false,
                reason: `Zu viel Inhalt, ${count} von hoechstens ${MAX_NODES} Knoten.`,
                advisory: false,
            };
        }

        switch (archetype) {
            case "comparison":
                if (count % 2 !== 0) {
                    return {
                        archetype,
                        ok: false,
                        reason: `Gegenüberstellung braucht zwei gleich grosse Seiten, ${count} ist ungerade.`,
                        advisory: false,
                    };
                }
                break;
            case "pyramid":
                if (count > COMFORT.pyramid.max) {
                    return {
                        archetype,
                        ok: false,
                        reason: `Stufen tragen hoechstens ${COMFORT.pyramid.max} Ebenen, es sind ${count}.`,
                        advisory: false,
                    };
                }
                break;
            case "matrix":
                if (count < COMFORT.matrix.min) {
                    return {
                        archetype,
                        ok: false,
                        reason: `Raster braucht mindestens ${COMFORT.matrix.min} Felder, es sind ${count}.`,
                        advisory: false,
                    };
                }
                break;
            case "hierarchy":
                if (!hasSingleRoot || !parentsResolve) {
                    return {
                        archetype,
                        ok: false,
                        reason: "Hierarchie braucht eine erkennbare Wurzel und aufloesbare Elternbezuege.",
                        advisory: false,
                    };
                }
                break;
            default:
                break;
        }

        const comfort = COMFORT[archetype];
        const outside = count < comfort.min || count > comfort.max;
        return {
            archetype,
            ok: true,
            reason: outside
                ? `Rendert, ist aber fuer ${comfort.min} bis ${comfort.max} Knoten gedacht.`
                : "",
            advisory: outside,
        };
    });
}

/** Only the variants that can actually carry this node set. */
export function usableArchetypes(nodes: SmartArtNode[]): Archetype[] {
    return archetypeFit(nodes)
        .filter((verdict) => verdict.ok)
        .map((verdict) => verdict.archetype);
}

/** Reasons for the variants that are withheld, for a short explanatory line. */
export function withheldReasons(nodes: SmartArtNode[]): string[] {
    const reasons = archetypeFit(nodes)
        .filter((verdict) => !verdict.ok)
        .map((verdict) => verdict.reason);
    return Array.from(new Set(reasons));
}

function countRoots(nodes: SmartArtNode[]): number {
    return nodes.filter((node) => node.parentId === null || node.parentId === undefined).length;
}

function everyParentResolves(nodes: SmartArtNode[]): boolean {
    const ids = new Set(nodes.map((node) => node.id));
    return nodes.every((node) => {
        if (node.parentId === null || node.parentId === undefined) return true;
        if (node.parentId === node.id) return false;
        return ids.has(node.parentId);
    });
}
