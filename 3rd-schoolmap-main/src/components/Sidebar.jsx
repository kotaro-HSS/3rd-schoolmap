import React, { useState } from "react";

export default function Sidebar({ handleSearch }) {
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");

  return (
    <div className="w-64 p-4 bg-gray-200">
      <h2 className="text-lg mb-2">経路検索</h2>

      <input
        placeholder="start"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="w-full mb-2 p-1"
      />

      <input
        placeholder="goal"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-full mb-2 p-1"
      />

      <button
        onClick={() => handleSearch(start, goal)}
        className="bg-blue-500 text-white px-2 py-1"
      >
        検索
      </button>
    </div>
  );
}