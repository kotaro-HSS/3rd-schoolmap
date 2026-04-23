import nodes from "../data/nodes";
import edges from "../data/edges";

// 非常に簡易的な例（必要なら既存ロジック移植）
export function findRoute(startId, goalId) {
  // ダミー（ここに既存の経路探索ロジックを移植）
  if (!startId || !goalId) return [];

  return [startId, goalId];
}

export function getNodeById(id) {
  return nodes.find((n) => n.id === id);
}