
export interface Memory {
  id: string;
  text: string;
  entities: string[];
  actions: string[];
  namedEntities: { name: string; type: string }[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  summary: string;
  timestamp: string;
}

export interface Interaction {
  id: string;
  query: string;
  response: string;
  timestamp: string;
}

export interface MemoryStats {
  totalMemories: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topEntities: string[];
}

export interface SearchResult {
  memory: Memory;
  relevanceReason: string;
  relevanceScore: number;
}
