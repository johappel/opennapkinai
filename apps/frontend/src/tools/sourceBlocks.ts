import type { API } from "@editorjs/editorjs";

/**
 * Fragt den Editor, ob die Bloecke, aus denen ein Diagramm gebaut wurde, noch
 * existieren.
 *
 * Der Zweck ist nicht Kontrolle, sondern Sichtbarkeit: ein Diagramm, dessen
 * Quelltext geloescht wurde, bleibt stehen und bleibt gerendert, aber niemand
 * kann mehr nachsehen, woraus es entstanden ist. Das soll man sehen, statt es
 * erst zu bemerken, wenn man die Form wechseln will.
 *
 * Rein lesend. Es wird nichts gesucht, nichts wiederhergestellt und nichts
 * geloescht.
 */
export type SourceState =
    | { kind: "keine" }
    | { kind: "vorhanden"; ids: string[] }
    | { kind: "verwaist"; ids: string[]; missing: string[] };

export function checkSourceBlocks(api: API, ids: string[] | undefined): SourceState {
    if (!ids || ids.length === 0) return { kind: "keine" };

    const missing: string[] = [];
    for (const id of ids) {
        if (!api.blocks.getById(id)) missing.push(id);
    }

    return missing.length > 0
        ? { kind: "verwaist", ids, missing }
        : { kind: "vorhanden", ids };
}
