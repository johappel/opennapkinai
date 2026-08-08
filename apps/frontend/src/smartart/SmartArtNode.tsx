import { useEffect, useRef } from "react";
import rough from "roughjs";
import type { LayoutNode, RoughStyle } from "./types";
import COLORS from "../data/colors";

type Props = {
    layoutNode: LayoutNode;
    theme: keyof typeof COLORS;
    isRough: boolean;
    roughStyle: RoughStyle;
    svgRef: React.RefObject<SVGSVGElement | null>;
};

/** Renders a single SmartArt node: a shape (rect / circle / trapezoid) plus wrapped title + content text. */
export default function SmartArtNode({ layoutNode, theme, isRough, roughStyle, svgRef }: Props) {
    const shapeGroupRef = useRef<SVGGElement>(null);
    const {
        x,
        y,
        width,
        height,
        shape,
        colorIndex,
        titleLines,
        contentLines,
        titleLineHeight,
        contentLineHeight,
    } = layoutNode;

    const palette = COLORS[theme];
    const color = palette[colorIndex % palette.length];

    useEffect(() => {
        if (!shapeGroupRef.current) return;
        shapeGroupRef.current.innerHTML = "";
        if (!isRough || !svgRef.current) return;
        const rc = rough.svg(svgRef.current);
        shapeGroupRef.current.innerHTML = "";

        let el: SVGElement | null = null;
        if (shape === "circle") {
            el = rc.circle(x + width / 2, y + height / 2, Math.min(width, height), {
                fill: color,
                stroke: color,
                fillStyle: roughStyle,
            });
        } else if (shape === "trapezoid") {
            const inset = width * 0.08;
            el = rc.polygon(
                [
                    [x + inset, y],
                    [x + width - inset, y],
                    [x + width, y + height],
                    [x, y + height],
                ],
                { fill: color, stroke: color, fillStyle: roughStyle },
            );
        } else {
            el = rc.rectangle(x, y, width, height, { fill: color, stroke: color, fillStyle: roughStyle });
        }
        if (el) shapeGroupRef.current.appendChild(el);
    }, [isRough, roughStyle, color, shape, x, y, width, height, svgRef]);

    const titleStartY = y + 22;
    const contentStartY = titleStartY + titleLines.length * titleLineHeight + 8;

    return (
        <g>
            <g ref={shapeGroupRef} />
            {!isRough && shape === "rect" && <rect x={x} y={y} width={width} height={height} rx={12} fill={color} />}
            {!isRough && shape === "circle" && (
                <circle cx={x + width / 2} cy={y + height / 2} r={Math.min(width, height) / 2} fill={color} />
            )}
            {!isRough && shape === "trapezoid" && (
                <polygon
                    points={`${x + width * 0.08},${y} ${x + width * 0.92},${y} ${x + width},${y + height} ${x},${y + height}`}
                    fill={color}
                />
            )}

            {titleLines.map((line, i) => (
                <text
                    key={`title-${i}`}
                    x={x + width / 2}
                    y={titleStartY + i * titleLineHeight}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={700}
                    fill="#ffffff"
                >
                    {line}
                </text>
            ))}
            {contentLines.map((line, i) => (
                <text
                    key={`content-${i}`}
                    x={x + width / 2}
                    y={contentStartY + i * contentLineHeight}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#ffffff"
                    opacity={0.9}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}
