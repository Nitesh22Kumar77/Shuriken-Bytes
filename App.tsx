
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as gemini from './services/geminiService';
import * as storage from './services/memoryStore';
import { Memory, MemoryStats, SearchResult, Interaction } from './types';
import MemoryCard from './components/MemoryCard';

// Using inline simple SVG icons
const Icons = {
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"/></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
};

const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStoring, setIsStoring] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'journal'>('explorer');

  useEffect(() => {
    setMemories(storage.getStoredMemories());
    setInteractions(storage.getStoredInteractions());
  }, []);

  const stats: MemoryStats = useMemo(() => storage.calculateStats(memories), [memories]);

  const handleStoreMemory = async () => {
    if (!inputText.trim() || isStoring) return;
    setIsStoring(true);
    
    try {
      const semantics = await gemini.extractSemantics(inputText);
      const newMemory: Memory = {
        id: crypto.randomUUID(),
        text: inputText,
        timestamp: new Date().toISOString(),
        entities: semantics.entities || [],
        actions: semantics.actions || [],
        namedEntities: semantics.namedEntities || [],
        sentiment: (semantics.sentiment as any) || 'neutral',
        sentimentScore: semantics.sentimentScore || 0,
        summary: semantics.summary || inputText.substring(0, 50),
      };

      const updated = [newMemory, ...memories];
      setMemories(updated);
      storage.saveMemories(updated);
      setInputText('');
    } catch (error) {
      console.error("Storage failed:", error);
      alert("Failed to analyze memory. Please check your API key.");
    } finally {
      setIsStoring(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setAiResponse(null);
    setSearchResults([]);

    try {
      const results = await gemini.queryMemories(searchQuery, memories);
      const matchedResults = results
        .map(res => {
          const m = memories.find(mem => mem.id === res.id);
          return m ? { memory: m, relevanceReason: res.reason, relevanceScore: res.score } : null;
        })
        .filter((r): r is SearchResult => r !== null)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      setSearchResults(matchedResults);

      if (matchedResults.length > 0) {
        const response = await gemini.generateIntelligentResponse(searchQuery, matchedResults.map(r => r.memory));
        setAiResponse(response);
        
        // Save to journal history
        const newInteraction: Interaction = {
          id: crypto.randomUUID(),
          query: searchQuery,
          response,
          timestamp: new Date().toISOString()
        };
        const updatedInteractions = [newInteraction, ...interactions];
        setInteractions(updatedInteractions);
        storage.saveInteractions(updatedInteractions);
      } else {
        setAiResponse("I couldn't find any memories related to that query.");
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    storage.saveMemories(updated);
    setSearchResults(prev => prev.filter(r => r.memory.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("Reset everything? All memories and journal entries will be deleted.")) {
      setMemories([]);
      setInteractions([]);
      storage.saveMemories([]);
      storage.saveInteractions([]);
      setSearchResults([]);
      setAiResponse(null);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Icons.Brain />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">CoreMem <span className="text-blue-400">AI</span></h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Semantic Personal Tool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'explorer' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              Explorer
            </button>
            <button 
              onClick={() => setActiveTab('journal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'journal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              Reflection Journal
            </button>
            <div className="w-px h-4 bg-slate-800 mx-2"></div>
            <button 
              onClick={handleClearAll}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Reset Data"
            >
              <Icons.Trash />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {activeTab === 'explorer' ? (
          <>
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 mb-1">Stored Memories</p>
                <p className="text-2xl font-bold">{stats.totalMemories}</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 mb-1">Sentiment Balance</p>
                <div className="flex items-end gap-1 h-8">
                  <div className="bg-green-500/40 w-full" style={{ height: `${(stats.positiveCount / (stats.totalMemories || 1)) * 100}%` }}></div>
                  <div className="bg-blue-500/40 w-full" style={{ height: `${(stats.neutralCount / (stats.totalMemories || 1)) * 100}%` }}></div>
                  <div className="bg-red-500/40 w-full" style={{ height: `${(stats.negativeCount / (stats.totalMemories || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="col-span-2 bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-400 mb-2">Core Entities</p>
                <div className="flex flex-wrap gap-2">
                  {stats.topEntities.length > 0 ? stats.topEntities.map((e, i) => (
                    <span key={i} className="text-[10px] font-mono bg-slate-700 px-2 py-1 rounded-md text-slate-200 uppercase tracking-tighter">
                      {e}
                    </span>
                  )) : <span className="text-xs text-slate-500 italic">Analysis pending</span>}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-8 items-start">
              {/* Sidebar Area */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl shadow-xl shadow-blue-500/5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-300 mb-4">
                    <Icons.Save />
                    Add Memory
                  </h2>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Capture a thought or event..."
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
                  />
                  <button
                    onClick={handleStoreMemory}
                    disabled={!inputText.trim() || isStoring}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                      isStoring 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                    }`}
                  >
                    {isStoring ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <><Icons.Zap />Remember</>
                    )}
                  </button>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl">
                  <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <Icons.Activity />
                    Recent Activity
                  </h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {memories.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-8 text-center">Empty history</p>
                    ) : (
                      memories.slice(0, 10).map(m => (
                        <div key={m.id} className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg group">
                          <p className="text-[10px] text-slate-500 font-mono mb-1">{new Date(m.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-300 line-clamp-2">{m.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Main Area */}
              <div className="md:col-span-3 space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <Icons.Search />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Recall something from your past..."
                    className="w-full bg-slate-800/50 border border-slate-700 pl-12 pr-4 py-4 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-3 top-3 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:bg-slate-700 transition-all"
                  >
                    {isSearching ? '...' : 'Recall'}
                  </button>
                </div>

                {aiResponse && (
                  <div className="bg-indigo-600/10 border-l-4 border-indigo-500 p-6 rounded-r-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Response</h3>
                    <p className="text-slate-100 leading-relaxed text-lg">{aiResponse}</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Source Context</h3>
                    <div className="grid gap-4">
                      {searchResults.map((result) => (
                        <MemoryCard
                          key={result.memory.id}
                          memory={result.memory}
                          onDelete={handleDeleteMemory}
                          relevanceReason={result.relevanceReason}
                          relevanceScore={result.relevanceScore}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                <Icons.Book />
                Reflection Journal
              </h2>
              <p className="text-slate-400 text-sm">Chronicle of your interactions and AI insights.</p>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-4 md:before:left-1/2 before:w-px before:bg-slate-800">
              {interactions.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <p className="text-slate-500">No entries yet. Perform a search in the Explorer to populate your journal.</p>
                </div>
              ) : (
                interactions.map((interaction, idx) => (
                  <div key={interaction.id} className={`relative flex items-start gap-8 md:flex-row flex-col ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Date marker */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10 w-4 h-4 bg-slate-900 border-4 border-indigo-500 rounded-full mt-6"></div>
                    
                    <div className="w-full md:w-1/2 pl-12 md:pl-0">
                      <div className={`p-6 rounded-3xl bg-slate-800/40 border border-slate-700 hover:border-indigo-500/50 transition-all ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                        <div className={`flex items-center gap-2 text-indigo-400 text-[10px] font-mono uppercase tracking-widest mb-3 ${idx % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                          <Icons.Clock />
                          {new Date(interaction.timestamp).toLocaleString()}
                        </div>
                        
                        <div className="space-y-4">
                          <div className="inline-block">
                            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-tighter">Query</p>
                            <p className="text-slate-200 font-medium italic">"{interaction.query}"</p>
                          </div>
                          
                          <div className="h-px bg-slate-700 w-full opacity-50"></div>
                          
                          <div>
                            <p className="text-xs text-indigo-400/80 font-semibold mb-2 uppercase tracking-tighter">AI Reflection</p>
                            <p className="text-slate-100 leading-relaxed text-base">
                              {interaction.response}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:block md:w-1/2"></div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em]">
          PERSONAL REFLECTION ENGINE &bull; COREMEM V3.2
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-top-4 { from { transform: translateY(-1rem); } to { transform: translateY(0); } }
        .animate-in { animation: fade-in 0.5s ease-out, slide-in-from-top-4 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
