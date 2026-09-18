import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Loader2, RefreshCw } from "lucide-react";
import type { Archetype } from "./types";
import { archetypeFit, ARCHETYPE_LABELS } from "./archetypeFit";
import ArchetypeTile, { defaultTilePalette } from "./ArchetypeTile";
import { useNodeExtraction } from "./useNodeExtraction";
import { DEFAULT_PRESENTATION, sanitizePresentation, type Presentation } from "./presentation";

type Props = {
    /** The text the nodes are read from. */
    originalText: string;
    /** Nodes already persisted with the block, if any. */
    structure: import("./types").SmartArtStructure | null;
    presentation?: Presentation;
    onStructure: (structure: import("./types").SmartArtStructure) => void;
    onPick: (archetype: Archetype) => void;
};

/**
 * The middle step of the flow: pick a shape before the diagram is drawn.
 *
 * Only the shapes that fit these nodes are offered, and the count that decides
 * this is visible. That number is the honest part: it says how many separate
 * ideas the text holds, which is what limits the choice. The shapes left out
 * are listed with their reason rather than hidden.
 */
export default function VariantChooser({
    originalText,
    structure,
    presentation,
    onStructure,
    onPick,
}: Props) {
    const [showWithheld, setShowWithheld] = useState(false);
    const [liveStructure, setLiveStructure] = useState(structure);

    const effectivePresentation: Presentation = {
        ...DEFAULT_PRESENTATION,
        ...sanitizePresentation(presentation),
    };
    const palette = defaultTilePalette(effectivePresentation.theme);

    const extraction = useNodeExtraction({
        originalText,
        persisted: structure,
        onStructure: (next) => {
            setLiveStructure(next);
            onStructure(next);
        },
    });

    useEffect(() => {
        if (structure) setLiveStructure(structure);
    }, [structure]);

    const nodes = liveStructure?.nodes ?? extraction.structure?.nodes ?? null;

    const verdicts = useMemo(() => (nodes ? archetypeFit(nodes) : []), [nodes]);
    const offered = verdicts.filter((verdict) => verdict.ok);
    const withheld = verdicts.filter((verdict) => !verdict.ok);

    if (extraction.isLoading && !nodes) {
        return (
            <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Inhalt wird gelesen, Ideen werden getrennt...</span>
            </div>
        );
    }

    if (extraction.error && !nodes) {
        return (
            <div className="flex flex-col items-center gap-3 py-16">
                <span className="text-sm text-red-600">
                    Der Modellaufruf ist gescheitert: {extraction.error}
                </span>
                <button
                    type="button"
                    onClick={extraction.retry}
                    className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                    <RefreshCw className="h-4 w-4" />
                    Erneut versuchen
                </button>
            </div>
        );
    }

    if (!nodes || offered.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                <span className="text-sm">
                    {nodes
                        ? "Dieser Text gibt keine Form her, die sich ehrlich zeichnen laesst."
                        : "Dieser Block enthaelt keinen Text."}
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-sm text-slate-600">
                    Aus dem Text wurden <strong>{nodes.length}</strong> getrennte Ideen gelesen.
                    Diese Formen koennen sie zeigen. Die Wahl aendert die Anordnung, nicht den
                    Inhalt.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {offered.map((verdict) => (
                    <div key={verdict.archetype} className="relative">
                        <ArchetypeTile
                            archetype={verdict.archetype}
                            palette={palette}
                            isRough={effectivePresentation.isRough}
                            roughStyle={effectivePresentation.roughStyle}
                            title={ARCHETYPE_LABELS[verdict.archetype]}
                            selected={false}
                            onSelect={() => onPick(verdict.archetype)}
                        />
                        {verdict.advisory && (
                            <span
                                title={verdict.reason}
                                className="absolute right-2 top-2 rounded-full bg-amber-100 px-1.5 text-xs font-medium text-amber-700"
                            >
                                !
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {withheld.length > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowWithheld((value) => !value)}
                        className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-700"
                    >
                        {withheld.length} weitere Formen passen nicht
                    </button>
                    {showWithheld && (
                        <ul className="mt-2 space-y-1">
                            {withheld.map((verdict) => (
                                <li key={verdict.archetype} className="text-xs text-slate-500">
                                    <span className="font-medium text-slate-600">
                                        {ARCHETYPE_LABELS[verdict.archetype]}:
                                    </span>{" "}
                                    {verdict.reason}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
