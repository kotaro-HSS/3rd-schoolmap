// src/hooks/useMapData.js
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getEdges } from "../data/edges";
import { filterPlaces } from "../utils/nodeUtils";

export function useMapData() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const snapshot = await getDocs(collection(db, "nodes"));
        const fetchedNodes = snapshot.docs.map(doc => doc.data());
        
        setNodes(fetchedNodes);
        setEdges(getEdges(fetchedNodes));
      } catch (e) {
        console.error("Data fetch error:", e);
        setError("地図データの読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const places = useMemo(() => filterPlaces(nodes), [nodes]);

  return { nodes, edges, places, loading, error };
}
