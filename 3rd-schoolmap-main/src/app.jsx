import React from "react";
import MapCanvas from "./components/MapCanvas";
import Sidebar from "./components/Sidebar";
import { useMapState } from "./hooks/useMapState";

export default function App() {
  const mapState = useMapState();

  return (
    <div className="flex h-screen">
      <Sidebar {...mapState} />
      <MapCanvas {...mapState} />
    </div>
  );
}