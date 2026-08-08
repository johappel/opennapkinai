import type { SmartArtNode, LayoutResult, LayoutNode, LayoutConnector } from "../types";
import { measureBlock } from "../measureText";

const NODE_WIDTH = 190;
const GAP = 56;
const PADDING = 40;

/** Linear left-to-right flow: rounded boxes joined by arrows. Width grows with node count. */
export function layoutProcess(nodes: SmartArtNode[]): LayoutResult {
    const blocks = nodes.map((n) => measureBlock(n.title, n.content, NODE_WIDTH - 28));
    const nodeHeight = Math.max(...blocks.map((b) => b.height), 110);

    const layoutNodes: LayoutNode[] = [];
    const connectors: LayoutConnector[] = [];
    let x = PADDING;

    nodes.forEach((node, i) => {
        const block = blocks[i];
        layoutNodes.push({
            id: node.id,
            x,
            y: PADDING,
            width: NODE_WIDTH,
            height: nodeHeight,
            shape: "rect",
            colorIndex: i,
            node,
            titleLines: block.titleLines,
            contentLines: block.contentLines,
            titleLineHeight: block.titleLineHeight,
            contentLineHeight: block.contentLineHeight,
        });

        if (i > 0) {
            const midY = PADDING + nodeHeight / 2;
            const fromX = x - GAP;
            connectors.push({
                id: `c-${i}`,
                d: `M ${fromX} ${midY} L ${x} ${midY}`,
                colorIndex: i,
            });
        }

        x += NODE_WIDTH + GAP;
    });

    return {
        nodes: layoutNodes,
        connectors,
        width: x - GAP + PADDING,
        height: nodeHeight + PADDING * 2,
    };
}
