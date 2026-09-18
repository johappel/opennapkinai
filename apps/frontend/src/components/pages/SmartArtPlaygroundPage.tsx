import { useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { MOCK_STRUCTURES, type MockStructureKey } from "../../smartart/mockData";
import VariantChooser from "../../smartart/VariantChooser";
import DiagramResult from "../../smartart/DiagramResult";
import { archetypeFit, ARCHETYPE_LABELS } from "../../smartart/archetypeFit";
import { useNodeExtraction } from "../../smartart/useNodeExtraction";
import type { Archetype, SmartArtStructure } from "../../smartart/types";
import type { Presentation } from "../../smartart/presentation";

const STRUCTURE_KEYS = Object.keys(MOCK_STRUCTURES) as MockStructureKey[];
const PARAGRAPH_PLACEHOLDER = `Fuege einen Absatz ein. Das Modell liest die Ideen heraus, danach waehlst du die Form. Zum Pruefen der Kette reicht dieser Beispieltext:

Die Fachoberschulreife wird an Gesamtschulen anders erreicht als am Gymnasium. Beide Wege fuehren zum gleichen Abschluss, unterscheiden sich aber in Dauer und Betreuungsdichte. Wer nach der zehnten Klasse wechselt, verliert in manchen Bundeslaendern ein Jahr. Die Kultusministerkonferenz hat die Vergleichbarkeit mehrfach zugesagt, ohne sie herzustellen.`;

type Source = "mock" | "ai";

/** Standalone harness for the diagram pipeline. Not routed, reachable via dev URL. */
export function SmartArtPlaygroundPage() {
    const [source, setSource] = useState<Source>("mock");
    const [mockKey, setMockKey] = useState<MockStructureKey>(STRUCTURE_KEYS[0]);
    const [paragraph, setParagraph] = useState("");
    const [structure, setStructure] = useState<SmartArtStructure | null>(null);
    const [archetype, setArchetype] = useState<Archetype | null>(null);
    const [presentation, setPresentation] = useState<Presentation | undefined>(undefined);

    const mockStructure = MOCK_STRUCTURES[mockKey];
    const activeStructure = source === "ai" ? structure : mockStructure;

    const extraction = useNodeExtraction({
        originalText: paragraph,
        persisted: null,
        onStructure: setStructure,
    });

    const verdicts = useMemo(
        () => (activeStructure ? archetypeFit(activeStructure.nodes) : []),
        [activeStructure],
    );

    const switchSource = (next: Source) => {
        setSource(next);
        setArchetype(null);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-5 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                    <h1 className="text-xl font-semibold text-slate-800">Diagramm-Werkstatt</h1>
                </div>

                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => switchSource("mock")}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                source === "mock" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Testdaten
                        </button>
                        <button
                            type="button"
                            onClick={() => switchSource("ai")}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                source === "ai" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Aus Text erzeugen
                        </button>
                    </div>

                    {source === "mock" ? (
                        <label className="flex flex-col text-sm font-medium text-slate-700">
                            Datensatz
                            <select
                                value={mockKey}
                                onChange={(event) => {
                                    setMockKey(event.target.value as MockStructureKey);
                                    setArchetype(null);
                                }}
                                className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                {STRUCTURE_KEYS.map((key) => (
                                    <option key={key} value={key}>
                                        {key} — {MOCK_STRUCTURES[key].nodes.length} Knoten
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <div>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                                Absatz
                                <textarea
                                    value={paragraph}
                                    onChange={(event) => {
                                        setParagraph(event.target.value);
                                        setStructure(null);
                                        setArchetype(null);
                                    }}
                                    rows={7}
                                    placeholder={PARAGRAPH_PLACEHOLDER}
                                    className="mt-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <div className="mt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={extraction.retry}
                                    disabled={!paragraph.trim() || extraction.isLoading}
                                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {extraction.isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Wand2 className="h-4 w-4" />
                                    )}
                                    {extraction.isLoading ? "Liest..." : "Ideen herauslesen"}
                                </button>
                                {extraction.error && (
                                    <span className="text-sm text-red-600">{extraction.error}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {activeStructure && (
                    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
                            {verdicts.filter((verdict) => verdict.ok).length} von {verdicts.length} Formen passen zu
                            diesen {activeStructure.nodes.length} Knoten
                        </p>
                        <ul className="grid gap-1 sm:grid-cols-2">
                            {verdicts.map((verdict) => (
                                <li key={verdict.archetype} className="text-xs">
                                    <span className={verdict.ok ? "text-slate-700" : "text-slate-400"}>
                                        {verdict.ok ? "" : "ausgeschlossen: "}
                                        {ARCHETYPE_LABELS[verdict.archetype]}
                                    </span>
                                    {verdict.reason && (
                                        <span className="text-slate-400"> — {verdict.reason}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {archetype && activeStructure ? (
                    <div className="space-y-3">
                        <DiagramResult
                            originalText={paragraph}
                            structure={activeStructure}
                            archetype={archetype}
                            presentation={presentation}
                            onPresentationChange={setPresentation}
                            rejectedArchetypes={[]}
                            onRejectArchetype={() => undefined}
                            onBackToChooser={() => setArchetype(null)}
                            onStructure={setStructure}
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        {source === "ai" && !structure ? (
                            <p className="py-12 text-center text-sm text-slate-400">
                                Absatz einfuegen und Ideen herauslesen, dann erscheint die Formwahl.
                            </p>
                        ) : (
                            <VariantChooser
                                originalText={source === "ai" ? paragraph : mockKey}
                                structure={activeStructure}
                                presentation={presentation}
                                onStructure={(next) => setStructure(next)}
                                onPick={setArchetype}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
