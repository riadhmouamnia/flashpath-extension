// src/components/HighlightColors.js
import React from "react";

const highlightColors = [
  { value: "#56C880", text: "Green" },
  { value: "#F56937", text: "Red" },
  { value: "#1D99FD", text: "Blue" },
  { value: "#7B61FF", text: "Purple" },
];

const HighlightColors = ({
  selectedColor,
  onColorChange,
}: {
  selectedColor: string;
  onColorChange: (color: string) => void;
}) => {
  return (
    <div className="flex space-x-2">
      {highlightColors.map((color) => (
        <label key={color.value} className="flex items-center">
          <input
            type="radio"
            name="color"
            value={color.value}
            checked={selectedColor === color.value}
            onChange={() => onColorChange(color.value)}
            className="hidden"
          />
          <div
            className={`w-6 h-6 rounded-full cursor-pointer ${
              selectedColor === color.value ? "ring-2 ring-primary" : ""
            }`}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorChange(color.value)}
          ></div>
        </label>
      ))}
    </div>
  );
};

export default HighlightColors;
