import type { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";

import type { OEmbedPayload } from "~/components/editor/utils/oembed";

type OEmbedComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  payload: OEmbedPayload;
}>;

function OEmbedComponent({
  className,
  format,
  nodeKey,
  payload,
}: OEmbedComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const aspectRatio =
    payload.width && payload.height ? payload.height / payload.width : 9 / 16;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateMediaDimensions = () => {
      const availableWidth = container.offsetWidth || container.clientWidth;
      const calculatedHeight =
        availableWidth > 0
          ? availableWidth * aspectRatio
          : (payload.height ?? 360);

      const responsiveElements = container.querySelectorAll<
        HTMLIFrameElement | HTMLVideoElement
      >("iframe, video");

      responsiveElements.forEach((element) => {
        element.removeAttribute("width");
        element.removeAttribute("height");
        element.style.setProperty("width", "100%", "important");
        element.style.setProperty("max-width", "100%", "important");
        element.style.setProperty(
          "height",
          `${calculatedHeight}px`,
          "important",
        );
        element.style.setProperty("display", "block", "important");
      });

      const responsiveContainers = container.querySelectorAll<HTMLElement>(
        ".player, [id^='player']",
      );
      responsiveContainers.forEach((element) => {
        element.style.setProperty("width", "100%", "important");
        element.style.setProperty("max-width", "100%", "important");
        element.style.setProperty(
          "height",
          `${calculatedHeight}px`,
          "important",
        );
        element.style.setProperty("display", "block", "important");
      });
    };

    updateMediaDimensions();

    const mutationObserver = new MutationObserver(() => {
      updateMediaDimensions();
    });

    mutationObserver.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    window.addEventListener("resize", updateMediaDimensions);

    return () => {
      mutationObserver.disconnect();
      window.removeEventListener("resize", updateMediaDimensions);
    };
  }, [aspectRatio, payload.height, payload.width, payload.html]);

  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      <div
        ref={containerRef}
        className="oembed-container w-full rounded-lg bg-black [&_iframe]:h-auto [&_iframe]:max-h-[70vh] [&_iframe]:rounded-md [&_iframe]:shadow-lg"
        aria-label={payload.title ?? payload.providerName ?? payload.url}
        dangerouslySetInnerHTML={{ __html: payload.html }}
      />
    </BlockWithAlignableContents>
  );
}

export type SerializedOEmbedNode = Spread<
  OEmbedPayload,
  SerializedDecoratorBlockNode
>;

const DATASET_ATTRIBUTE = "data-lexical-oembed";

const convertOEmbedElement = (
  domNode: HTMLElement,
): DOMConversionOutput | null => {
  const rawPayload = domNode.getAttribute(DATASET_ATTRIBUTE);
  if (!rawPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(rawPayload) as OEmbedPayload;
    return { node: $createOEmbedNode(payload) };
  } catch {
    return null;
  }
};

export class OEmbedNode extends DecoratorBlockNode {
  __payload: OEmbedPayload;

  static getType(): string {
    return "oembed";
  }

  static clone(node: OEmbedNode): OEmbedNode {
    return new OEmbedNode(node.__payload, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedOEmbedNode): OEmbedNode {
    const { url, html, providerName, title, height, width, thumbnailUrl } =
      serializedNode;
    const node = $createOEmbedNode({
      url,
      html,
      providerName,
      title,
      height,
      width,
      thumbnailUrl,
    });
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedOEmbedNode {
    return {
      ...super.exportJSON(),
      type: "oembed",
      version: 1,
      ...this.__payload,
    };
  }

  constructor(
    payload: OEmbedPayload,
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__payload = payload;
  }

  getPayload(): OEmbedPayload {
    return this.__payload;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute(DATASET_ATTRIBUTE, JSON.stringify(this.__payload));
    element.innerHTML = this.__payload.html;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(DATASET_ATTRIBUTE)) {
          return null;
        }
        return {
          conversion: convertOEmbedElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return this.__payload.url;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock ?? {};
    const className = {
      base: embedBlockTheme.base ?? "",
      focus: embedBlockTheme.focus ?? "",
    };

    return (
      <OEmbedComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        payload={this.__payload}
      />
    );
  }
}

export const $createOEmbedNode = (payload: OEmbedPayload) =>
  new OEmbedNode(payload);

export const $isOEmbedNode = (node?: LexicalNode | null): node is OEmbedNode =>
  node instanceof OEmbedNode;
