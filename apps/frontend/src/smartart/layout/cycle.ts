import type { SmartArtNode, LayoutResult, LayoutNode, LayoutConnector } from "../types";
import { measureBlock } from "../measureText";

const PADDING = 40;

/** Nodes placed evenly around a circle; radius scales with node count so it never looks cramped. */
export function layoutCycle(nodes: SmartArtNode[]): LayoutResult {
    const n = nodes.length;
    const blocks = nodes.map((node) => measureBlock(node.title, node.content, 130, 3));
    const nodeSize = Math.max(...blocks.map((b) => b.height), 130);
    const radius = Math.max(150, n * 42);
    const center = radius + nodeSize / 2 + PADDING;
    const size = center * 2;

    const layoutNodes: LayoutNode[] = nodes.map((node, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const cx = center + radius * Math.cos(angle);
        const cy = center + radius * Math.sin(angle);
        const block = blocks[i];
        return {
            id: node.id,
            x: cx - nodeSize / 2,
            y: cy - nodeSize / 2,
            width: nodeSize,
            height: nodeSize,
            shape: "circle",
            colorIndex: i,
            node,
            titleLines: block.titleLines,
            contentLines: block.contentLines,
            titleLineHeight: block.titleLineHeight,
            contentLineHeight: block.contentLineHeight,
        };
    });

    const connectors: LayoutConnector[] = nodes.map((_, i) => {
        const from = layoutNodes[i];
        const to = layoutNodes[(i + 1) % n];
        const fromCx = from.x + from.width / 2;
        const fromCy = from.y + from.height / 2;
        const toCx = to.x + to.width / 2;
        const toCy = to.y + to.height / 2;
        const midX = (fromCx + toCx) / 2;
        const midY = (fromCy + toCy) / 2;
        const dx = midX - center;
        const dy = midY - center;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const bow = 26;
        const ctrlX = midX + (dx / dist) * bow;
        const ctrlY = midY + (dy / dist) * bow;
        return {
            id: `c-${i}`,
            d: `M ${fromCx} ${fromCy} Q ${ctrlX} ${ctrlY} ${toCx} ${toCy}`,
            colorIndex: i,
        };
    });

    return { nodes: layoutNodes, connectors, width: size, height: size };
}
