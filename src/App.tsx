import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  Key, 
  Type as TypeIcon, 
  PenTool, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  TrendingUp,
  BrainCircuit,
  Eye,
  Settings,
  Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { geminiService } from './lib/gemini';
import { BlogState, INITIAL_STATE } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AGENTS = [
  { id: 'trends', name: 'Trend Finder', icon: TrendingUp, desc: 'Analyzing topic trends and audience' },
  { id: 'keywords', name: 'Keyword Analyzer', icon: Key, desc: 'Finding high-prestige keywords' },
  { id: 'titles', name: 'Title Generator', icon: TypeIcon, desc: 'Generating high-CTR headlines' },
  { id: 'writer', name: 'Content Writer', icon: PenTool, desc: 'Writing full-length humanized article' },
  { id: 'seo', name: 'SEO Optimizer', icon: BrainCircuit, desc: 'Optimizing for search engines' },
  { id: 'tracker', name: 'Performance Tracker', icon: BarChart3, desc: 'Estimating reach and growth' },
];

export default function App() {
  const [state, setState] = useState<BlogState>(INITIAL_STATE);
  const [inputTitle, setInputTitle] = useState('');
  const [titleCount, setTitleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.currentAgent]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const related = await geminiService.getRelatedTopics(inputTitle);
      setState(prev => ({ 
        ...prev, 
        title: inputTitle, 
        relatedTopics: related,
        currentAgent: -1 
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch related topics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTopic = (topic: string) => {
    setState(prev => ({ ...prev, topic, currentAgent: 0 }));
    runNextAgent(0, topic, state.title);
  };

  const runNextAgent = async (agentIdx: number, topic: string, originalTitle: string) => {
    setIsLoading(true);
    try {
      if (agentIdx === 0) { // Trend Finder
        const trends = await geminiService.runTrendFinder(originalTitle, topic);
        setState(prev => ({
          ...prev,
          agentData: { ...prev.agentData, trends },
          currentAgent: 1
        }));
        await runNextAgent(1, topic, originalTitle);
      } else if (agentIdx === 1) { // Keyword Analyzer
        const keywords = await geminiService.runKeywordAnalyzer(topic);
        setState(prev => ({
          ...prev,
          agentData: { ...prev.agentData, keywords },
          currentAgent: 2
        }));
        const titles = await geminiService.runTitleGenerator(topic, keywords.join(', '), titleCount);
        setState(prev => ({
          ...prev,
          agentData: { ...prev.agentData, titles },
          currentAgent: 2
        }));
      }
    } catch (err) {
      console.error(err);
      setError('Agent execution failed at ' + AGENTS[agentIdx].name);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFinalTitle = async (title: string) => {
    setState(prev => ({ 
      ...prev, 
      agentData: { ...prev.agentData, selectedTitle: title },
      currentAgent: 3 
    }));
    setIsLoading(true);
    try {
      // Content Writer
      const content = await geminiService.runContentWriter(
        title, 
        state.agentData.trends, 
        state.agentData.keywords.join(', ')
      );
      setState(prev => ({
        ...prev,
        agentData: { ...prev.agentData, content },
        currentAgent: 4
      }));

      // SEO Optimizer
      const seo = await geminiService.runSEOOptimizer(content);
      setState(prev => ({
        ...prev,
        agentData: { ...prev.agentData, seo },
        currentAgent: 5
      }));

      // Performance Tracker
      const performance = await geminiService.runPerformanceTracker(content, title);
      setState(prev => ({
        ...prev,
        agentData: { ...prev.agentData, performance },
        currentAgent: 6
      }));
    } catch (err) {
      setError('Content generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-300 pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-brand-accent shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Agentic Workflow v3.0</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {AGENTS.map((agent, i) => (
              <div key={agent.id} className={cn(
                "flex items-center gap-1 transition-colors",
                state.currentAgent >= i ? "text-brand-accent" : ""
              )}>
                <span className="hidden sm:inline">{agent.name}</span>
                {i < AGENTS.length - 1 && <span className="mx-2 opacity-20">/</span>}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-12">
        {/* Intro */}
        {state.title === '' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center mb-16 pt-20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-mono uppercase tracking-widest mb-8">
              <Sparkles className="w-3 h-3" />
              Next-Gen Editorial Engine
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 text-white">
              Deploy your <br />
              <span className="text-brand-accent italic">AI Newsroom.</span>
            </h1>
            
            <form onSubmit={handleInitialSubmit} className="relative mt-12 bg-brand-panel p-2 rounded-2xl border border-brand-border shadow-2xl">
              <input 
                type="text" 
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Initialize blog concept..."
                className="w-full h-14 pl-6 pr-16 bg-transparent text-white focus:outline-none text-lg font-medium"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-2 h-14 w-14 bg-brand-accent text-brand-bg rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <span>Output Intensity:</span>
              <div className="flex bg-brand-panel p-1 rounded-lg border border-brand-border">
                {[3, 5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTitleCount(count)}
                    className={cn(
                      "px-3 py-1 rounded-md transition-all",
                      titleCount === count ? "bg-brand-accent text-brand-bg shadow-lg" : "hover:text-slate-300"
                    )}
                  >
                    {count} HEADS
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Related Topics Selection */}
          {state.title !== '' && state.topic === '' && (
            <motion.div 
              key="topics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex flex-col items-center text-center">
                 <h2 className="text-lg font-mono uppercase tracking-[0.3em] text-slate-500 mb-4">Branch Analysis Complete</h2>
                 <h3 className="text-4xl font-bold text-white mb-12">Select Narrative Path</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.relatedTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => selectTopic(topic)}
                    className="p-8 text-left bg-brand-panel border border-brand-border rounded-2xl hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">PATH_{i.toString().padStart(2, '0')}</span>
                        <h4 className="font-bold text-xl text-white group-hover:text-brand-accent transition-colors">{topic}</h4>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all text-brand-accent -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Agent Workflow Display - Bento Style */}
          {state.topic !== '' && (
            <div className="grid grid-cols-12 gap-6 pb-24">
              {/* Header Status Box */}
              <div className="col-span-12 lg:col-span-8 bg-brand-panel border border-brand-border rounded-2xl p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
                  <h1 className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Active Operational Blueprint</h1>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                     <span className="text-[10px] text-brand-accent font-mono">PRIMARY_TARGET</span>
                     <h2 className="text-2xl font-bold text-white leading-tight">{state.topic}</h2>
                  </div>
                  <div className="flex items-center gap-3 bg-brand-bg/50 border border-brand-border rounded-xl px-4 py-3">
                     <div className="text-right">
                       <div className="text-[9px] text-slate-500 uppercase font-mono">Agent Sync</div>
                       <div className="text-sm font-bold text-emerald-400 font-mono">98.2% ONLINE</div>
                     </div>
                     <Settings className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Status / Trackers */}
              <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
                <div className="bg-brand-panel border border-brand-border rounded-2xl p-6 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">SEO Core</div>
                  <div className="text-4xl font-black text-white">{state.agentData.seo.score || '--'}<span className="text-xs text-slate-600">/100</span></div>
                  <div className="text-[9px] text-brand-accent font-mono">VULNERABILITY: 0</div>
                </div>
                <div className="bg-brand-panel border border-brand-border rounded-2xl p-6 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Est. Reach</div>
                  <div className="text-2xl font-black text-white">{state.agentData.performance.reach || 'PENDING'}</div>
                  <div className="text-[9px] text-emerald-400 font-mono">MEDIUM OPTIMIZED</div>
                </div>
              </div>

              {/* Sidebar Agent Log */}
              <div className="col-span-12 lg:col-span-4 space-y-6 order-2 lg:order-1">
                 {AGENTS.slice(0, 3).map((agent, i) => {
                    const isActive = state.currentAgent === i;
                    const isCompleted = state.currentAgent > i;
                    const hasOutput = (i === 0 && state.agentData.trends) || (i === 1 && state.agentData.keywords.length > 0) || (i === 2 && state.agentData.titles.length > 0);

                    if (!isActive && !isCompleted && !hasOutput) return null;

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={agent.id}
                        className={cn(
                          "bg-brand-panel border rounded-2xl p-5 transition-all overflow-hidden",
                          isActive ? "border-brand-accent/50 bg-brand-accent/5" : "border-brand-border"
                        )}
                      >
                         <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">{agent.name}</h3>
                            <span className="text-[9px] text-slate-500 font-mono">AGENT_0{i+1}</span>
                         </div>

                         {isActive && isLoading && (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-brand-accent uppercase animate-pulse mb-4">
                               <Loader2 className="w-3 h-3 animate-spin" />
                               Analyzing Clusters...
                            </div>
                         )}

                         <div className="space-y-4">
                            {agent.id === 'trends' && state.agentData.trends && (
                               <div className="bg-brand-sub border border-brand-border-alt rounded-xl p-3 text-[11px] font-mono text-slate-400 h-32 overflow-y-auto custom-scrollbar leading-relaxed">
                                  {state.agentData.trends}
                               </div>
                            )}
                            {agent.id === 'keywords' && state.agentData.keywords.length > 0 && (
                               <div className="grid grid-cols-2 gap-2">
                                  {state.agentData.keywords.map((kw, idx) => (
                                     <div key={idx} className="bg-brand-sub border border-brand-border-alt rounded px-2 py-1 text-[11px] font-mono text-slate-500 truncate">
                                        {kw}
                                     </div>
                                  ))}
                               </div>
                            )}
                            {agent.id === 'titles' && state.agentData.titles.length > 0 && !state.agentData.selectedTitle && (
                               <div className="space-y-2">
                                  {state.agentData.titles.map((t, idx) => (
                                     <button
                                       key={idx}
                                       onClick={() => selectFinalTitle(t)}
                                       className="w-full p-3 text-left border border-brand-border hover:border-brand-accent/50 rounded-xl bg-brand-bg text-[12px] font-medium text-slate-300 hover:text-white hover:bg-brand-accent/5 transition-all"
                                     >
                                        {t}
                                     </button>
                                  ))}
                               </div>
                            )}
                            {state.agentData.selectedTitle && agent.id === 'titles' && (
                               <div className="p-3 border border-brand-accent/50 bg-brand-accent/10 rounded-xl">
                                  <div className="text-[9px] text-brand-accent font-mono uppercase mb-1">Selected Focus</div>
                                  <div className="text-[13px] font-bold text-white tracking-tight">{state.agentData.selectedTitle}</div>
                               </div>
                            )}
                         </div>
                      </motion.div>
                    )
                 })}
              </div>

              {/* Main Writing Area */}
              <div className="col-span-12 lg:col-span-8 order-1 lg:order-2">
                 <div className="grid grid-cols-1 gap-6 h-full">
                    <div className="bg-brand-panel border border-brand-border rounded-2xl p-8 h-full flex flex-col relative overflow-hidden min-h-[600px]">
                       <div className="absolute top-0 right-0 p-6 flex items-center gap-6">
                           {state.agentData.content && (
                             <div className="text-right hidden sm:block">
                               <div className="text-[9px] text-slate-500 uppercase font-mono">Quality Assurance</div>
                               <div className="text-xs text-emerald-400 font-bold font-mono">98.4% HUMAN_FEEL</div>
                             </div>
                           )}
                           <div className="w-12 h-12 rounded-full border-2 border-brand-accent/20 flex items-center justify-center bg-brand-accent/5">
                             <PenTool className="w-5 h-5 text-brand-accent" />
                           </div>
                       </div>

                       <div className="mb-8">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest italic">Live Content Stream</h3>
                         </div>
                         <h2 className="text-3xl font-black text-white tracking-tighter leading-none">
                            {state.agentData.selectedTitle || 'Draft Initialization...'}
                         </h2>
                       </div>

                       <div className="flex-1 bg-brand-bg/50 border border-brand-border rounded-xl p-8 font-serif text-slate-400 text-base leading-relaxed overflow-y-auto custom-scrollbar">
                         {isLoading && state.currentAgent === 3 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                               <div className="w-12 h-12 border-2 border-brand-border border-t-brand-accent rounded-full animate-spin" />
                               <div className="text-xs font-mono uppercase tracking-[0.2em]">Crafting 1,400 words with emotional depth...</div>
                            </div>
                         ) : state.agentData.content ? (
                            <div className="markdown-body">
                               <ReactMarkdown>{state.agentData.content}</ReactMarkdown>
                            </div>
                         ) : (
                            <div className="h-full flex items-center justify-center text-slate-700 font-mono text-sm tracking-widest text-center px-12 italic">
                               Systems waiting for title selection and cluster synchronization...
                            </div>
                         )}
                       </div>
                    </div>

                    {/* SEO & Performance Footer Boxes */}
                    {state.agentData.seo.tags.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-brand-panel border border-brand-border rounded-2xl p-6">
                            <div className="flex justify-between mb-4">
                               <h3 className="text-[10px] font-mono uppercase text-slate-500">SEO Infiltration Tags</h3>
                               <Settings className="w-3 h-3 text-slate-500" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {state.agentData.seo.tags.map((tag, idx) => (
                                  <span key={idx} className="bg-brand-sub border border-brand-border-alt px-2 py-1 rounded-md text-[10px] font-mono text-slate-400">
                                     #{tag.replace(/\s+/g, '_').toLowerCase()}
                                  </span>
                               ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-brand-border">
                               <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Generated Meta</p>
                               <p className="text-[11px] leading-tight text-slate-400">{state.agentData.seo.description}</p>
                            </div>
                         </div>
                         <div className="bg-[#141414] border border-emerald-500/20 rounded-2xl p-6">
                            <div className="flex justify-between mb-4">
                               <h3 className="text-[10px] font-mono uppercase text-emerald-500-alt tracking-widest">Growth Blueprint</h3>
                               <Share2 className="w-3 h-3 text-emerald-500" />
                            </div>
                            <div className="h-40 overflow-y-auto custom-scrollbar">
                               <p className="text-[11px] font-mono text-emerald-400/60 leading-relaxed whitespace-pre-wrap">
                                  {state.agentData.performance.guide}
                               </p>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} className="h-10" />

        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-950/80 border border-red-500/50 text-red-200 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.2)] backdrop-blur-md font-bold flex items-center gap-2 z-50">
            <span className="text-xs uppercase font-mono tracking-widest text-red-500">Error:</span>
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 hover:text-white transition-colors">×</button>
          </div>
        )}
      </main>

      {/* Footer Nav Bar */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-[100]">
        <div className="max-w-screen-xl mx-auto flex justify-end">
           <button 
             onClick={() => window.location.reload()}
             className="pointer-events-auto bg-brand-accent text-brand-bg h-12 px-6 rounded-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-bold shadow-[0_0_30px_rgba(6,182,212,0.3)] group"
           >
             <Sparkles className="w-4 h-4" />
             <span className="text-sm uppercase tracking-widest">Reset Core</span>
             <Settings className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
        </div>
      </footer>
    </div>
  );
}
