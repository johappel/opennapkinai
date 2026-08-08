import { forwardRef, useMemo } from "react";
import type { SmartArtStructure, RoughStyle } from "./types";
import { computeLayout } from "./layout";
import SmartArtNodeView from "./SmartArtNode";
import SmartArtConnectorView from "./SmartArtConnector";
import COLORS from "../data/colors";

type Props = {
    structure: SmartArtStructure;
    theme?: keyof typeof COLORS;
    isRough?: boolean;
    roughStyle?: RoughStyle;
    width?: number | string;
};

/** Top-level SmartArt renderer: computes a procedural layout for the structure's archetype and renders it as SVG. */
const SmartArtCanvas = forwardRef<SVGSVGElement, Props>(function SmartArtCanvas(
    { structure, theme = "default", isRough = false, roughStyle = "hachure", width },
    ref,
) {
    const layout = useMemo(() => computeLayout(structure.archetype, structure.nodes), [structure]);
    const padding = 20;
    const viewBox = `${-padding} ${-padding} ${layout.width + padding * 2} ${layout.height + padding * 2}`;
    const arrowColor = COLORS[theme][4 % COLORS[theme].length];

    return (
        <svg
            ref={ref}
            viewBox={viewBox}
            width={width ?? "100%"}
            style={{ maxWidth: layout.width }}
            fill="none"
            stroke="none"
        >
            <defs>
                <marker
                    id="smartart-arrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <path d="M0,0 L8,4 L0,8 Z" fill={arrowColor} />
                </marker>
            </defs>

            {layout.connectors.map((connector) => (
                <SmartArtConnectorView key={connector.id} connector={connector} theme={theme} />
            ))}
            {layout.nodes.map((layoutNode) => (
                <SmartArtNodeView
                    key={layoutNode.id}
                    layoutNode={layoutNode}
                    theme={theme}
                    isRough={isRough}
                    roughStyle={roughStyle}
                    svgRef={ref as React.RefObject<SVGSVGElement | null>}
                />
            ))}
        </svg>
    );
});

export default SmartArtCanvas;
