import { useMemo, useState } from "react";
import type { DiagramData } from "../tools/DiagramInlineTool";
import type { Archetype, SmartArtStructure } from "../smartart/types";
import VariantChooser from "../smartart/VariantChooser";
import DiagramResult from "../smartart/DiagramResult";

type Props = {
    data: DiagramData;
    /** Hands edits back to the EditorJS block, which owns the persisted data. */
    onDataChange?: (patch: Partial<DiagramData>) => void;
    /**
     * Whether the blocks the text was taken from still exist. Read once when the
     * block mounts; the block is redrawn by EditorJS when the document changes.
     */
    sourceState?: { kind: "keine" | "vorhanden" | "verwaist"; missing?: string[] };
};

/**
 * The diagram block's shell. It owns the step logic: chooser first, result
 * after a shape has been picked. What it does not own is the model call, which
 * lives in `useNodeExtraction` so both steps share one result.
 */
export default function DiagramList({ data, onDataChange, sourceState }: Props) {
    const [structure, setStructure] = useState<SmartArtStructure | null>(data.structure ?? null);
    const [isChooserOpen, setChooserOpen] = useState(!data.archetype);

    const picked = data.archetype ?? null;

    const patch = (next: Partial<DiagramData>) => {
        onDataChange?.(next);
    };

    const handleStructure = (next: SmartArtStructure) => {
        setStructure(next);
        patch({ structure: next });
    };

    const handlePick = (archetype: Archetype) => {
        patch({ archetype });
        setChooserOpen(false);
    };

    const rejected = useMemo(() => data.rejectedArchetypes ?? [], [data.rejectedArchetypes]);

    if (isChooserOpen || !picked) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <VariantChooser
                    originalText={data.originalText}
                    structure={structure}
                    presentation={data.presentation}
                    sourceState={sourceState}
                    onStructure={handleStructure}
                    onPick={handlePick}
                />
            </div>
        );
    }

    return (
        <DiagramResult
            originalText={data.originalText}
            structure={structure}
            archetype={picked}
            presentation={data.presentation}
            sourceState={sourceState}
            onPresentationChange={(presentation) => patch({ presentation })}
            rejectedArchetypes={rejected}
            onRejectArchetype={(archetype) => {
                if (rejected.includes(archetype)) return;
                patch({ rejectedArchetypes: [...rejected, archetype] });
            }}
            onBackToChooser={() => {
                patch({ archetype: undefined });
                setChooserOpen(true);
            }}
            onStructure={handleStructure}
        />
    );
}
