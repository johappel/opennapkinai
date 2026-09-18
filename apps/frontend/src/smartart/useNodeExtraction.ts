import { useCallback, useEffect, useRef } from "react";
import { experimental_useObject } from "@ai-sdk/react";
import { parseCompleteSmartArtStructure, SmartArtStructureSchema } from "./schema";
import type { SmartArtStructure } from "./types";

export const SMARTART_API_URL = "http://localhost:3001/api/ai/smartart";

type Options = {
    /** The text to break into nodes. */
    originalText: string;
    /** A structure already persisted with the block. Skips the model entirely. */
    persisted?: SmartArtStructure | null;
    onStructure: (structure: SmartArtStructure) => void;
};

export type NodeExtraction = {
    structure: SmartArtStructure | null;
    isLoading: boolean;
    error: string | null;
    retry: () => void;
};

/**
 * Asks the backend to break the text into nodes. This is the only model call
 * in the diagram flow: the shapes are drawn locally by `computeLayout`, so
 * trying a second archetype costs nothing.
 */
export function useNodeExtraction({ originalText, persisted, onStructure }: Options): NodeExtraction {
    const { object, submit, isLoading, error, clear } = experimental_useObject({
        api: SMARTART_API_URL,
        schema: SmartArtStructureSchema,
    });

    const reported = useRef<string | null>(null);
    const persistedRef = useRef(persisted);

    const trimmed = originalText?.trim() ?? "";

    const submitText = useCallback(
        (text: string) => {
            reported.current = null;
            submit({ context: text });
        },
        [submit],
    );

    useEffect(() => {
        if (persistedRef.current && persistedRef.current.nodes.length > 0) return;
        if (!trimmed) return;
        submitText(trimmed);
    }, [trimmed, submitText]);

    useEffect(() => {
        const parsed = parseCompleteSmartArtStructure(object);
        if (!parsed) return;
        const key = parsed.nodes.map((node) => node.id).join("|");
        if (reported.current === key) return;
        reported.current = key;
        onStructure({ archetype: persistedRef.current?.archetype ?? "process", nodes: parsed.nodes });
    }, [object, onStructure]);

    const retry = useCallback(() => {
        if (!trimmed) return;
        clear();
        submitText(trimmed);
    }, [trimmed, clear, submitText]);

    return {
        structure: persisted && persisted.nodes.length > 0 ? persisted : null,
        isLoading,
        error: error ? error.message || "Unbekannter Grund" : null,
        retry,
    };
}
