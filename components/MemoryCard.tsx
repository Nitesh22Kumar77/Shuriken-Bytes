
import React from 'react';
import { Memory } from '../types';
import { Trash2, Calendar, Tag, Smile, Frown, Meh } from 'lucide-react';

interface Props {
  memory: Memory;
  onDelete: (id: string) => void;
  relevanceReason?: string;
  relevanceScore?: number;
}

export const MemoryCard: React.FC<Props> = ({ memory, onDelete, relevanceReason, relevanceScore }) => {
  const getSentimentIcon = () => {
    switch (memory.sentiment) {
      case 'positive': return <Smile className="w-4 h-4 text-green-400" />;
      case 'negative': return <Frown className="w-4 h-4 text-red-400" />;
      default: return <Meh className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Calendar className="w-3 h-3" />
          {new Date(memory.timestamp).toLocaleDateString()}
          <span className="mx-1">•</span>
          <div className="flex items-center gap-1">
            {getSentimentIcon()}
            <span className="capitalize">{memory.sentiment}</span>
          </div>
        </div>
        <button 
          onClick={() => onDelete(memory.id)}
          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-slate-200 text-sm leading-relaxed mb-4">{memory.text}</p>
      
      {relevanceReason && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Relevance Insight</p>
          <p className="text-sm text-blue-100">{relevanceReason}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {memory.entities.slice(0, 4).map((entity, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-md text-[10px] text-slate-300 font-mono">
            <Tag className="w-2 h-2" />
            {entity}
          </span>
        ))}
        {memory.namedEntities.slice(0, 2).map((ne, i) => (
          <span key={i} className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-md text-[10px] text-indigo-200 font-semibold">
            {ne.name}
          </span>
        ))}
      </div>
    </div>
  );
};

// Mock icons if lucide-react not available? No, assume available. 
// Standard icons from common icon library (lucide-react is very standard).
// Let's use simplified SVG icons instead for safety.
const LucideIcons = {
  Trash2: ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  ),
  Calendar: ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  Tag: ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  ),
  Smile: ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
  ),
  Frown: ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
  ),
  Meh: ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
  )
};

export default MemoryCard;
