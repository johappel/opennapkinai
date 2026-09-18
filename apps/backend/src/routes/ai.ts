import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

import { generateObject } from 'ai';
import { Router } from 'express';
import { z } from 'zod';

import { SMARTART_NODES_SYSTEM_PROMPT } from '../prompt.js';

export const BulletPointSchema = z.object({
    title: z.string()
        .min(3, "Title must be at least 3 characters")
        .max(50, "Title must not exceed 50 characters")
        .describe("Concise, descriptive title (3-6 words)"),
    content: z.string()
        .min(10, "Content must be at least 10 characters")
        .max(200, "Content must not exceed 200 characters")
        .describe("Brief content explanation (1-2 sentences maximum)")
});

export const BulletPointsResponseSchema = z.object({
    bulletPoints: z.array(BulletPointSchema)
        .length(4, "Must contain exactly 4 bullet points")
        .describe("Array of exactly 4 bullet points extracted from the paragraph")
});

export const SmartArtNodeSchema = z.object({
    id: z.string()
        .min(1, "id is required")
        .max(20, "id must not exceed 20 characters")
        .describe("Short unique id/slug for this node, e.g. 'n1' or 'discover'"),
    title: z.string()
        .min(2, "Title must be at least 2 characters")
        .max(40, "Title must not exceed 40 characters")
        .describe("Concise node title (2-5 words)"),
    content: z.string()
        .min(5, "Content must be at least 5 characters")
        .max(160, "Content must not exceed 160 characters")
        .describe("Brief supporting detail (one sentence)"),
    parentId: z.string()
        .nullable()
        .optional()
        .describe(
            "Only if the text describes containment or reporting lines: the id of this node's parent, with exactly one node set to null as the root. Otherwise omit it."
        )
});

/**
 * No `archetype` field any more, and that is the point of this schema.
 *
 * Until 18.09.2026 the model picked the diagram shape itself, and a text can
 * legitimately be drawn as a sequence, a cycle or a set of layers. Whoever
 * reads the result could not tell whether the shape was the only sensible one
 * or just the first the model happened to pick. So the response now carries
 * only the ideas, and the shape is chosen in the UI from the archetypes the
 * nodes actually support.
 */
export const SmartArtStructureSchema = z.object({
    nodes: z.array(SmartArtNodeSchema)
        .min(3, "Must contain at least 3 nodes")
        .max(9, "Must contain at most 9 nodes")
        .describe("3 to 9 nodes capturing the key ideas from the text, in the order the text implies")
});

export type SmartArtStructure = z.infer<typeof SmartArtStructureSchema>;


const router = Router();

