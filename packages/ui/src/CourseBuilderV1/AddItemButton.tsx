import React from "react";

type AddItemButtonProps = {
  label: string;
  onClick: () => void;
};

export const AddItemButton: React.FC<AddItemButtonProps> = ({
  label,
  onClick,
}) => {
  return (
    <button type="button" className="add-item-button" onClick={onClick}>
      <span className="add-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label}
    </button>
  );
};
