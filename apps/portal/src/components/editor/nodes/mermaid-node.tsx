"use client";

import type {
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import * as React from "react";
import type { JSX} from "react";
import { Suspense } from "react";
import { DecoratorNode } from "lexical";

const MermaidComponent = React.lazy(
  () => import("../editor-ui/mermaid-component"),
);

export type SerializedMermaidNode = Spread<
  {
    code: string;
  },
  SerializedLexicalNode
>;

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __code: string;

  static getType(): string {
    return "mermaid";
  }

  static clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__code, node.__key);
  }

  static importJSON(serializedNode: SerializedMermaidNode): MermaidNode {
    return new MermaidNode(serializedNode.code);
  }

  exportJSON(): SerializedMermaidNode {
    return {
      code: this.__code,
      type: "mermaid",
      version: 1,
    };
  }

  constructor(
    code = "flowchart LR\n  App --> Repo\n  Repo --> ORM\n  ORM -->|Migrations| DB[(Database)]",
    key?: NodeKey,
  ) {
    super(key);
    this.__code = code;
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = (theme as any)?.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-mermaid", this.__code);
    return { element };
  }

  setCode(code: string): void {
    const self = this.getWritable();
    self.__code = code;
  }

  getCode(): string {
    return this.getLatest().__code;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <Suspense fallback={null}>
        <MermaidComponent code={this.__code} />
      </Suspense>
    );
  }
}

export function $createMermaidNode(code?: string): MermaidNode {
  return new MermaidNode(code);
}

export function $isMermaidNode(
  node: LexicalNode | null | undefined,
): node is MermaidNode {
  return node instanceof MermaidNode;
}
