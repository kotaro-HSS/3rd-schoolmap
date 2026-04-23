// 3rd-schoolmap-main/src/utils/nodeUtils.js

export const getDisplayName = (node) => {
  if (!node) return "";
  if (node.label && node.label.trim() !== "") return node.label;
  return node.name || "";
};

export const filterPlaces = (nodes) => {
  return nodes.filter(node => node.tf === true || node.tf === "t");
};
