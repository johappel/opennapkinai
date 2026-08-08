export type Archetype =
    | "process"
    | "cycle"
    | "hierarchy"
    | "pyramid"
    | "matrix"
    | "comparison";

export type SmartArtNode = {
    id: string;
    title: string;
    content: string;
    /** Only used by the "hierarchy" archetype. Root node must have parentId = null. */
    parentId?: string | null;
};

export type SmartArtStructure = {
    archetype: Archetype;
    nodes: SmartArtNode[];
};

export type NodeShape = "rect" | "circle" | "trapezoid";

export type RoughStyle =
    | "hachure"
    | "solid"
    | "zigzag"
    | "cross-hatch"
    | "dots"
    | "dashed"
    | "zigzag-line";

export type LayoutNode = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    shape: NodeShape;
    colorIndex: number;
    node: SmartArtNode;
    level?: number;
    titleLines: string[];
    contentLines: string[];
    titleLineHeight: number;
    contentLineHeight: number;
};

export type LayoutConnector = {
    id: string;
    d: string;
    colorIndex: number;
};

export type LayoutResult = {
    nodes: LayoutNode[];
    connectors: LayoutConnector[];
    width: number;
    height: number;
};
