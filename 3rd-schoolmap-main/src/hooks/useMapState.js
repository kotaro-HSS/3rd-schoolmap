import { useState } from "react";
import { findRoute } from "../services/mapService";

export function useMapState() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [route, setRoute] = useState([]);

  function handleSelectNode(node) {
    setSelectedNode(node);
  }

  function handleSearch(start, goal) {
    const result = findRoute(start, goal);
    setRoute(result);
  }

  return {
    selectedNode,
    route,
    handleSelectNode,
    handleSearch,
  };
}