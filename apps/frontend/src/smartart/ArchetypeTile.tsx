import { useEffect, useRef } from "react";
import rough from "roughjs";
import type { Archetype, RoughStyle } from "./types";
import COLORS from "../data/colors";

export type TileSpec = {
    /** Fixed size the tile is drawn at, regardless of the user's later settings. */
    width: number;
    height: number;
    /** Flat fill colours, one per element in the order given. */
    fills: string[];
};

export type TilePalette = {
    box: string;
    line: string;
    text: string;
    muted: string;
    accent: string;
};

export const TILE_SPECS: Record<Archetype, TileSpec> = {
    process: { width: 208, height: 60, fills: ["#8a5702", "#f15f47", "#345433"] },
    cycle: { width: 208, height: 60, fills: ["#1c9eb8", "#8a5702", "#345433"] },
    hierarchy: { width: 208, height: 60, fills: ["#345433", "#1c9eb8", "#f15f47", "#8a5702"] },
    pyramid: { width: 208, height: 60, fills: ["#345433", "#1c9eb8", "#8a5702", "#f15f47"] },
    matrix: { width: 208, height: 60, fills: ["#f15f47", "#8a5702", "#1c9eb8", "#345433"] },
    comparison: { width: 208, height: 60, fills: ["#8a5702", "#1c9eb8", "#8a5702", "#1c9eb8"] },
};

type Props = {
    archetype: Archetype;
    palette: TilePalette;
    isRough: boolean;
    roughStyle: RoughStyle;
    title: string;
    selected: boolean;
    onSelect: () => void;
};

/**
 * A schematic preview of one archetype at a fixed size. It shows the shape of
 * the diagram, not the user's content: the point is the form, and keeping it
 * abstract avoids three lines of truncated text per tile. The real content is
 * drawn once the variant is picked.
 *
 * Fills are flat colours rather than the theme palette, so the tiles stay
 * readable in both light and dark surroundings and do not change retroactively
 * when the user switches theme.
 */
export default function ArchetypeTile({
    archetype,
    palette,
    isRough,
    roughStyle,
    title,
    selected,
    onSelect,
}: Props) {
    const spec = TILE_SPECS[archetype];
    const roughRef = useRef<SVGGElement>(null);

    useEffect(() => {
        if (!roughRef.current) return;
        roughRef.current.innerHTML = "";
        if (!isRough) return;

        const svg = roughRef.current.ownerSVGElement;
        if (!svg) return;

        const rc = rough.svg(svg);
        const group = roughRef.current;
        const base = {
            stroke: palette.box,
            strokeWidth: 1,
            roughness: 1.4,
            fillStyle: roughStyle,
        };

        const add = (element: SVGElement | null) => {
            if (element) group.appendChild(element);
        };

        switch (archetype) {
            case "process":
                [0, 1, 2].forEach((index) => {
                    add(rc.rectangle(8 + index * 70, 20, 52, 20, { ...base, fill: spec.fills[index] }));
                });
                break;
            case "cycle":
                [0, 1, 2].forEach((index) => {
                    const angle = (index / 3) * Math.PI * 2 - Math.PI / 2;
                    add(
                        rc.circle(
                            104 + 20 * Math.cos(angle),
                            30 + 20 * Math.sin(angle),
                            24,
                            { ...base, fill: spec.fills[index] },
                        ),
                    );
                });
                break;
            case "hierarchy":
                add(rc.rectangle(92, 6, 24, 16, { ...base, fill: spec.fills[0] }));
                [0, 1, 2].forEach((index) => {
                    add(
                        rc.rectangle(40 + index * 48, 40, 24, 16, {
                            ...base,
                            fill: spec.fills[(index + 1) % spec.fills.length],
                        }),
                    );
                });
                break;
            case "pyramid":
                [0, 1, 2, 3].forEach((index) => {
                    const inset = 22 - index * 6;
                    add(
                        rc.polygon(
                            [
                                [104 - inset, 12 + index * 12],
                                [104 + inset, 12 + index * 12],
                                [104 + inset + 6, 24 + index * 12],
                                [104 - inset - 6, 24 + index * 12],
                            ],
                            { ...base, fill: spec.fills[index] },
                        ),
                    );
                });
                break;
            case "matrix":
                [0, 1, 2, 3].forEach((index) => {
                    add(
                        rc.rectangle(
                            38 + (index % 2) * 66,
                            6 + Math.floor(index / 2) * 26,
                            60,
                            22,
                            { ...base, fill: spec.fills[index] },
                        ),
                    );
                });
                break;
            case "comparison":
                [0, 1, 2, 3].forEach((index) => {
                    add(
                        rc.rectangle(
                            index % 2 === 0 ? 24 : 110,
                            4 + Math.floor(index / 2) * 26,
                            74,
                            22,
                            { ...base, fill: spec.fills[index] },
                        ),
                    );
                });
                break;
        }
    }, [archetype, isRough, roughStyle, palette.box, spec.fills]);

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`flex flex-col items-stretch rounded-xl border p-3 text-left transition-colors ${
                selected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
            }`}
        >
            <svg
                viewBox={`0 0 ${spec.width} ${spec.height}`}
                width="100%"
                height={72}
                role="img"
                aria-label={title}
            >
                <g ref={roughRef} />
                {!isRough && <FlatTile archetype={archetype} spec={spec} palette={palette} />}
            </svg>
            <span className="mt-2 text-sm font-medium text-slate-700">{title}</span>
        </button>
    );
}