const SYSTEM_PROMPT = `# System Prompt: Paragraph to PowerPoint Bullet Points Extractor

## Role
You are an expert content summarizer specializing in creating PowerPoint-ready bullet points from paragraphs. Your task is to extract exactly four key bullet points that capture the most important information from any given paragraph.

## Instructions
1. **Read and analyze** the input paragraph carefully
2. **Identify** the four most important concepts, facts, or ideas
3. **Create** exactly four bullet points, each with:
   - A concise, descriptive **title** (3-6 words)
   - Brief **content** explanation (1-2 sentences maximum)
4. **Ensure** bullet points are:
   - Logically ordered
   - Distinct and non-overlapping
   - PowerPoint presentation-ready
   - Audience-appropriate

## Output Format
Return your response as valid JSON in the following structure:

{
  "bulletPoints": [
    {
      "title": "Title 1",
      "content": "Content explanation here."
    },
    {
      "title": "Title 2", 
      "content": "Content explanation here."
    },
    {
      "title": "Title 3",
      "content": "Content explanation here."
    },
    {
      "title": "Title 4",
      "content": "Content explanation here."
    }
  ]
}


## Few-Shot Examples

### Example 1
**Input Paragraph:**
"Climate change is one of the most pressing global challenges of our time, driven primarily by human activities such as burning fossil fuels and deforestation. The effects are already visible through rising sea levels, more frequent extreme weather events, and shifting agricultural patterns. Scientists worldwide agree that immediate action is needed to reduce greenhouse gas emissions and transition to renewable energy sources. Additionally, adaptation strategies must be implemented to help communities cope with unavoidable climate impacts that are already set in motion."

**Output:**

{
  "bulletPoints": [
    {
      "title": "Human Activities Cause",
      "content": "Burning fossil fuels and deforestation are primary drivers of climate change."
    },
    {
      "title": "Visible Effects Today",
      "content": "Rising sea levels, extreme weather, and agricultural shifts are already occurring."
    },
    {
      "title": "Scientific Consensus",
      "content": "Immediate action needed to reduce emissions and adopt renewable energy."
    },
    {
      "title": "Adaptation Required",
      "content": "Communities need strategies to cope with unavoidable climate impacts."
    }
  ]
}


### Example 2
**Input Paragraph:**
"Artificial intelligence is revolutionizing healthcare by enabling faster diagnosis, personalized treatment plans, and drug discovery acceleration. Machine learning algorithms can analyze medical images with accuracy that often surpasses human radiologists, while natural language processing helps extract insights from vast amounts of medical literature. However, challenges remain including data privacy concerns, the need for regulatory approval, and ensuring AI systems are free from bias. The future of AI in healthcare looks promising, but successful implementation requires collaboration between technologists, healthcare professionals, and policymakers."

**Output:**
{
  "bulletPoints": [
    {
      "title": "Revolutionary Healthcare Applications",
      "content": "AI enables faster diagnosis, personalized treatments, and accelerated drug discovery."
    },
    {
      "title": "Superior Diagnostic Accuracy",
      "content": "Machine learning surpasses human performance in medical image analysis."
    },
    {
      "title": "Implementation Challenges",
      "content": "Data privacy, regulatory approval, and bias prevention remain obstacles."
    },
    {
      "title": "Collaborative Future Success",
      "content": "Requires partnership between tech experts, doctors, and policymakers."
    }
  ]
}

## Key Guidelines
- Always extract exactly four bullet points
- Keep titles concise and descriptive (3-6 words)
- Ensure content is clear and presentation-ready
- Maintain logical flow and distinct separation between points
- Focus on the most impactful and important information from the paragraph`

const anthropic = createAnthropic({
  apiKey: ""
});

/**
 * ollama-ai-provider's native /api/chat client validates the raw Ollama response against a
 * strict Zod schema that requires timing fields (e.g. eval_duration) which Ollama Cloud models
 * (":cloud" suffix) don't always return, causing spurious AI_TypeValidationError failures even
 * when the model responded successfully. Using Ollama's OpenAI-compatible /v1 endpoint instead
 * avoids that broken response validation.
 */
const ollama = createOpenAI({
  baseURL: `${process.env.OLLAMA_HOST ?? "http://localhost:11434"}/v1`,
  apiKey: "ollama"
});

/**
 * B.AI exposes an OpenAI-compatible API, so the same client factory works.
 * The 403 on the bare host documents the allowed paths:
 * /v1/chat/completions, /v1/messages, /v1/responses, /v1/models, /v1/images/*.
 *
 * Important: calling `bai(id)` resolves to the Responses API (/v1/responses),
 * which B.AI does not serve for every model. It answers with
 * "model X is not supported on /v1/responses; use /v1/chat/completions instead".
 * So use the explicit `bai.chat(id)` everywhere.
 *
 * Note: not every model behind this endpoint honours OpenAI-style structured
 * output equally well. If generateObject starts failing with schema errors,
 * suspect the model's schema fidelity before suspecting the request shape.
 */
const bai = createOpenAI({
  baseURL: "https://api.b.ai/v1",
  apiKey: process.env.BAI_API_KEY ?? ""
});

/** Central place for the model choice. Switch here, not at the call sites. */
const BAI_MODEL = process.env.BAI_MODEL ?? "qwen3.8-flash";

/** Always go through /v1/chat/completions, never through /v1/responses. */
const baiChat = (modelId: string = BAI_MODEL) => bai.chat(modelId);

/** Warns once at request time instead of crashing the process at import time. */
function assertBaiKey(): void {
    if (!process.env.BAI_API_KEY) {
        throw new Error(
            "BAI_API_KEY is not set. Add it to .env in the repository root (see .env.example)."
        );
    }
}

/**
 * Keeps configuration mistakes out of the generic "Failed to generate" response.
 * A missing key or an unreachable endpoint should be readable in the server log,
 * not hidden behind the same message as a model that returned bad JSON.
 */
