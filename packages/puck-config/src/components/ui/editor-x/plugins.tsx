import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import {
  DynamicTablePickerPlugin,
  TablePickerPlugin,
} from "@/components/editor/plugins/picker/table-picker-plugin";

import { ActionsPlugin } from "@/components/editor/plugins/actions/actions-plugin";
import { AlignmentPickerPlugin } from "@/components/editor/plugins/picker/alignment-picker-plugin";
import { AutoEmbedPlugin } from "@/components/editor/plugins/embeds/auto-embed-plugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { AutoLinkPlugin } from "@/components/editor/plugins/auto-link-plugin";
import { AutocompletePlugin } from "@/components/editor/plugins/autocomplete-plugin";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { BlockInsertPlugin } from "@/components/editor/plugins/toolbar/block-insert-plugin";
import { BulletedListPickerPlugin } from "@/components/editor/plugins/picker/bulleted-list-picker-plugin";
import { CharacterLimitPlugin } from "@/components/editor/plugins/actions/character-limit-plugin";
import { CheckListPickerPlugin } from "@/components/editor/plugins/picker/check-list-picker-plugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorActionPlugin } from "@/components/editor/plugins/actions/clear-editor-plugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting-toolbar-plugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { CodeActionMenuPlugin } from "@/components/editor/plugins/code-action-menu-plugin";
import { CodeHighlightPlugin } from "@/components/editor/plugins/code-highlight-plugin";
import { CodeLanguageToolbarPlugin } from "@/components/editor/plugins/toolbar/code-language-toolbar-plugin";
import { CodePickerPlugin } from "@/components/editor/plugins/picker/code-picker-plugin";
import { CollapsiblePickerPlugin } from "@/components/editor/plugins/picker/collapsible-picker-plugin";
import { CollapsiblePlugin } from "@/components/editor/plugins/collapsible-plugin";
import { ColumnsLayoutPickerPlugin } from "@/components/editor/plugins/picker/columns-layout-picker-plugin";
import { ComponentPickerMenuPlugin } from "@/components/editor/plugins/component-picker-menu-plugin";
import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { ContextMenuPlugin } from "@/components/editor/plugins/context-menu-plugin";
import { CounterCharacterPlugin } from "@/components/editor/plugins/actions/counter-character-plugin";
import { DividerPickerPlugin } from "@/components/editor/plugins/picker/divider-picker-plugin";
import { DragDropPastePlugin } from "@/components/editor/plugins/drag-drop-paste-plugin";
import { DraggableBlockPlugin } from "@/components/editor/plugins/draggable-block-plugin";
import { EMOJI } from "@/components/editor/transformers/markdown-emoji-transformer";
import { EQUATION } from "@/components/editor/transformers/markdown-equation-transformer";
import { EditModeTogglePlugin } from "@/components/editor/plugins/actions/edit-mode-toggle-plugin";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import { EmbedsPickerPlugin } from "@/components/editor/plugins/picker/embeds-picker-plugin";
import { EmojiPickerPlugin } from "@/components/editor/plugins/emoji-picker-plugin";
import { EmojisPlugin } from "@/components/editor/plugins/emojis-plugin";
import { EquationPickerPlugin } from "@/components/editor/plugins/picker/equation-picker-plugin";
import { EquationsPlugin } from "@/components/editor/plugins/equations-plugin";
// import { ExcalidrawPickerPlugin } from "@/components/editor/plugins/picker/excalidraw-picker-plugin";
// import { ExcalidrawPlugin } from "@/components/editor/plugins/excalidraw-plugin";
import { FigmaPlugin } from "@/components/editor/plugins/embeds/figma-plugin";
import { FloatingLinkEditorPlugin } from "@/components/editor/plugins/floating-link-editor-plugin";
import { FloatingTextFormatToolbarPlugin } from "@/components/editor/plugins/floating-text-format-plugin";
import { FontBackgroundToolbarPlugin } from "@/components/editor/plugins/toolbar/font-background-toolbar-plugin";
import { FontColorToolbarPlugin } from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin";
import { FontFamilyToolbarPlugin } from "@/components/editor/plugins/toolbar/font-family-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { FontSizeToolbarPlugin } from "@/components/editor/plugins/toolbar/font-size-toolbar-plugin";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { FormatCodeBlock } from "@/components/editor/plugins/toolbar/block-format/format-code-block";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { HR } from "@/components/editor/transformers/markdown-hr-transformer";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HeadingPickerPlugin } from "@/components/editor/plugins/picker/heading-picker-plugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history-toolbar-plugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import IFramePickerPlugin from "@/components/editor/plugins/picker/iframe-picker-plugin";
import IFramePlugin from "@/components/editor/plugins/embeds/iframe-plugin";
import { IMAGE } from "@/components/editor/transformers/markdown-image-transformer";
import { ImagePickerPlugin } from "@/components/editor/plugins/picker/image-picker-plugin";
import { ImagePickerWPPlugin } from "@/components/editor/plugins/picker/image-picker-wp-plugin";
import { ImagesPlugin } from "@/components/editor/plugins/images-plugin";
import { ImportExportPlugin } from "@/components/editor/plugins/actions/import-export-plugin";
import { InlineImagePlugin } from "@/components/editor/plugins/inline-image-plugin";
import { InsertCollapsibleContainer } from "@/components/editor/plugins/toolbar/block-insert/insert-collapsible-container";
import { InsertColumnsLayout } from "@/components/editor/plugins/toolbar/block-insert/insert-columns-layout";
import { InsertEmbeds } from "@/components/editor/plugins/toolbar/block-insert/insert-embeds";
// import { InsertExcalidraw } from "@/components/editor/plugins/toolbar/block-insert/insert-excalidraw";
import { InsertHorizontalRule } from "@/components/editor/plugins/toolbar/block-insert/insert-horizontal-rule";
import { InsertImage } from "@/components/editor/plugins/toolbar/block-insert/insert-image";
import { InsertImageWP } from "@/components/editor/plugins/toolbar/block-insert/insert-image-wp";
import { InsertInlineImage } from "@/components/editor/plugins/toolbar/block-insert/insert-inline-image";
import { InsertPageBreak } from "@/components/editor/plugins/toolbar/block-insert/insert-page-break";
import { InsertPoll } from "@/components/editor/plugins/toolbar/block-insert/insert-poll";
import { InsertTable } from "@/components/editor/plugins/toolbar/block-insert/insert-table";
import { KeywordsPlugin } from "@/components/editor/plugins/keywords-plugin";
import { LayoutPlugin } from "@/components/editor/plugins/layout-plugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LinkPlugin } from "@/components/editor/plugins/link-plugin";
import { LinkToolbarPlugin } from "@/components/editor/plugins/toolbar/link-toolbar-plugin";
import { ListMaxIndentLevelPlugin } from "@/components/editor/plugins/list-max-indent-level-plugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { MarkdownTogglePlugin } from "@/components/editor/plugins/actions/markdown-toggle-plugin";
import { MaxLengthPlugin } from "@/components/editor/plugins/actions/max-length-plugin";
import { MentionsPlugin } from "@/components/editor/plugins/mentions-plugin";
import { NumberedListPickerPlugin } from "@/components/editor/plugins/picker/numbered-list-picker-plugin";
import { PageBreakPickerPlugin } from "@/components/editor/plugins/picker/page-break-picker-plugin";
import { PageBreakPlugin } from "@/components/editor/plugins/page-break-plugin";
import { ParagraphPickerPlugin } from "@/components/editor/plugins/picker/paragraph-picker-plugin";
import { PollPickerPlugin } from "@/components/editor/plugins/picker/poll-picker-plugin";
import { PollPlugin } from "@/components/editor/plugins/poll-plugin";
import { QuotePickerPlugin } from "@/components/editor/plugins/picker/quote-picker-plugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { Separator } from "@/components/ui/separator";
import { ShareContentPlugin } from "@/components/editor/plugins/actions/share-content-plugin";
import { SpeechToTextPlugin } from "@/components/editor/plugins/actions/speech-to-text-plugin";
import { SubSuperToolbarPlugin } from "@/components/editor/plugins/toolbar/subsuper-toolbar-plugin";
import { TABLE } from "@/components/editor/transformers/markdown-table-transformer";
import { TWEET } from "@/components/editor/transformers/markdown-tweet-transformer";
import { TabFocusPlugin } from "@/components/editor/plugins/tab-focus-plugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TableActionMenuPlugin } from "@/components/editor/plugins/table-action-menu-plugin";
import { TableCellResizerPlugin } from "@/components/editor/plugins/table-cell-resizer-plugin";
import { TableHoverActionsPlugin } from "@/components/editor/plugins/table-hover-actions-plugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";
import { TreeViewPlugin } from "@/components/editor/plugins/actions/tree-view-plugin";
import { TwitterPlugin } from "@/components/editor/plugins/embeds/twitter-plugin";
import { TypingPerfPlugin } from "@/components/editor/plugins/typing-pref-plugin";
import { YouTubePlugin } from "@/components/editor/plugins/embeds/youtube-plugin";
import { useState } from "react";

