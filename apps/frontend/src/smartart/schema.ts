import { z } from "zod";

/**
 * Mirrors the backend's SmartArt zod schema (apps/backend/src/routes/ai.ts) so
 * `experimental_useObject` can validate/parse the streamed AI response on the client.
 */
export const SmartArtNodeSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    content: z.string().min(1),
    parentId: z.string().nullable().optional(),
});

export const SmartArtArchetypeSchema = z.enum([
    "process",
    "cycle",
    "hierarchy",
    "pyramid",
    "matrix",
    "comparison",
]);

/**
 * The model returns nodes and nothing else. The archetype is not part of the
 * response any more: the text does not have one single best shape, so letting
 * the model pick one would mean hiding the choice from the user. The shape is
 * picked in the UI, from the archetypes that `archetypeFit` allows for these
 * nodes. See apps/frontend/src/smartart/archetypeFit.ts.
 */
export const SmartArtStructureSchema = z.object({
    nodes: z.array(SmartArtNodeSchema).min(3),
});

export type GeneratedSmartArtStructure = z.infer<typeof SmartArtStructureSchema>;

/**
 * Streaming responses are deeply partial (fields may be undefined mid-stream).
 * Returns a fully-typed node set only once every node has a non-empty id, title
 * and content, so the renderer never receives incomplete data.
 */
export function parseCompleteSmartArtStructure(value: unknown): GeneratedSmartArtStructure | null {
    const result = SmartArtStructureSchema.safeParse(value);
    return result.success ? result.data : null;
}
