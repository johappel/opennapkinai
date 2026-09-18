import type { API } from "@editorjs/editorjs";
import type { Archetype, SmartArtStructure } from "../smartart/types";
import type { Presentation } from "../smartart/presentation";
import { buildDiagramData } from "./diagramData";

export type DiagramData = {
    /**
     * The text the diagram was built from. This is the block's own copy and the
     * only source the diagram needs: the source blocks may be gone later.
     */
    originalText: string;
    /**
     * EditorJS block ids the text was taken from, in document order. Ids, not
     * indices, because an index shifts as soon as a block above is inserted or
     * removed, while the id keeps pointing at the same block. Empty for blocks
     * saved before 18.09.2026.
     */
    sourceBlockIds?: string[];
    /**
     * Left over from the first version. Not read anywhere any more, kept so old
     * saved notes keep their shape. See `buildDiagramData`.
     */
    sourceBlockIndex?: number;
    /**
     * The ideas read out of the text. Persisted so reopening a note does not
     * call the model again. Optional because blocks saved before 18.09.2026
     * only carry `originalText`.
     */
    structure?: SmartArtStructure;
    /** Top-level convenience copy of the current shape, for quick reads. */
    archetype?: Archetype;
    /** Display only: theme, sketch style. Never part of the structure. */
    presentation?: Presentation;
    /** Shapes the user already tried, so the chooser can mark them. */
    rejectedArchetypes?: Archetype[];
};

export class DiagramInlineTool {
  private api: API;
  private button: HTMLButtonElement | null = null;

  static get isInline(): boolean {
    return true;
  }

  constructor({ api }: { api: API }) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles-icon lucide-sparkles"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>';

    // Add click handler to create summary block immediately
    this.button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.createDiagramBlock();
    });

    return this.button;
  }

  // This method is required but we don't use it for text wrapping anymore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  surround(_range: Range): void {
    // Do nothing - we create block on button click instead
    return;
  }

  checkState(): boolean {
    // Always return false since we don't wrap text anymore
    return false;
  }

  private createDiagramBlock(): void {
    const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();
    const currentBlock = this.api.blocks.getBlockByIndex(currentBlockIndex);

    if (!currentBlock) return;

    let blockText = '';
    if (currentBlock.holder && currentBlock.holder.textContent) {
      blockText = currentBlock.holder.textContent.trim();
    } 

    if (!blockText) {
      console.warn('No text content found in current block');
      return;
    }

    this.insertDiagramBlock(blockText, currentBlockIndex, currentBlock.id);
  }

  private insertDiagramBlock(blockText: string, currentBlockIndex: number, blockId?: string): void {
    const diagramData = buildDiagramData({
      text: blockText,
      sourceBlockIds: blockId ? [blockId] : [],
      sourceBlockIndex: currentBlockIndex,
    });

    // Insert new diagram block after current block
    try {
      this.api.blocks.insert('diagramBlock', diagramData, {}, currentBlockIndex + 1, true);
    } catch (error) {
      console.error('Failed to insert diagram block:', error);
      alert('Please make sure you have registered the "diagramBlock" tool in your EditorJS configuration.');
    }
  }

  static get shortcut(): string {
    return 'CMD+SHIFT+S';
  }

  static get title(): string {
    return 'Generate Diagram';
  }
}

export default DiagramInlineTool;
