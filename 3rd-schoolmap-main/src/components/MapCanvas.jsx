import React from "react";
import NodeMarker from "./NodeMarker";
import nodes from "../data/nodes";

export default function MapCanvas({ selectedNode, route, handleSelectNode }) {
  return (
    <div className="flex-1 relative bg-gray-100">
      {nodes.map((node) => (
        <NodeMarker
          key={node.id}
          node={node}
          isSelected={selectedNode?.id === node.id}
          onClick={() => handleSelectNode(node)}
        />
      ))}

      {/* 経路表示（簡易） */}
      <div className="absolute bottom-2 left-2 text-xs">
        Route: {route.join(" → ")}
      </div>
    </div>
  );
}