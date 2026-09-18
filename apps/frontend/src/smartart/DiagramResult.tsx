import { useState } from "react";
import { ChevronDown, Download, Image as ImageIcon, Lightbulb, LucideProps, Palette, RefreshCw, Settings } from "lucide-react";
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";

import type { Archetype, SmartArtStructure } from "../smartart/types";
import { archetypeFit, ARCHETYPE_LABELS } from "../smartart/archetypeFit";
import {
    DEFAULT_PRESENTATION,
    ROUGH_STYLES,
    sanitizePresentation,
    THEME_NAMES,
    type Presentation,
} from "../smartart/presentation";
import SmartArtCanvas from "../smartart/SmartArtCanvas";
import { downloadSmartArtAsSvg, downloadSmartArtAsPng } from "../smartart/download";

type Props = {
    originalText: string;
    structure: SmartArtStructure | null;
    archetype: Archetype;
    presentation?: Presentation;
    onPresentationChange: (presentation: Presentation) => void;
    rejectedArchetypes: Archetype[];
    onRejectArchetype: (archetype: Archetype) => void;
    onBackToChooser: () => void;
    onStructure: (structure: SmartArtStructure) => void;
};

/**
 * The result step: the diagram itself plus the controls that are honestly
 * limited to how it looks. Theme, sketch style and export never change what
 * the diagram says, which is why they share this one place.
 */
export default function DiagramResult({
    structure,
    archetype,
    presentation,
    onPresentationChange,
    onBackToChooser,
}: Props) {
    const [current, setCurrent] = useState<Presentation>(() => ({
        ...DEFAULT_PRESENTATION,
        ...sanitizePresentation(presentation),
    }));
    const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);

    const update = (patch: Partial<Presentation>) => {
        setCurrent((previous) => {
            const next = { ...previous, ...patch };
            onPresentationChange(next);
            return next;
        });
    };

    const verdict = structure
        ? archetypeFit(structure.nodes).find((entry) => entry.archetype === archetype) ?? null
        : null;

    if (!structure || !verdict?.ok) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-amber-700">
                    {verdict?.reason ?? "Es liegen keine Ideen vor, aus denen sich das Diagramm bauen liesse."}
                </p>
                <button
                    type="button"
                    onClick={onBackToChooser}
                    className="mt-3 flex items-center gap-2 text-xs text-slate-500 underline decoration-dotted hover:text-slate-700"
                >
                    <RefreshCw className="h-3 w-3" />
                    Zurueck zur Formwahl
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                    <Settings className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-800">
                    {ARCHETYPE_LABELS[archetype]}
                </h2>
                <span className="ml-auto text-xs text-slate-500">{structure.nodes.length} Ideen</span>
            </div>

            <div className="space-y-4 p-5">
                {verdict.advisory && (
                    <p className="flex items-start gap-2 text-xs text-amber-700">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {verdict.reason}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <SelectWrapper icon={Palette} label="Farbschema">
                        <select
                            value={current.theme}
                            onChange={(event) => update({ theme: event.target.value as Presentation["theme"] })}
                            className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-slate-700 outline-none"
                        >
                            {THEME_NAMES.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </SelectWrapper>

                    <CheckboxWrapper label="Skizzenstil">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={current.isRough}
                                onChange={(event) => update({ isRough: event.target.checked })}
                                className="sr-only"
                            />
                            <div
                                className={`h-6 w-11 rounded-full transition-colors duration-200 ${
                                    current.isRough ? "bg-blue-500" : "bg-slate-200"
                                }`}
                            >
                                <div
                                    className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                        current.isRough ? "translate-x-5" : "translate-x-0.5"
                                    }`}
                                />
                            </div>
                        </div>
                    </CheckboxWrapper>

                    <SelectWrapper icon={Settings} label="Muster">
                        <select
                            value={current.roughStyle}
                            onChange={(event) =>
                                update({ roughStyle: event.target.value as Presentation["roughStyle"] })
                            }
                            className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-slate-700 outline-none disabled:opacity-50"
                            disabled={!current.isRough}
                        >
                            {ROUGH_STYLES.map((style) => (
                                <option key={style} value={style}>
                                    {style}
                                </option>
                            ))}
                        </select>
                    </SelectWrapper>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => svgElement && downloadSmartArtAsSvg(svgElement, "smartart.svg")}
                            className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                        >
                            <Download className="h-4 w-4" />
                            SVG
                        </button>
                        <button
                            type="button"
                            onClick={() => svgElement && downloadSmartArtAsPng(svgElement, "smartart.png")}
                            className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                        >
                            <ImageIcon className="h-4 w-4" />
                            PNG
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onBackToChooser}
                    className="flex items-center gap-2 text-xs text-slate-500 underline decoration-dotted hover:text-slate-700"
                >
                    <RefreshCw className="h-3 w-3" />
                    Andere Form waehlen
                </button>

                <div className="flex min-h-[320px] items-center justify-center overflow-auto border-t border-slate-200 pt-5">
                    <SmartArtCanvas
                        ref={setSvgElement}
                        structure={{ archetype, nodes: structure.nodes }}
                        theme={current.theme}
                        isRough={current.isRough}
                        roughStyle={current.roughStyle}
                    />
                </div>
            </div>
        </div>
    );
}

const SelectWrapper = ({
    children,
    icon: Icon,
    label,
}: {
    children: ReactNode;
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    label: string;
}) => (
    <div className="group relative">
        <div className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            {Icon && <Icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-blue-500" />}
            <div className="relative flex-1">
                {children}
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
            </div>
        </div>
        {label && (
            <span className="absolute -top-2 left-2 bg-white px-1 text-xs font-medium text-slate-600">{label}</span>
        )}
    </div>
);

const CheckboxWrapper = ({ children, label }: { children: ReactNode; label: string }) => (
    <div className="relative">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <label className="flex cursor-pointer items-center space-x-3">
                {children}
                <span className="select-none text-sm font-medium text-slate-700">{label}</span>
            </label>
        </div>
    </div>
);
