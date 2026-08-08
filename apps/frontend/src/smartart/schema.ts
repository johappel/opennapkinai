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

export const SmartArtStructureSchema = z.object({
    archetype: SmartArtArchetypeSchema,
    nodes: z.array(SmartArtNodeSchema).min(1),
});

export type GeneratedSmartArtStructure = z.infer<typeof SmartArtStructureSchema>;

/**
 * Streaming responses are deeply partial (fields may be undefined mid-stream).
 * Returns a fully-typed structure only once every node has a non-empty id/title/content,
 * so the renderer never receives incomplete data.
 */
export function parseCompleteSmartArtStructure(value: unknown): GeneratedSmartArtStructure | null {
    const result = SmartArtStructureSchema.safeParse(value);
    return result.success ? result.data : null;
}
