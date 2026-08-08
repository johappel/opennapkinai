import type { SmartArtNode, LayoutResult, LayoutNode } from "../types";
import { measureBlock } from "../measureText";

const COL_WIDTH = 230;
const ROW_HEIGHT = 110;
const ROW_GAP = 18;
const GAP_X = 90;

/** Two opposing columns (even-index nodes left, odd-index nodes right) around a shared divider. */
export function layoutComparison(nodes: SmartArtNode[]): LayoutResult {
    const left = nodes.filter((_, i) => i % 2 === 0);
    const right = nodes.filter((_, i) => i % 2 === 1);
    const rows = Math.max(left.length, right.length);

    const layoutNodes: LayoutNode[] = [];

    left.forEach((node, i) => {
        const block = measureBlock(node.title, node.content, COL_WIDTH - 32);
        layoutNodes.push({
            id: node.id,
            x: 0,
            y: i * (ROW_HEIGHT + ROW_GAP),
            width: COL_WIDTH,
            height: ROW_HEIGHT,
            shape: "rect",
            colorIndex: i * 2,
            node,
            titleLines: block.titleLines,
            contentLines: block.contentLines,
            titleLineHeight: block.titleLineHeight,
            contentLineHeight: block.contentLineHeight,
        });
    });

    right.forEach((node, i) => {
        const block = measureBlock(node.title, node.content, COL_WIDTH - 32);
        layoutNodes.push({
            id: node.id,
            x: COL_WIDTH + GAP_X,
            y: i * (ROW_HEIGHT + ROW_GAP),
            width: COL_WIDTH,
            height: ROW_HEIGHT,
            shape: "rect",
            colorIndex: i * 2 + 1,
            node,
            titleLines: block.titleLines,
            contentLines: block.contentLines,
            titleLineHeight: block.titleLineHeight,
            contentLineHeight: block.contentLineHeight,
        });
    });

    return {
        nodes: layoutNodes,
        connectors: [],
        width: COL_WIDTH * 2 + GAP_X,
        height: rows * (ROW_HEIGHT + ROW_GAP) - ROW_GAP,
    };
}
