import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { DiagramData } from "./DiagramInlineTool";
import type { API } from "@editorjs/editorjs";
import DiagramList from "../components/DiagramList";
import { checkSourceBlocks, type SourceState } from "./sourceBlocks";

export class DiagramBlockTool {
  private data: DiagramData;
  private api: API;
  private wrapper: HTMLElement | null = null;
  private reactRoot: Root | null = null;

  /*
  * Disabled Toolbox configuration for the Diagram Block tool
  static get toolbox() {
    return {
      title: 'Diagram Block',
      icon: '📝'
    };
  }
  */

  constructor({ data, api }: { data: DiagramData; api: API }) {
    this.data = data || ({} as DiagramData);
    this.api = api;
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('diagram-block-wrapper');

    this.renderReactComponent();
    return this.wrapper;
  }

  private renderReactComponent(): void {
    if (!this.wrapper) return;

    // Einmal beim Aufbau geprueft. EditorJS zeichnet den Block neu, wenn sich das
    // Dokument aendert, deshalb genuegt das. Geprueft wird nur, ob es die
    // Quellbloecke noch gibt, nicht wo sie stehen.
    const sourceState: SourceState = checkSourceBlocks(this.api, this.data.sourceBlockIds);

    this.reactRoot = createRoot(this.wrapper);
    this.reactRoot.render(
      createElement(DiagramList, {
        data: this.data,
        sourceState,
        // The React tree owns what it renders but not the block data, so changes
        // are handed back up here. Without this the chosen shape and the theme
        // would be lost the moment the note is saved.
        onDataChange: (patch) => {
          this.data = { ...this.data, ...patch };
        },
      })
    );
  }

  save(): DiagramData {
    return this.data;
  }

  destroy(): void {
    if (this.reactRoot) {
      // Without unmounting, every removed diagram block leaves its React tree
      // running. With the chooser that is six tiles per block.
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }

  static get isReadOnlySupported(): boolean {
    return true;
  }
}
