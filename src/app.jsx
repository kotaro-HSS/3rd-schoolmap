// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { getEdges } from "./data/edges";
import MapFloorView from "./components/MapFloorView";
import Layout from "./components/Layout";

export default function App() {

  // =====================
  // 1. Router / URL
  // =====================
  const location = useLocation();

  // =====================
  // 2. Raw Data (Firebase)
  // =====================
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================
  // 3. Derived Data
  // =====================
  const places = useMemo(() => {
    return nodes.filter(node => node.tf === true || node.tf === "t");
  }, [nodes]);

  // =====================
  // 4. UI State
  // =====================
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [goalSuggestions, setGoalSuggestions] = useState([]);

  const [route, setRoute] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // カテゴリ
  const [categoryFilters, setCategoryFilters] = useState({});
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalTarget, setCategoryModalTarget] = useState("start");
  const [modalSelectedCategory, setModalSelectedCategory] = useState("");
  const [modalFilteredPlaces, setModalFilteredPlaces] = useState([]);

  // =====================
  // 5. Refs
  // =====================
  const navSectionRef = useRef(null);

  // =====================
  // 6. Utility
  // =====================
  const getDisplayName = (node) => {
    if (!node) return "";
    if (node.label && node.label.trim() !== "") return node.label;
    return node.name;
  };

  // =====================
  // 7. Data Fetching
  // =====================
  useEffect(() => {
    async function fetchData() {
      try {
        const snapshot = await getDocs(collection(db, "nodes"));
        const fetched = snapshot.docs.map(doc => doc.data());

        setNodes(fetched);
        setEdges(getEdges(fetched));

      } catch (e) {
        console.error(e);
        alert("地図データの読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // =====================
  // 8. QRコード対応（URL → start）
  // =====================
  useEffect(() => {
    if (nodes.length === 0) return;

    const params = new URLSearchParams(location.search);
    const nodeId = params.get("node");

    if (!nodeId) return;

    const target = nodes.find(n => n.id === nodeId);
    if (target) {
      setStart(getDisplayName(target));
    }
  }, [location.search, nodes]);

  // =====================
  // 9. 初期フィルタ
  // =====================
  useEffect(() => {
    if (nodes.length === 0) return;

    const obj = {};
    places.forEach(p => {
      if (p.category && !(p.category in obj)) obj[p.category] = false;
    });

    setCategoryFilters(obj);
    setFilteredPlaces(places.filter(p => p.category !== "階段" && p.category !== "中継"));

  }, [nodes]);

  // =====================
  // 10. Navigation Logic
  // =====================
  const getShortestPath = (startId, goalId) => {
    const dist = {};
    const prev = {};
    const unvisited = new Set(nodes.map(n => n.id));

    nodes.forEach(n => dist[n.id] = Infinity);
    dist[startId] = 0;

    while (unvisited.size > 0) {
      let u = null;
      unvisited.forEach(id => {
        if (u === null || dist[id] < dist[u]) u = id;
      });
      if (u === goalId) break;
      unvisited.delete(u);

      edges.forEach(e => {
        const from = nodes.find(n => n.id === e.from);
        const to = nodes.find(n => n.id === e.to);
        if (!from || !to) return;

        if (!(from.tf === true || from.tf === "t")) return;
        if (!(to.tf === true || to.tf === "t")) return;

        if (e.from === u && unvisited.has(e.to)) {
          const alt = dist[u] + (e.cost ?? 1);
          if (alt < dist[e.to]) { dist[e.to] = alt; prev[e.to] = u; }
        }
        if (e.to === u && unvisited.has(e.from)) {
          const alt = dist[u] + (e.cost ?? 1);
          if (alt < dist[e.from]) { dist[e.from] = alt; prev[e.from] = u; }
        }
      });
    }

    const path = [];
    let u = goalId;
    while (u !== undefined) {
      const node = nodes.find(n => n.id === u);
      if (!node) break;
      path.unshift(node);
      u = prev[u];
    }
    return path;
  };

  // =====================
  // 11. Handlers
  // =====================
  const handleStartNavigation = () => {
    if (!start || !goal) return alert("出発地と目的地を入力してください。");

    const s = nodes.find(n => getDisplayName(n) === start);
    const g = nodes.find(n => getDisplayName(n) === goal);
    if (!s || !g) return;

    const path = getShortestPath(s.id, g.id);

    const steps = path.map((node, i) => {
      if (i === 0) return { id: node.id, text: `${s.name} から出発します。`, image: node.image };
      return { id: node.id, text: `${getDisplayName(node)} に進みます。`, image: node.image };
    });

    setRoute(steps);
    setStepIndex(0);

    setTimeout(() => {
      navSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  // =====================
  // 12. UI
  // =====================
  if (loading) {
    return <div className="flex h-screen items-center justify-center">読み込み中...</div>;
  }

  return (
    <Layout>
      <div className="p-4">

        {/* 入力 */}
        <input value={start} onChange={e => setStart(e.target.value)} placeholder="出発地" />
        <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="目的地" />

        <button onClick={handleStartNavigation}>ナビ開始</button>

        {/* 地図 */}
        <MapFloorView route={route} places={places} stepIndex={stepIndex} />

      </div>
    </Layout>
  );
}
