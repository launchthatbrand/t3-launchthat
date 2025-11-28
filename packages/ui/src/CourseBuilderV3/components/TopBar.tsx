import React from "react";

interface TopBarProps {
  onLogStructure: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onLogStructure }) => {
  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4 py-2 shadow-sm">
      <div className="flex items-center">
        {" "}
        {/* Left side (placeholder) */}
        <span className="text-lg font-semibold">Course Builder</span>
      </div>
      <div className="flex items-center">
        {" "}
        {/* Right side */}
        <button
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground shadow hover:bg-primary/90"
          onClick={onLogStructure}
        >
          Log Structure
        </button>
      </div>
    </div>
  );
};

export default TopBar;
