import type { SmartArtNode, LayoutResult, LayoutNode, LayoutConnector } from "../types";
import { measureBlock } from "../measureText";

const LEVEL_HEIGHT = 92;
const MIN_WIDTH = 170;
const MAX_WIDTH = 560;
const GAP = 10;

/** Stacked trapezoids narrowing toward the top (or bottom for the last item). */
export function layoutPyramid(nodes: SmartArtNode[]): LayoutResult {
    const n = nodes.length;
    const layoutNodes: LayoutNode[] = [];

    nodes.forEach((node, i) => {
        const ratio = (i + 1) / n;
        const width = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * ratio;
        const x = (MAX_WIDTH - width) / 2;
        const y = i * (LEVEL_HEIGHT + GAP);
        const block = measureBlock(node.title, node.content, width - 40, 2);
        layoutNodes.push({
            id: node.id,
            x,
            y,
            width,
            height: LEVEL_HEIGHT,
            shape: "trapezoid",
            colorIndex: i,
            node,
            titleLines: block.titleLines,
            contentLines: block.contentLines,
            titleLineHeight: block.titleLineHeight,
            contentLineHeight: block.contentLineHeight,
        });
    });

    const connectors: LayoutConnector[] = [];

    return {
        nodes: layoutNodes,
        connectors,
        width: MAX_WIDTH,
        height: n * (LEVEL_HEIGHT + GAP) - GAP,
    };
}