const placeholder = "Press / for commands...";
const maxLength = 999999; // Effectively unlimited character limit

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      <ToolbarPlugin>
        {({ blockType }: { blockType: string }) => (
          <div className="vertical-align-middle sticky top-0 z-10 flex flex flex-wrap gap-2 overflow-auto border-b p-1">
            {/* <HistoryToolbarPlugin /> */}
            <Separator orientation="vertical" className="h-8" />
            <BlockFormatDropDown>
              <FormatParagraph />
              <FormatHeading levels={["h1", "h2", "h3"]} />
              <FormatNumberedList />
              <FormatBulletedList />
              <FormatCheckList />
              <FormatCodeBlock />
              <FormatQuote />
            </BlockFormatDropDown>
            {blockType === "code" ? (
              <CodeLanguageToolbarPlugin />
            ) : (
              <>
                {/* <FontFamilyToolbarPlugin /> */}
                <FontSizeToolbarPlugin />
                <Separator orientation="vertical" className="h-8" />
                <FontFormatToolbarPlugin format="bold" />
                <FontFormatToolbarPlugin format="italic" />
                <FontFormatToolbarPlugin format="underline" />
                <FontFormatToolbarPlugin format="strikethrough" />
                <Separator orientation="vertical" className="h-8" />
                <SubSuperToolbarPlugin />
                <LinkToolbarPlugin />
                <Separator orientation="vertical" className="h-8" />
                <ClearFormattingToolbarPlugin />
                <Separator orientation="vertical" className="h-8" />
                <FontColorToolbarPlugin />
                <FontBackgroundToolbarPlugin />
                <Separator orientation="vertical" className="h-8" />
                {/* <ElementFormatToolbarPlugin /> */}
                <Separator orientation="vertical" className="h-8" />
                <BlockInsertPlugin>
                  <InsertHorizontalRule />
                  <InsertPageBreak />
                  <InsertImage />
                  <InsertInlineImage />
                  <InsertImageWP />
                  <InsertCollapsibleContainer />
                  {/* <InsertExcalidraw /> */}
                  <InsertTable />
                  <InsertPoll />
                  <InsertColumnsLayout />
                  <InsertEmbeds />
                  <IFramePickerPlugin />
                </BlockInsertPlugin>
              </>
            )}
          </div>
        )}
      </ToolbarPlugin>
      <div className="relative">
        <AutoFocusPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable
                  placeholder={placeholder}
                  className="ContentEditable__root relative block min-h-20 overflow-auto px-8 py-4 focus:outline-none"
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <ClickableLinkPlugin />
        <CheckListPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <HashtagPlugin />
        <HistoryPlugin />

        <MentionsPlugin />
        <PageBreakPlugin />
        <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
        <KeywordsPlugin />
        <EmojisPlugin />
        <ImagesPlugin />
        <InlineImagePlugin />
        {/* <ExcalidrawPlugin /> */}
        <TableCellResizerPlugin />
        <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
        <TableActionMenuPlugin anchorElem={floatingAnchorElem} cellMerge={true} />
        <PollPlugin />
        <LayoutPlugin />
        {/* <EquationsPlugin /> */}
        <CollapsiblePlugin />

        <AutoEmbedPlugin />
        <FigmaPlugin />
        <TwitterPlugin />
        <YouTubePlugin />
        <IFramePlugin />

        <CodeHighlightPlugin />
        <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />

        <MarkdownShortcutPlugin
          transformers={[
            TABLE,
            HR,
            IMAGE,
            EMOJI,
            EQUATION,
            TWEET,
            CHECK_LIST,
            ...ELEMENT_TRANSFORMERS,
            ...MULTILINE_ELEMENT_TRANSFORMERS,
            ...TEXT_FORMAT_TRANSFORMERS,
            ...TEXT_MATCH_TRANSFORMERS,
          ]}
        />
        {/* <TypingPerfPlugin /> */}
        <TabFocusPlugin />
        <AutocompletePlugin />
        <AutoLinkPlugin />
        <LinkPlugin />

        <ComponentPickerMenuPlugin
          baseOptions={[
            ParagraphPickerPlugin(),
            HeadingPickerPlugin({ n: 1 }),
            HeadingPickerPlugin({ n: 2 }),
            HeadingPickerPlugin({ n: 3 }),
            TablePickerPlugin(),
            CheckListPickerPlugin(),
            NumberedListPickerPlugin(),
            BulletedListPickerPlugin(),
            QuotePickerPlugin(),
            CodePickerPlugin(),
            DividerPickerPlugin(),
            PageBreakPickerPlugin(),
            // ExcalidrawPickerPlugin(),
            PollPickerPlugin(),
            EmbedsPickerPlugin({ embed: "figma" }),
            EmbedsPickerPlugin({ embed: "tweet" }),
            EmbedsPickerPlugin({ embed: "youtube-video" }),
            // EquationPickerPlugin(),
            ImagePickerPlugin(),
            ImagePickerWPPlugin(),
            CollapsiblePickerPlugin(),
            ColumnsLayoutPickerPlugin(),
            AlignmentPickerPlugin({ alignment: "left" }),
            AlignmentPickerPlugin({ alignment: "center" }),
            AlignmentPickerPlugin({ alignment: "right" }),
            AlignmentPickerPlugin({ alignment: "justify" }),
          ]}
          dynamicOptionsFn={DynamicTablePickerPlugin}
        />

        <ContextMenuPlugin />
        <DragDropPastePlugin />
        <EmojiPickerPlugin />

        <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
        <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} />

        <ListMaxIndentLevelPlugin />
      </div>
      <ActionsPlugin>
        <div className="clear-both flex flex-wrap items-center justify-between gap-2 overflow-auto border-t p-1">
          <div className="flex flex-1 justify-start">
            <MaxLengthPlugin maxLength={maxLength} />
            <CharacterLimitPlugin maxLength={maxLength} charset="UTF-16" />
          </div>
          <div>
            <CounterCharacterPlugin charset="UTF-16" />
          </div>
          <div className="flex flex-1 justify-end">
            <SpeechToTextPlugin />
            <ShareContentPlugin />
            <ImportExportPlugin />
            <MarkdownTogglePlugin
              shouldPreserveNewLinesInMarkdown={true}
              transformers={[
                TABLE,
                HR,
                IMAGE,
                EMOJI,
                EQUATION,
                TWEET,
                CHECK_LIST,
                ...ELEMENT_TRANSFORMERS,
                ...MULTILINE_ELEMENT_TRANSFORMERS,
                ...TEXT_FORMAT_TRANSFORMERS,
                ...TEXT_MATCH_TRANSFORMERS,
              ]}
            />
            <EditModeTogglePlugin />
            <>
              <ClearEditorActionPlugin />
              <ClearEditorPlugin />
            </>
            <TreeViewPlugin />
          </div>
        </div>
      </ActionsPlugin>
    </div>
  );
}
