import React from "react";

export default function NodeMarker({ node, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`absolute cursor-pointer text-xs px-2 py-1 rounded
        ${isSelected ? "bg-blue-500 text-white" : "bg-white"}
      `}
      style={{
        left: node.x,
        top: node.y,
      }}
    >
      {node.label}
    </div>
  );
}