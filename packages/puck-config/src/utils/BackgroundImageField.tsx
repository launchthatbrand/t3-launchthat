import React, { useRef } from "react";

const DEFAULT_BG_VALUE = {
  enabled: false,
  media: [],
  url: "",
  size: "cover",
  position: "center",
  repeat: "no-repeat",
  attachment: "scroll",
};

const defaultGetAssetUrl = (asset: { url?: string; src?: string } | null) => asset?.url ?? asset?.src ?? "";

export const BackgroundImageField = ({
  value = {},
  onChange = (newValue: Partial<typeof DEFAULT_BG_VALUE>) => {},
  mediaPicker = () => {},
  getAssetUrl = defaultGetAssetUrl,
}) => {
  const fileInputRef = useRef(null);
  const mergedValue = { ...DEFAULT_BG_VALUE, ...(value || {}) };
  const { enabled, media, url, size, position, repeat, attachment } = mergedValue;

  const handleChange = (key: keyof typeof DEFAULT_BG_VALUE, newValue: any) => {
    onChange({
      ...mergedValue,
      [key]: newValue,
    });
  };

  const handleMediaSelect = (items = []) => {
    handleChange("media", items);
    if (!url && items[0]) {
      handleChange("url", getAssetUrl(items[0]));
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    handleMediaSelect([{ url: objectUrl, file }]);
  };

  const renderMediaPicker = () => {
    if (typeof mediaPicker === "function") {
      return mediaPicker({
        value: media || [],
        onSelect: handleMediaSelect,
      });
    }

    return (
      <div className="rounded border border-gray-200 p-3">
        <button
          type="button"
          className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  };

  const selectedImageUrl = url || (media?.[0] ? getAssetUrl(media[0]) : "");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Background Image</label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleChange("enabled", e.target.checked)}
          className="rounded border-gray-300"
        />
      </div>

      {enabled && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium">Select Image</label>
            {renderMediaPicker()}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Background Size</label>
              <select
                value={size}
                onChange={(e) => handleChange("size", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="auto">Auto</option>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="100%">100%</option>
                <option value="100% 100%">Stretch</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Background Position</label>
              <select
                value={position}
                onChange={(e) => handleChange("position", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
                <option value="bottom left">Bottom Left</option>
                <option value="bottom right">Bottom Right</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Background Repeat</label>
              <select
                value={repeat}
                onChange={(e) => handleChange("repeat", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="no-repeat">No Repeat</option>
                <option value="repeat">Repeat</option>
                <option value="repeat-x">Repeat X</option>
                <option value="repeat-y">Repeat Y</option>
                <option value="space">Space</option>
                <option value="round">Round</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Background Attachment</label>
              <select
                value={attachment}
                onChange={(e) => handleChange("attachment", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="scroll">Scroll</option>
                <option value="fixed">Fixed (Parallax)</option>
                <option value="local">Local</option>
              </select>
            </div>
          </div>

          {selectedImageUrl ? (
            <div className="rounded border border-gray-200 p-2">
              <div className="mb-1 text-xs font-medium text-gray-500">Preview</div>
              <div
                className="h-32 rounded"
                style={{
                  backgroundImage: `url(${selectedImageUrl})`,
                  backgroundSize: size,
                  backgroundPosition: position,
                  backgroundRepeat: repeat,
                  backgroundAttachment: attachment === "fixed" ? "scroll" : attachment,
                }}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};







