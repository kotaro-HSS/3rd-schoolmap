// src/Admin.jsx
import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getEdges } from "./data/edges";
import Layout from "./components/Layout";

export default function Admin() {

  const FLOOR_Y_OFFSET = { "1F": 0, "2F": 2000, "3F": 4000 };
  const MAP_WIDTH = 600;
  const FLOOR_IMAGE_HEIGHT = 500;
  const FLOOR_NODE_HEIGHT = 2000;
  const MAP_HEIGHT = FLOOR_IMAGE_HEIGHT * (MAP_WIDTH / 500);

  const [currentFloor, setCurrentFloor] = useState("1F");
  const floorIndex = { "1F": 0, "2F": 1, "3F": 2 }[currentFloor];

  const CATEGORY_OPTIONS = [
    "教室", "中継", "トイレ", "階段", "部活",
    "委員会", "中催事", "案内", "食事", "保健室",
    "入口", "イベント", "職員室",
  ];

  // ---------------------
  // State
  // ---------------------
  const auth = getAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // 検索・絞り込み
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // "" = すべて
  const [filterTraffic, setFilterTraffic] = useState("all"); // "all" | "open" | "closed"

  useEffect(() => { document.title = "管理者ページ"; }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => setLoggedIn(!!user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const querySnapshot = await getDocs(collection(db, "nodes"));
      const fetchedNodes = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setNodes(fetchedNodes);
      setEdges(getEdges(fetchedNodes));
    }
    fetchData();
  }, []);

  // ---------------------
  // 絞り込み後のノード一覧
  // ---------------------
  const filteredNodes = nodes.filter(node => {
    const matchSearch = node.name?.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = filterCategory === "" || node.category === filterCategory;
    const matchTraffic =
      filterTraffic === "all" ? true :
      filterTraffic === "open" ? (node.tf === true || node.tf === "t") :
      !(node.tf === true || node.tf === "t");
    return matchSearch && matchCategory && matchTraffic;
  });

  // ---------------------
  // Firestore 更新
  // ---------------------
  const toggleTraffic = async (docId, currentTf) => {
    try {
      await updateDoc(doc(db, "nodes", docId), { tf: !currentTf });
      setNodes(prev => prev.map(n => n.docId === docId ? { ...n, tf: !currentTf } : n));
    } catch (error) { console.error("Firestore更新エラー:", error); }
  };

  const updateCategory = async (docId, newCategory) => {
    try {
      await updateDoc(doc(db, "nodes", docId), { category: newCategory });
      setNodes(prev => prev.map(n => n.docId === docId ? { ...n, category: newCategory } : n));
    } catch (error) { console.error("カテゴリー更新エラー:", error); }
  };

  const updateLabel = async (docId, newLabel) => {
    try {
      await updateDoc(doc(db, "nodes", docId), { label: newLabel });
    } catch (error) { console.error("label 更新失敗:", error); }
  };

  const updateNote = async (docId, newNote) => {
    try {
      await updateDoc(doc(db, "nodes", docId), { note: newNote });
      setNodes(prev => prev.map(n => n.docId === docId ? { ...n, note: newNote } : n));
    } catch (error) { console.error("note 更新失敗:", error); }
  };

  // ---------------------
  // マップ上の座標変換
  // ---------------------
  const toMapCoords = (node) => {
    const x = (node.x / FLOOR_NODE_HEIGHT) * MAP_WIDTH;
    const y = ((node.y - FLOOR_Y_OFFSET[currentFloor]) / FLOOR_NODE_HEIGHT) * MAP_HEIGHT;
    return { x, y };
  };

  // 現在のフロアのノードだけ
  const floorNodes = nodes.filter(n => n.floor === currentFloor);

  // 現在のフロアのエッジ（両端ノードが同じフロアのもの）
  const floorEdges = edges.filter(e => {
    const fromNode = nodes.find(n => n.id === e.from);
    const toNode = nodes.find(n => n.id === e.to);
    return fromNode?.floor === currentFloor && toNode?.floor === currentFloor;
  });

  // ---------------------
  // ログイン画面
  // ---------------------
  if (!loggedIn) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">管理者ログイン</h1>
        <input type="email" placeholder="メールアドレス" className="border p-2 w-full mb-2" id="email" />
        <input type="password" placeholder="パスワード" className="border p-2 w-full mb-4" id="password" />
        <button
          className="bg-blue-600 text-white px-4 py-2 w-full"
          onClick={() => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            signInWithEmailAndPassword(auth, email, password).catch(() => alert("ログイン失敗"));
          }}
        >
          ログイン
        </button>
      </div>
    );
  }

  // ---------------------
  // 管理者画面
  // ---------------------
  return (
    <Layout>
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-1">管理者用：データ編集画面</h1>
        <p className="mb-4 text-gray-600 text-sm">ここから通行止め情報などを書き換えます。</p>

        {/* ===== 絞り込みエリア ===== */}
        <div className="bg-white border rounded-xl p-4 shadow-sm mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 items-center">

            {/* テキスト検索 */}
            <input
              type="text"
              placeholder="教室名で検索"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px]"
            />

            {/* カテゴリ絞り込み */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">すべてのカテゴリ</option>
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* 通行状態絞り込み */}
            <div className="flex gap-1">
              {[
                { value: "all", label: "すべて" },
                { value: "open", label: "✅ 通行可" },
                { value: "closed", label: "🚫 通行止め" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterTraffic(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    filterTraffic === value
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            {filteredNodes.length} 件表示中 / 全 {nodes.length} 件
          </p>
        </div>

        {/* ===== ノード一覧 ===== */}
        <div className="border rounded-xl p-4 shadow-sm bg-white mb-8">
          <h2 className="font-bold mb-2">登録データ一覧</h2>
          <ul className="space-y-2 h-96 overflow-y-auto">
            {filteredNodes.map(node => (
              <li key={node.docId} className="border-b p-2 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{node.name}</span>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="text"
                      value={node.label || ""}
                      placeholder="ラベル"
                      onChange={(e) => {
                        const v = e.target.value;
                        setNodes(prev => prev.map(n => n.docId === node.docId ? { ...n, label: v } : n));
                      }}
                      onBlur={(e) => updateLabel(node.docId, e.target.value)}
                      className="border rounded px-2 py-1 text-sm placeholder:text-gray-400 w-32"
                    />
                    <select
                      value={node.category || ""}
                      onChange={(e) => updateCategory(node.docId, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={node.note || ""}
                    placeholder="備考"
                    onChange={(e) => {
                      const v = e.target.value;
                      setNodes(prev => prev.map(n => n.docId === node.docId ? { ...n, note: v } : n));
                    }}
                    onBlur={(e) => updateNote(node.docId, e.target.value)}
                    className="border rounded px-2 py-1 text-sm placeholder:text-gray-400 resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-4 ml-2">
                  <span className={`w-20 text-right text-sm ${node.tf ? "text-green-600" : "text-red-600 font-bold"}`}>
                    {node.tf ? "通行可" : "通行止め"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!node.tf}
                      onChange={() => toggleTraffic(node.docId, node.tf)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ===== 管理者用マップ ===== */}
        <div>
          <h2 className="text-xl font-bold mb-2">管理者用マップ</h2>

          {/* 凡例 */}
          <div className="flex gap-4 mb-2 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>通行可</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>通行止め</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 border-t-2 border-blue-400"></span>エッジ（通行可）</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 border-t-2 border-red-300 border-dashed"></span>エッジ（通行止め含む）</span>
          </div>

          {/* 階切替 */}
          <div className="flex gap-2 mb-3">
            {["1F", "2F", "3F"].map(f => (
              <button
                key={f}
                onClick={() => setCurrentFloor(f)}
                className={`px-3 py-1 rounded ${currentFloor === f ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* マップ本体 */}
          <div
            className="relative border bg-white overflow-hidden"
            style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
          >
            {/* 背景マップ */}
            <img
              src={import.meta.env.BASE_URL + "map_images/map_image.png"}
              alt="map"
              style={{
                position: "absolute",
                top: -floorIndex * MAP_HEIGHT,
                left: 0,
                width: MAP_WIDTH,
                height: MAP_HEIGHT * 3,
              }}
            />

            {/* ===== SVGでエッジを描画 ===== */}
            <svg
              style={{ position: "absolute", top: 0, left: 0, width: MAP_WIDTH, height: MAP_HEIGHT, pointerEvents: "none" }}
            >
              {floorEdges.map((e, i) => {
                const fromNode = nodes.find(n => n.id === e.from);
                const toNode = nodes.find(n => n.id === e.to);
                if (!fromNode || !toNode) return null;

                const from = toMapCoords(fromNode);
                const to = toMapCoords(toNode);

                const isValid =
                  (fromNode.tf === true || fromNode.tf === "t") &&
                  (toNode.tf === true || toNode.tf === "t");

                return (
                  <line
                    key={i}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke={isValid ? "#60a5fa" : "#fca5a5"}
                    strokeWidth={isValid ? 1.5 : 1}
                    strokeDasharray={isValid ? "none" : "4 3"}
                    opacity={0.8}
                  />
                );
              })}
            </svg>

            {/* ノード表示 */}
            {floorNodes.map(n => {
              const { x, y } = toMapCoords(n);
              return (
                <div
                  key={n.docId}
                  onClick={() => toggleTraffic(n.docId, n.tf)}
                  title={`${n.name} : ${n.tf ? "通行可" : "通行止め"}`}
                  className="absolute rounded-full cursor-pointer z-10"
                  style={{
                    left: x,
                    top: y,
                    width: 10,
                    height: 10,
                    backgroundColor: n.tf ? "green" : "red",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}