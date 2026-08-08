import { stratify, tree, type HierarchyPointNode } from "d3-hierarchy";
import type { SmartArtNode, LayoutResult, LayoutNode, LayoutConnector } from "../types";
import { measureBlock } from "../measureText";

const NODE_WIDTH = 170;
const H_SPACING = 30;
const V_SPACING = 60;
const PADDING = 30;

/** Tree layout computed via d3-hierarchy; depth = vertical level, siblings spread horizontally. */
export function layoutHierarchy(nodes: SmartArtNode[]): LayoutResult {
    const blocks = nodes.map((n) => measureBlock(n.title, n.content, NODE_WIDTH - 28, 3));
    const nodeHeight = Math.max(...blocks.map((b) => b.height), 80);

    const root = stratify<SmartArtNode>()
        .id((d) => d.id)
        .parentId((d) => d.parentId ?? null)(nodes);

    const treeLayout = tree<SmartArtNode>().nodeSize([NODE_WIDTH + H_SPACING, nodeHeight + V_SPACING]);
    treeLayout(root);

    const descendants = root.descendants() as HierarchyPointNode<SmartArtNode>[];
    const minX = Math.min(...descendants.map((d) => d.x));

    const blockById = new Map(nodes.map((n, i) => [n.id, blocks[i]]));

    const layoutNodes: LayoutNode[] = descendants.map((d) => {
        const block = blockById.get(d.data.id)!;
        return {
            id: d.data.id,
            x: d.x - minX - NODE_WIDTH / 2 + PADDING,
            y: d.depth * (nodeHeight + V_SPACING) + PADDING,
            width: NODE_WIDTH,
            height: nodeHeight,
            shape: "rect",
            colorIndex: d.depth,
            node: d.data,
            level: d.depth,
            titleLines: block.titleLines,
            contentLines: block.contentLines,
            titleLineHeight: block.titleLineHeight,
            contentLineHeight: block.contentLineHeight,
        };
    });

    const nodeById = new Map(layoutNodes.map((n) => [n.id, n]));

    const connectors: LayoutConnector[] = root.links().map((link, i) => {
        const source = nodeById.get(link.source.data.id)!;
        const target = nodeById.get(link.target.data.id)!;
        const sx = source.x + source.width / 2;
        const sy = source.y + source.height;
        const tx = target.x + target.width / 2;
        const ty = target.y;
        const midY = (sy + ty) / 2;
        return {
            id: `c-${i}`,
            d: `M ${sx} ${sy} C ${sx} ${midY} ${tx} ${midY} ${tx} ${ty}`,
            colorIndex: target.colorIndex,
        };
    });

    const maxX = Math.max(...layoutNodes.map((n) => n.x + n.width));
    const maxY = Math.max(...layoutNodes.map((n) => n.y + n.height));

    return {
        nodes: layoutNodes,
        connectors,
        width: maxX + PADDING,
        height: maxY + PADDING,
    };
}
