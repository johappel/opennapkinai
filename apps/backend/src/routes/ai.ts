import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

import { generateObject, streamText } from 'ai';
import { Router } from 'express';
import { z } from 'zod';

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
            "Only set for the 'hierarchy' archetype: id of this node's parent, or null for the single root node. Omit for every other archetype."
        )
});

export const SmartArtArchetypeSchema = z.enum([
    "process",
    "cycle",
    "hierarchy",
    "pyramid",
    "matrix",
    "comparison"
]);

export const SmartArtStructureSchema = z.object({
    archetype: SmartArtArchetypeSchema
        .describe("The diagram archetype that best fits the structure implied by the text"),
    nodes: z.array(SmartArtNodeSchema)
        .min(3, "Must contain at least 3 nodes")
        .max(9, "Must contain at most 9 nodes")
        .describe("3 to 9 nodes capturing the key ideas from the text, in logical order")
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


### Example 3
**Input Paragraph:**
"The rise of remote work has fundamentally changed the modern workplace landscape, accelerated by the global pandemic but sustained by its numerous benefits. Companies report increased productivity, reduced overhead costs, and access to a global talent pool without geographical constraints. Employees enjoy better work-life balance, elimination of commute stress, and greater flexibility in managing personal responsibilities. However, remote work also presents challenges such as communication barriers, difficulty in team building, potential isolation, and the need for robust cybersecurity measures to protect company data."

**Output:**
**Pandemic-Accelerated Transformation:** Remote work fundamentally changed workplace landscapes with lasting benefits.
**Company Advantages:** Increased productivity, reduced costs, and global talent access without location limits.
**Employee Benefits:** Better work-life balance, no commute stress, and greater personal flexibility.
**Operational Challenges:** Communication barriers, team building difficulties, and cybersecurity concerns.

### Example 4
**Input Paragraph:**
"Sustainable agriculture practices are becoming increasingly important as the world faces the dual challenge of feeding a growing population while protecting environmental resources. Techniques such as crop rotation, integrated pest management, and precision farming help maintain soil health and reduce chemical inputs. Water conservation methods like drip irrigation and rainwater harvesting ensure efficient resource use in water-scarce regions. Furthermore, sustainable farming supports biodiversity by creating habitats for beneficial insects and wildlife while reducing the carbon footprint through methods like cover cropping and reduced tillage."

**Output:**
**Growing Population Challenge:** Sustainable agriculture must feed more people while protecting environmental resources.
**Soil Health Techniques:** Crop rotation, pest management, and precision farming reduce chemical dependency.
**Water Conservation Methods:** Drip irrigation and rainwater harvesting optimize resource use efficiently.
**Biodiversity Support:** Sustainable practices create wildlife habitats and reduce carbon footprint.

## Key Guidelines
- Always extract exactly four bullet points
- Keep titles concise and descriptive (3-6 words)
- Ensure content is clear and presentation-ready
- Maintain logical flow and distinct separation between points
- Focus on the most impactful and important information from the paragraph`


const SMARTART_SYSTEM_PROMPT = `# System Prompt: Text to SmartArt Structure Generator

## Role
You are an expert information designer who converts free-form text into a structured diagram (a "SmartArt"), similar to PowerPoint SmartArt or napkin.ai. You decide BOTH the best diagram archetype AND how many nodes are needed - never force a fixed shape.

## Archetypes
- **process**: a linear sequence of steps/stages with a clear start and end (e.g. a workflow, a set of ordered phases). Use 3-6 nodes.
- **cycle**: a repeating/circular process with no fixed end (e.g. a lifecycle, a feedback loop). Use 3-8 nodes.
- **hierarchy**: a tree of parent-child relationships (e.g. an org chart, a taxonomy). Exactly one node is the root (parentId: null); every other node's parentId must reference an existing node's id. Use 3-9 nodes.
- **pyramid**: a layered structure ordered by priority/foundation, from base to top (e.g. a maturity model, Maslow's hierarchy). Use 3-5 nodes, ordered from base (first) to top (last).
- **matrix**: a grid of independent categories/quadrants with no inherent order (e.g. a 2x2 prioritization grid). Use 4 nodes ideally (or up to 9 for larger grids).
- **comparison**: two or more contrasting options/approaches placed side by side (e.g. option A vs option B). Use an even number of nodes (4, 6, or 8), alternating sides in array order.

## Rules
1. Read the text and pick exactly ONE archetype that best matches its underlying structure.
2. Generate between 3 and 9 nodes depending on how many distinct ideas the text actually contains - do not pad or force a specific count.
3. Each node needs: a short unique "id" (e.g. "n1"), a concise "title" (2-5 words), and one sentence of "content".
4. Only include "parentId" when the archetype is "hierarchy". Exactly one node must have parentId set to null (the root); every other node's parentId must reference another node's "id" in the same response.
5. Preserve a logical order in the "nodes" array (step order for process, priority order for pyramid, alternating sides for comparison, etc.).`;

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

router.post("/structured", async (req, res) => {
    const { context } = await req.body;
    console.log("Received context:", context);

    const { object } = await generateObject({
        model: ollama("gemma4:cloud"),
        // model: anthropic('claude-3-haiku-20240307'),
        system: SYSTEM_PROMPT,
        prompt: `Generate bullet points from the following context: ${context}`,
        schema: BulletPointsResponseSchema
    });
    return res.json(object);
})

/**
 * Repairs common model mistakes so the response is always safe to render:
 * - de-duplicates node ids
 * - strips parentId for non-hierarchy archetypes
 * - guarantees exactly one hierarchy root and that every parentId resolves to a real node
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

    if (structure.archetype !== "hierarchy") {
        return {
            archetype: structure.archetype,
            nodes: nodes.map(({ parentId, ...rest }) => rest)
        };
    }

    const ids = new Set(nodes.map((node) => node.id));
    const roots = nodes.filter((node) => node.parentId === null || node.parentId === undefined);
    const rootId = roots[0]?.id ?? nodes[0]?.id;

    const fixedNodes = nodes.map((node) => {
        if (node.id === rootId) {
            return { ...node, parentId: null };
        }
        if (node.parentId && node.parentId !== node.id && ids.has(node.parentId)) {
            return node;
        }
        return { ...node, parentId: rootId };
    });

    return { archetype: "hierarchy", nodes: fixedNodes };
}

/**
 * Local/small models occasionally echo the JSON schema itself instead of an instance of it.
 * Retrying is cheap and resolves most of these transient failures.
 */
async function generateSmartArtStructure(context: string, attempts = 2): Promise<SmartArtStructure> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            console.log(`Generating SmartArt structure (attempt ${attempt + 1}/${attempts}) for context:`, context);
            const { object } = await generateObject({
                model: ollama("gemma4:cloud"),
                system: SMARTART_SYSTEM_PROMPT,
                prompt: `Generate a SmartArt structure for the following text:\n\n${context}`,
                schema: SmartArtStructureSchema
            });
            console.log("Generated SmartArt structure:", object);
            return object;
        } catch (error) {
            lastError = error;
            console.warn(`SmartArt generation attempt ${attempt + 1}/${attempts} failed:`, error instanceof Error ? error.message : error);
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
        console.error("Error generating SmartArt structure:", error);
        return res.status(500).json({ error: "Failed to generate SmartArt structure" });
    }
});

export default router;