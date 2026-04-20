// src/utils/pathfinding.js


export const getShortestPath = (nodes, edges, startId, goalId) => {
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

    if (u === null || dist[u] === Infinity) break;
    if (u === goalId) break;
    
    unvisited.delete(u);

    // 接続されているエッジを探す
    edges.forEach(e => {
      if (e.from === u && unvisited.has(e.to)) {
        const alt = dist[u] + (e.cost ?? 1);
        if (alt < dist[e.to]) {
          dist[e.to] = alt;
          prev[e.to] = u;
        }
      }
      if (e.to === u && unvisited.has(e.from)) {
        const alt = dist[u] + (e.cost ?? 1);
        if (alt < dist[e.from]) {
          dist[e.from] = alt;
          prev[e.from] = u;
        }
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

  // スタート地点に辿り着けなかった場合は空配列
  if (path.length > 0 && path[0].id !== startId) return [];

  return path;
};