function describeProviderError(error: unknown): string {
    if (error instanceof Error) {
        if (error.message.includes("BAI_API_KEY")) return error.message;

        const status = (error as { statusCode?: number }).statusCode;
        if (status === 401 || status === 403) {
            return `B.AI rejected the credentials (HTTP ${status}). Check BAI_API_KEY.`;
        }
        if (status === 404) {
            return `B.AI returned 404. Check the model id "${BAI_MODEL}" and the base URL.`;
        }
        if (status === 429) {
            return "B.AI rate limit or quota reached (HTTP 429).";
        }
        if (error.message.includes("fetch failed") || error.message.includes("ENOTFOUND")) {
            return "Could not reach api.b.ai. Check the network or the endpoint URL.";
        }
        return error.message;
    }
    return String(error);
}

router.post("/structured", async (req, res) => {
    const { context } = await req.body;
    console.log("Received context:", context);

    try {
        assertBaiKey();

        const { object } = await generateObject({
            model: baiChat(),
            // Fallback auf den lokalen Pfad:
            // model: ollama("gemma4:cloud"),
            // model: anthropic('claude-3-haiku-20240307'),
            system: SYSTEM_PROMPT,
            prompt: `Generate bullet points from the following context: ${context}`,
            schema: BulletPointsResponseSchema
        });
        return res.json(object);
    } catch (error) {
        // Without this block the error bypasses the route and the global handler
        // answers with a generic message, hiding the actual cause.
        const reason = describeProviderError(error);
        console.error("Error generating bullet points:", reason);
        return res.status(500).json({
            error: "Failed to generate bullet points",
            reason
        });
    }
})

/**
 * Repairs common model mistakes so the response is always safe to render:
 * de-duplicates node ids, and clears parentId values that cannot be resolved,
 * because `d3-hierarchy`'s `stratify` throws on a dangling parent.
 *
 * The archetype is not touched here: the response no longer carries one.
 */
function normalizeSmartArtStructure(structure: SmartArtStructure): SmartArtStructure {
    const seenIds = new Set<string>();
    const nodes = structure.nodes.map((node, index) => {
        let id = node.id?.trim() || `n${index + 1}`;
        while (seenIds.has(id)) {
            id = `${id}-${index + 1}`;
        }
        seenIds.add(id);
        return { ...node, id };
    });

    const ids = new Set(nodes.map((node) => node.id));
    const cleaned = nodes.map((node) => {
        if (node.parentId === null || node.parentId === undefined) return node;
        if (node.parentId !== node.id && ids.has(node.parentId)) return node;
        const { parentId, ...rest } = node;
        return rest;
    });

    return { nodes: cleaned };
}

/**
 * Local/small models occasionally echo the JSON schema itself instead of an instance of it.
 * Retrying is cheap and resolves most of these transient failures.
 */
async function generateSmartArtStructure(context: string, attempts = 2): Promise<SmartArtStructure> {
    assertBaiKey();
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            console.log(`Generating SmartArt nodes (attempt ${attempt + 1}/${attempts}) for context:`, context);
            const { object } = await generateObject({
                model: baiChat(),
                // Fallback auf den lokalen Pfad, falls B.AI nicht erreichbar ist:
                // model: ollama("gemma4:cloud"),
                system: SMARTART_NODES_SYSTEM_PROMPT,
                prompt: `Break the following text into diagram nodes:\n\n${context}`,
                schema: SmartArtStructureSchema
            });
            console.log("Generated SmartArt nodes:", object);
            return object;
        } catch (error) {
            lastError = error;
            console.warn(`SmartArt generation attempt ${attempt + 1}/${attempts} failed:`, describeProviderError(error));
        }
    }
    throw lastError;
}

router.post("/smartart", async (req, res) => {
    const { context } = req.body ?? {};

    if (!context || typeof context !== "string" || !context.trim()) {
        return res.status(400).json({ error: "context is required" });
    }

    try {
        const object = await generateSmartArtStructure(context);

        return res.json(normalizeSmartArtStructure(object));
    } catch (error) {
        const reason = describeProviderError(error);
        console.error("Error generating SmartArt structure:", reason);
        // The detail stays in the log. The client gets the reason too, because a
        // misconfigured key is actionable for whoever runs this locally.
        return res.status(500).json({
            error: "Failed to generate SmartArt structure",
            reason
        });
    }
});

export default router;
