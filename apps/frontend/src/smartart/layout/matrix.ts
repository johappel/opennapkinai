import type { SmartArtNode, LayoutResult, LayoutNode } from "../types";
import { measureBlock } from "../measureText";

const CELL_WIDTH = 220;
const CELL_HEIGHT = 150;
const GAP = 18;

/** Auto-sized grid (rows/cols derived from node count) — e.g. 4 nodes -> 2x2, 6 -> 2x3. */
export function layoutMatrix(nodes: SmartArtNode[]): LayoutResult {
    const n = nodes.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);

    const layoutNodes: LayoutNode[] = nodes.map((node, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const block = measureBlock(node.title, node.content, CELL_WIDTH - 32);
        return {
            id: node.id,
            x: col * (CELL_WIDTH + GAP),
            y: row * (CELL_HEIGHT + GAP),
            width: CELL_WIDTH,
            height: CELL_HEIGHT,
            shape: "rect",
            colorIndex: i,
            node,
            titleLines: block.titleLines,
            contentLines: block.contentLines,
            titleLineHeight: block.titleLineHeight,
            contentLineHeight: block.contentLineHeight,
        };
    });

    return {
        nodes: layoutNodes,
        connectors: [],
        width: cols * (CELL_WIDTH + GAP) - GAP,
        height: rows * (CELL_HEIGHT + GAP) - GAP,
    };
}