function FlatTile({
    archetype,
    spec,
    palette,
}: {
    archetype: Archetype;
    spec: TileSpec;
    palette: TilePalette;
}) {
    const stroke = palette.line;

    switch (archetype) {
        case "process":
            return (
                <>
                    {[0, 1, 2].map((index) => (
                        <rect
                            key={index}
                            x={8 + index * 70}
                            y={20}
                            width={52}
                            height={20}
                            rx={5}
                            fill={spec.fills[index]}
                        />
                    ))}
                    <path d="M60 30 L78 30" fill="none" stroke={stroke} strokeWidth={1.5} />
                    <path d="M130 30 L148 30" fill="none" stroke={stroke} strokeWidth={1.5} />
                </>
            );
        case "cycle":
            return (
                <>
                    <circle cx={104} cy={30} r={16} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="3 3" />
                    {[0, 1, 2].map((index) => {
                        const angle = (index / 3) * Math.PI * 2 - Math.PI / 2;
                        return (
                            <circle
                                key={index}
                                cx={104 + 20 * Math.cos(angle)}
                                cy={30 + 20 * Math.sin(angle)}
                                r={12}
                                fill={spec.fills[index]}
                            />
                        );
                    })}
                </>
            );
        case "hierarchy":
            return (
                <>
                    <path d="M104 22 L104 32 M56 40 L152 40 M56 40 L56 42 M104 32 L104 42 M152 40 L152 42" fill="none" stroke={stroke} strokeWidth={1} />
                    <rect x={92} y={6} width={24} height={16} rx={4} fill={spec.fills[0]} />
                    {[0, 1, 2].map((index) => (
                        <rect
                            key={index}
                            x={40 + index * 48}
                            y={40}
                            width={24}
                            height={16}
                            rx={4}
                            fill={spec.fills[(index + 1) % spec.fills.length]}
                        />
                    ))}
                </>
            );
        case "pyramid":
            return (
                <>
                    {[0, 1, 2, 3].map((index) => {
                        const inset = 22 - index * 6;
                        return (
                            <polygon
                                key={index}
                                points={`${104 - inset},${12 + index * 12} ${104 + inset},${12 + index * 12} ${104 + inset + 6},${24 + index * 12} ${104 - inset - 6},${24 + index * 12}`}
                                fill={spec.fills[index]}
                            />
                        );
                    })}
                </>
            );
        case "matrix":
            return (
                <>
                    {[0, 1, 2, 3].map((index) => (
                        <rect
                            key={index}
                            x={38 + (index % 2) * 66}
                            y={6 + Math.floor(index / 2) * 26}
                            width={60}
                            height={22}
                            rx={4}
                            fill={spec.fills[index]}
                        />
                    ))}
                </>
            );
        case "comparison":
            return (
                <>
                    <path d="M104 4 L104 56" fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="4 3" />
                    {[0, 1, 2, 3].map((index) => (
                        <rect
                            key={index}
                            x={index % 2 === 0 ? 24 : 110}
                            y={4 + Math.floor(index / 2) * 26}
                            width={74}
                            height={22}
                            rx={4}
                            fill={spec.fills[index]}
                        />
                    ))}
                </>
            );
        default:
            return null;
    }
}

export function defaultTilePalette(theme: keyof typeof COLORS): TilePalette {
    const palette = COLORS[theme];
    return {
        box: palette[4 % palette.length],
        line: palette[8 % palette.length],
        text: "#1e293b",
        muted: "#64748b",
        accent: palette[1 % palette.length],
    };
}

