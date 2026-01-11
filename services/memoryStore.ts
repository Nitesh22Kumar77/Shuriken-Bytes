
import { Memory, MemoryStats, Interaction } from "../types";

const STORAGE_KEY = "coremem_memories";
const INTERACTION_KEY = "coremem_interactions";

export const getStoredMemories = (): Memory[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveMemories = (memories: Memory[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
};

export const getStoredInteractions = (): Interaction[] => {
  const data = localStorage.getItem(INTERACTION_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveInteractions = (interactions: Interaction[]): void => {
  localStorage.setItem(INTERACTION_KEY, JSON.stringify(interactions));
};

export const calculateStats = (memories: Memory[]): MemoryStats => {
  const stats: MemoryStats = {
    totalMemories: memories.length,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    topEntities: [],
  };

  const entityMap: Record<string, number> = {};

  memories.forEach(m => {
    if (m.sentiment === 'positive') stats.positiveCount++;
    else if (m.sentiment === 'negative') stats.negativeCount++;
    else stats.neutralCount++;

    m.entities.forEach(e => {
      entityMap[e] = (entityMap[e] || 0) + 1;
    });
  });

  stats.topEntities = Object.entries(entityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return stats;
};
