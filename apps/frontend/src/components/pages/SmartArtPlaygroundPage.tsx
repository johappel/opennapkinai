import { useRef, useState } from "react";
import { Download, Image as ImageIcon, Loader2, Sparkles, Wand2 } from "lucide-react";
import { experimental_useObject } from "@ai-sdk/react";
import SmartArtCanvas from "../../smartart/SmartArtCanvas";
import { MOCK_STRUCTURES, type MockStructureKey } from "../../smartart/mockData";
import { downloadSmartArtAsPng, downloadSmartArtAsSvg } from "../../smartart/download";
import { parseCompleteSmartArtStructure, SmartArtStructureSchema } from "../../smartart/schema";
import COLORS from "../../data/colors";
import type { RoughStyle } from "../../smartart/types";

const STRUCTURE_KEYS = Object.keys(MOCK_STRUCTURES) as MockStructureKey[];
const SMARTART_API_URL = "http://localhost:3001/api/ai/smartart";

type DataSource = "mock" | "ai";

/** Playground page for the generative SmartArt renderer - supports mock data and live AI generation. */
export function SmartArtPlaygroundPage() {
    const [dataSource, setDataSource] = useState<DataSource>("mock");
    const [structureKey, setStructureKey] = useState<MockStructureKey>(STRUCTURE_KEYS[0]);
    const [paragraph, setParagraph] = useState("");
    const [theme, setTheme] = useState<keyof typeof COLORS>("default");
    const [isRough, setIsRough] = useState(false);
    const [roughStyle, setRoughStyle] = useState<RoughStyle>("hachure");
    const svgRef = useRef<SVGSVGElement | null>(null);

    const { object, submit, isLoading, error } = experimental_useObject({
        api: SMARTART_API_URL,
        schema: SmartArtStructureSchema,
    });

    const aiStructure = parseCompleteSmartArtStructure(object);
    const structure = dataSource === "ai" ? aiStructure : MOCK_STRUCTURES[structureKey];

    const handleGenerate = () => {
        if (!paragraph.trim() || isLoading) return;
        submit({ context: paragraph.trim() });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-6 h-6 text-blue-500" />
                    <h1 className="text-2xl font-bold text-slate-800">SmartArt Playground</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setDataSource("mock")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dataSource === "mock" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            Mock data
                        </button>
                        <button
                            type="button"
                            onClick={() => setDataSource("ai")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dataSource === "ai" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            Generate with AI
                        </button>
                    </div>

                    {dataSource === "ai" && (
                        <div className="mb-4">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                                Paragraph
                                <textarea
                                    value={paragraph}
                                    onChange={(e) => setParagraph(e.target.value)}
                                    rows={4}
                                    placeholder="Paste a paragraph and the AI will pick the best diagram archetype and nodes for it..."
                                    className="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y"
                                />
                            </label>
                            <div className="flex items-center gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={!paragraph.trim() || isLoading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                    {isLoading ? "Generating..." : "Generate diagram"}
                                </button>
                                {error && (
                                    <span className="text-sm text-red-600">
                                        Failed to generate diagram. Please try again.
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                        {dataSource === "mock" && (
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                                Structure
                                <select
                                    value={structureKey}
                                    onChange={(e) => setStructureKey(e.target.value as MockStructureKey)}
                                    className="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    {STRUCTURE_KEYS.map((key) => (
                                        <option key={key} value={key}>
                                            {key} — {MOCK_STRUCTURES[key].archetype} ({MOCK_STRUCTURES[key].nodes.length} nodes)
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <label className="flex flex-col text-sm font-medium text-slate-700">
                            Theme
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value as keyof typeof COLORS)}
                                className="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            >
                                {Object.keys(COLORS).map((color) => (
                                    <option key={color} value={color}>
                                        {color.charAt(0).toUpperCase() + color.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mt-5">
                            <input type="checkbox" checked={isRough} onChange={(e) => setIsRough(e.target.checked)} />
                            Rough style
                        </label>

                        <label className="flex flex-col text-sm font-medium text-slate-700">
                            Rough pattern
                            <select
                                value={roughStyle}
                                onChange={(e) => setRoughStyle(e.target.value as RoughStyle)}
                                disabled={!isRough}
                                className="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                            >
                                <option value="hachure">Hachure</option>
                                <option value="solid">Solid</option>
                                <option value="zigzag">Zigzag</option>
                                <option value="cross-hatch">Cross Hatch</option>
                                <option value="dots">Dots</option>
                                <option value="dashed">Dashed</option>
                                <option value="zigzag-line">Zigzag Line</option>
                            </select>
                        </label>

                        <div className="flex gap-2 mt-5">
                            <button
                                type="button"
                                disabled={!structure}
                                onClick={() => svgRef.current && downloadSmartArtAsSvg(svgRef.current, `${dataSource === "ai" ? "smartart" : structureKey}.svg`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                SVG
                            </button>
                            <button
                                type="button"
                                disabled={!structure}
                                onClick={() => svgRef.current && downloadSmartArtAsPng(svgRef.current, `${dataSource === "ai" ? "smartart" : structureKey}.png`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ImageIcon className="w-4 h-4" />
                                PNG
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-auto flex items-center justify-center min-h-[60vh]">
                    {structure ? (
                        <SmartArtCanvas
                            ref={svgRef}
                            structure={structure}
                            theme={theme}
                            isRough={isRough}
                            roughStyle={roughStyle}
                        />
                    ) : dataSource === "ai" && isLoading ? (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-sm">Generating diagram from your paragraph...</span>
                        </div>
                    ) : (
                        <span className="text-sm text-slate-400">
                            Enter a paragraph above and click "Generate diagram" to see the result.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

