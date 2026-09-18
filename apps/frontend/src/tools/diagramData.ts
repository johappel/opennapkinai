import type { DiagramData } from "./DiagramInlineTool";

/**
 * Erzeugt die Blockdaten aus einem Text.
 *
 * Eigene Funktion, damit die Regel pruefbar ist: sobald ein Diagramm aus einer
 * Textauswahl entsteht, ist der Quelltext die bleibende Bezugsgroesse, nicht die
 * Blockposition. Blockindizes verschieben sich, sobald oberhalb jemand etwas
 * einfuegt oder loescht, und sie zeigen nach einem Loeschen ins Leere.
 *
 * `sourceBlockIndex` bleibt trotzdem im Datensatz, weil schon gespeicherte
 * Notizen es enthalten. Gelesen wird es nirgends mehr, es dient nur der
 * Nachvollziehbarkeit alter Staende.
 */
export function buildDiagramData(input: {
    text: string;
    /** EditorJS-Vergabe, nicht selbst erzeugen. */
    sourceBlockIds?: string[];
    sourceBlockIndex?: number;
}): DiagramData {
    const text = input.text.trim();
    const ids = (input.sourceBlockIds ?? []).filter((id) => typeof id === "string" && id.length > 0);

    return {
        originalText: text,
        sourceBlockIds: ids,
        sourceBlockIndex: input.sourceBlockIndex ?? -1,
    };
}
