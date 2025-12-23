"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import {
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";

import { cn } from "@acme/ui";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@acme/ui/context-menu";

import type { CertificateElement, CertificateTemplateV1 } from "./types";
import { PLACEHOLDER_TOKENS, resolveCanvasSizePx } from "./types";

export const CertificateCanvas = ({
  className,
  template,
  imageUrlByStorageId,
  selectedId,
  onSelect,
  onChangeElement,
  onDeleteElement,
  showGrid,
}: {
  template: CertificateTemplateV1;
  imageUrlByStorageId: Map<string, any>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChangeElement: (id: string, patch: Partial<CertificateElement>) => void;
  onDeleteElement?: (id: string) => void;
  showGrid: boolean;
  className?: string;
}) => {
  // "Document units" used for element positioning (stable across screens).
  // We still use px-like units here, but the *rendered* size is controlled by
  // a responsive aspect-ratio frame below.
  const { width, height } = resolveCanvasSizePx(template.page);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 },
  );

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const selectedNodeRef = useRef<Konva.Node | null>(null);
  const [contextTargetId, setContextTargetId] = useState<string | null>(null);

  const imageNodeRefs = useRef<Record<string, Konva.Image | null>>({});
  const textNodeRefs = useRef<Record<string, Konva.Text | null>>({});

  const imageUrlLookup = useMemo(() => {
    const map = new Map<string, string>();
    imageUrlByStorageId.forEach((item, storageId) => {
      if (item?.url) {
        map.set(String(storageId), String(item.url));
      }
    });
    return map;
  }, [imageUrlByStorageId]);

  const imageCache = useRef<Record<string, HTMLImageElement | null>>({});
  const [, forceRender] = React.useState(0);
  const getCachedImage = (url: string | null) => {
    if (!url) return null;
    const existing = imageCache.current[url];
    if (existing) return existing;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.current[url] = img;
      forceRender((n) => n + 1);
    };
    img.src = url;
    imageCache.current[url] = null;
    return null;
  };

  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    const spacing = 20;
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let x = 0; x <= width; x += spacing) {
      lines.push({ x1: x, y1: 0, x2: x, y2: height });
    }
    for (let y = 0; y <= height; y += spacing) {
      lines.push({ x1: 0, y1: y, x2: width, y2: y });
    }
    return lines;
  }, [showGrid, width, height]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    transformer.nodes(selectedNodeRef.current ? [selectedNodeRef.current] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const ro = new ResizeObserver(() => {
      setFrameSize({ width: node.clientWidth, height: node.clientHeight });
    });
    ro.observe(node);
    setFrameSize({ width: node.clientWidth, height: node.clientHeight });
    return () => ro.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (frameSize.width <= 0 || frameSize.height <= 0) return 1;
    // Fit the document coordinate system into the responsive frame.
    // Keep X/Y scales identical so interactions remain intuitive.
    return Math.min(frameSize.width / width, frameSize.height / height);
  }, [frameSize.height, frameSize.width, height, width]);

  const stageWidth = Math.max(1, Math.floor(frameSize.width));
  const stageHeight = Math.max(1, Math.floor(frameSize.height));

  return (
    <div className={cn("bg-muted/20 w-full rounded-lg border p-3", className)}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={frameRef}
            className="w-full overflow-hidden rounded-md bg-white shadow-sm"
            style={{
              // Responsive sizing: height is derived from width via aspect ratio.
              aspectRatio: `${width} / ${height}`,
            }}
          >
            <Stage
              width={stageWidth}
              height={stageHeight}
              scaleX={scale}
              scaleY={scale}
              onMouseDown={(e) => {
                // Deselect on empty space.
                const clickedOnEmpty =
                  e.target === e.target.getStage() ||
                  e.target.name() === "canvas-bg";
                if (clickedOnEmpty) onSelect(null);
              }}
              onContextMenu={(e) => {
                const target = e.target;
                const clickedOnEmpty =
                  target === target.getStage() || target.name() === "canvas-bg";
                const rawId =
                  !clickedOnEmpty && typeof (target as any).id === "function"
                    ? String((target as any).id())
                    : "";
                const nextId = rawId.length > 0 ? rawId : null;
                setContextTargetId(nextId);
                if (nextId) {
                  onSelect(nextId);
                }
              }}
            >
              <Layer>
                <Rect
                  id="canvas-bg"
                  name="canvas-bg"
                  x={0}
                  y={0}
                  width={width}
                  height={height}
                  fill="#ffffff"
                />

                {showGrid
                  ? gridLines.map((line, idx) => (
                      <Rect
                        key={idx}
                        x={line.x1}
                        y={line.y1}
                        width={line.x2 - line.x1 || 1}
                        height={line.y2 - line.y1 || 1}
                        fill="rgba(0,0,0,0.04)"
                        listening={false}
                      />
                    ))
                  : null}

                {[...template.elements]
                  .slice()
                  .sort((a: any, b: any) => (a?.zIndex ?? 0) - (b?.zIndex ?? 0))
                  .map((el) => {
                    const isSelected = el.id === selectedId;

                    if (el.kind === "image") {
                      const url =
                        imageUrlLookup.get(String(el.storageId)) ?? null;
                      const image = getCachedImage(url);
                      return (
                        <KonvaImage
                          key={el.id}
                          id={el.id}
                          ref={(node) => {
                            imageNodeRefs.current[el.id] =
                              node as unknown as Konva.Image | null;
                            if (isSelected) {
                              selectedNodeRef.current =
                                node as unknown as Konva.Node | null;
                            }
                          }}
                          image={image ?? undefined}
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          rotation={el.rotation ?? 0}
                          draggable
                          onClick={() => onSelect(el.id)}
                          onTap={() => onSelect(el.id)}
                          onDragEnd={(e) => {
                            onChangeElement(el.id, {
                              x: e.target.x(),
                              y: e.target.y(),
                            } as any);
                          }}
                          onTransformEnd={(e) => {
                            const node = e.target as Konva.Image;
                            const scaleX = node.scaleX();
                            const scaleY = node.scaleY();
                            node.scaleX(1);
                            node.scaleY(1);
                            onChangeElement(el.id, {
                              x: node.x(),
                              y: node.y(),
                              width: Math.max(10, node.width() * scaleX),
                              height: Math.max(10, node.height() * scaleY),
                              rotation: node.rotation(),
                            } as any);
                          }}
                        />
                      );
                    }

                    if (el.kind !== "placeholder") return null;
                    const token = PLACEHOLDER_TOKENS[el.placeholderKey];
                    return (
                      <Text
                        key={el.id}
                        id={el.id}
                        ref={(node) => {
                          if (isSelected) {
                            textNodeRefs.current[el.id] =
                              node as unknown as Konva.Text | null;
                            selectedNodeRef.current =
                              node as unknown as Konva.Node | null;
                          }
                        }}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        text={token}
                        fontFamily={el.style.fontFamily}
                        fontSize={el.style.fontSize}
                        fontStyle={
                          el.style.fontWeight >= 600 ? "bold" : "normal"
                        }
                        fill={el.style.color}
                        align={el.style.align}
                        rotation={(el as any).rotation ?? 0}
                        draggable
                        onClick={() => onSelect(el.id)}
                        onTap={() => onSelect(el.id)}
                        onDragEnd={(e) => {
                          onChangeElement(el.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          } as any);
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target as Konva.Text;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();
                          node.scaleX(1);
                          node.scaleY(1);
                          onChangeElement(el.id, {
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(20, node.width() * scaleX),
                            height: Math.max(16, node.height() * scaleY),
                            rotation: node.rotation(),
                          } as any);
                        }}
                      />
                    );
                  })}

                <Transformer
                  ref={(node) => {
                    transformerRef.current =
                      node as unknown as Konva.Transformer | null;
                  }}
                  rotateEnabled={true}
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                  ]}
                  boundBoxFunc={(_, newBox) => {
                    if (newBox.width < 40 || newBox.height < 18) {
                      return {
                        ...newBox,
                        width: Math.max(newBox.width, 40),
                        height: Math.max(newBox.height, 18),
                      };
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            variant="destructive"
            disabled={!contextTargetId || !onDeleteElement}
            onSelect={() => {
              if (!contextTargetId || !onDeleteElement) return;
              onDeleteElement(contextTargetId);
              setContextTargetId(null);
            }}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
