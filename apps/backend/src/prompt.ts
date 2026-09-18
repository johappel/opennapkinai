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
    parentId?: string | null;
};

export const ARCHETYPES: Archetype[] = [
    "process",
    "cycle",
    "hierarchy",
    "pyramid",
    "matrix",
    "comparison",
];

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
    process: "Prozess",
    cycle: "Kreislauf",
    hierarchy: "Hierarchie",
    pyramid: "Pyramide",
    matrix: "Matrix",
    comparison: "Vergleich",
};

/**
 * Single source of truth for what each archetype means. The backend system
 * prompt is generated from this (see apps/backend/src/prompt.ts), and the UI
 * uses the hint text when it explains why a shape was withheld.
 */
export const ARCHETYPE_SPECS: Array<{
    archetype: Archetype;
    definition: string;
    nodeHint: string;
}> = [
    {
        archetype: "process",
        definition:
            "a linear sequence of steps with a clear start and end, e.g. a workflow or a set of ordered phases",
        nodeHint: "Use 3-6 nodes.",
    },
    {
        archetype: "cycle",
        definition:
            "a repeating process with no fixed end, e.g. a lifecycle or a feedback loop",
        nodeHint: "Use 3-8 nodes.",
    },
    {
        archetype: "hierarchy",
        definition:
            "a tree of parent-child relationships, e.g. an org chart or a taxonomy. Give exactly one root with parentId null and make every other parentId reference an existing id",
        nodeHint: "Use 3-9 nodes.",
    },
    {
        archetype: "pyramid",
        definition:
            "layers ordered by priority or foundation, from base to top, e.g. a maturity model",
        nodeHint: "Use 3-5 nodes, ordered from base to top.",
    },
    {
        archetype: "matrix",
        definition:
            "a grid of independent categories with no inherent order, e.g. a 2x2 prioritisation grid",
        nodeHint: "Use 4 nodes ideally, up to 9 for larger grids.",
    },
    {
        archetype: "comparison",
        definition:
            "two contrasting sides placed next to each other, e.g. option A against option B",
        nodeHint:
            "Use an even number of nodes, 4 or 6, ordered so that the two sides alternate: first node left, second node right, and so on.",
    },
];

/**
 * Prompt for the node extraction call. The model summarises the text into
 * nodes and returns parentId hints where the text implies a tree, but it does
 * not choose the diagram shape.
 */
export const SMARTART_NODES_SYSTEM_PROMPT = `# System Prompt: Text to Diagram Nodes

## Role
You are an information designer. You break a piece of text into the distinct ideas it actually contains, so a diagram can be built from them. You do not decide what the diagram looks like: the shape is chosen afterwards, by a person, from the shapes these nodes fit.

## Rules
1. Read the text and identify its distinct ideas. Between 3 and 9. If the text holds fewer than 3 separate ideas, still return 3 by splitting the strongest idea into its parts. Never pad with filler.
2. Each node needs:
   - a short unique "id", e.g. "n1"
   - a concise "title", 2 to 5 words, in the language of the text
   - "content", one sentence of support, in the language of the text
3. "parentId" is optional and only useful when the text really describes containment or reporting lines. When it does, set one node to null as the root and let the others reference its id. Otherwise omit parentId entirely.
4. Preserve the order the text implies. Step order for a sequence, base to top for layers, alternating sides for a contrast, and so on.
5. Every node must be traceable to the text. Do not invent claims, numbers or names that are not in it.`;
