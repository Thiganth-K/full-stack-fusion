import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FolderOpen, FileCode2, Plus, Terminal, Trash2, Save, X, Network, ChevronRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CodeShare() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [snippets, setSnippets] = useState<any[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | false>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLanguage, setNewLanguage] = useState('javascript');
  const [newParentId, setNewParentId] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const [editingCode, setEditingCode] = useState<{ [id: string]: string }>({});
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        const res = await fetch('/api/snippets', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSnippets(data);
          if (data.length > 0 && !activeSnippetId) {
            setActiveSnippetId(data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch snippets', err);
      }
    };

    fetchSnippets();

    if (socket) {
      socket.on('new-snippet', (snippet) => {
        setSnippets(prev => [snippet, ...prev]);
        if (!activeSnippetId) {
            setActiveSnippetId(snippet._id);
        }
      });

      socket.on('snippet-updated', (updatedSnippet) => {
        setSnippets(prev => prev.map(s => s._id === updatedSnippet._id ? updatedSnippet : s));
        setEditingCode(prev => {
            const copy = { ...prev };
            delete copy[updatedSnippet._id]; // Clear local edit state so it pulls fresh from server
            return copy;
        });
      });

      socket.on('snippet-deleted', (id) => {
        setSnippets(prev => prev.filter(s => s._id !== id && s.parentId !== id));
        if (activeSnippetId === id) {
          setActiveSnippetId(null);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new-snippet');
        socket.off('snippet-updated');
        socket.off('snippet-deleted');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]); // We don't want activeSnippetId in dep array here for event listeners to work properly without rebinding

  const handleCreateSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !socket || !isAdmin) return;

    socket.emit('create-snippet', {
      title: newTitle.trim(),
      language: isCreating === 'folder' ? 'folder' : newLanguage,
      code: isCreating === 'folder' ? '' : '// Start typing your code here in the upside down...\n',
      type: isCreating === 'folder' ? 'folder' : 'file',
      parentId: newParentId || null
    });

    setNewTitle('');
    setIsCreating(false);
  };

  const handleSaveSnippet = (id: string) => {
    if (!socket || !isAdmin || editingCode[id] === undefined) return;
    socket.emit('update-snippet', { id, code: editingCode[id] });
  };

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!socket || !isAdmin) return;
    if (window.confirm('Delete this snippet forever?')) {
      socket.emit('delete-snippet', id);
    }
  };

  const activeSnippet = snippets.find(s => s._id === activeSnippetId) || null;
  const currentCode = activeSnippet ? (editingCode[activeSnippet._id] !== undefined ? editingCode[activeSnippet._id] : activeSnippet.code) : '';

  const handleCopyCode = () => {
    if (activeSnippet) {
      const codeToCopy = editingCode[activeSnippet._id] !== undefined ? editingCode[activeSnippet._id] : activeSnippet.code;
      if (codeToCopy) {
        navigator.clipboard.writeText(codeToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Helper to build tree
  const buildTree = (items: any[], parentId: string | null = null) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item._id)
      }));
  };

  const fileTree = buildTree(snippets);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
    setActiveSnippetId(folderId);
  };

  const renderTree = (items: any[], level = 0) => {
    if (items.length === 0 && level === 0) {
      return (
        <div className="text-center text-cinematic-muted text-sm py-8 px-4">
          Directory empty. No files found in this dimension.
        </div>
      );
    }
    
    return items.map(item => {
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders.has(item._id);
      const isActive = activeSnippetId === item._id;

      return (
        <div key={item._id}>
          <button
            onClick={(e) => isFolder ? toggleFolder(item._id, e) : setActiveSnippetId(item._id)}
            style={{ paddingLeft: `${(level + 1) * 0.75}rem` }}
            className={`w-full flex items-center justify-between py-2.5 pr-3 rounded-lg text-left transition-all duration-200 group ${
              isActive 
                ? 'bg-st-red/10 border border-st-red/30 shadow-[inset_3px_0_0_rgb(219,0,0)]' 
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {isFolder ? (
                <div className="flex items-center gap-1">
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-white' : 'text-cinematic-muted'}`} />
                  <FolderOpen className={`w-4 h-4 shrink-0 ${isExpanded ? 'text-st-red' : 'text-st-red/70'}`} />
                </div>
              ) : (
                <FileCode2 className={`ml-[20px] w-3.5 h-3.5 shrink-0 ${isActive ? 'text-st-red/80' : 'text-cinematic-muted'}`} />
              )}
              <div className="truncate">
                <div className={`text-sm tracking-wide truncate ${isActive ? 'text-white font-medium' : 'text-white/70 group-hover:text-white/90'}`}>
                  {item.title}
                </div>
              </div>
            </div>
            {isAdmin && (
              <div 
                onClick={(e) => handleDeleteSnippet(item._id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-st-red hover:text-white text-cinematic-muted rounded-md transition-all shrink-0 z-20"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
          
          {/* Render Children if Folder is Expanded */}
          {isFolder && isExpanded && item.children.length > 0 && (
             <div className="mt-1 space-y-0.5 relative">
               {/* Indent Guide */}
               <div className="absolute left-[0.95rem] top-0 bottom-0 w-px bg-white/10 ml-3"></div>
               {renderTree(item.children, level + 1)}
             </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-cinematic-bg text-white overflow-x-hidden flex flex-col pt-24 pb-12 px-4 md:px-8 lg:px-16">
      
      {/* Background layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none opacity-40"
        style={{ backgroundImage: `url('/hero.png')` }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/95 via-black/90 to-black/95 pointer-events-none" />

      <header className="relative z-10 mb-8 flex items-end justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
             <Network className="w-8 h-8 text-st-red drop-shadow-[0_0_10px_rgba(219,0,0,0.8)]" />
             <h1 className="text-4xl lg:text-5xl font-bebas tracking-widest text-white shadow-st-red drop-shadow-[0_0_8px_rgba(219,0,0,0.4)]">
                Hawkins Code Lab
             </h1>
          </div>
          <p className="text-cinematic-muted text-sm tracking-wide">Secure transmission channels for sharing classified algorithms.</p>
        </motion.div>
      </header>

      {/* Main App Layout */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-6 min-h-[calc(100vh-220px)] md:h-[calc(100vh-220px)] overflow-visible md:overflow-hidden">
        
        {/* Left Sidebar - File Explorer */}
        <div className="w-full md:w-64 lg:w-80 shrink-0 flex flex-col bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          
          <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between z-10">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white/70">
              <FolderOpen className="w-4 h-4 text-st-red" />
              Project Files
            </h3>
            {isAdmin && (
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                     setIsCreating('folder');
                     const active = snippets.find(s => s._id === activeSnippetId);
                     setNewParentId(active?.type === 'folder' ? active._id : (active?.parentId || ''));
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  title="New Folder"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                     setIsCreating('file');
                     const active = snippets.find(s => s._id === activeSnippetId);
                     setNewParentId(active?.type === 'folder' ? active._id : (active?.parentId || ''));
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  title="New File"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <AnimatePresence>
              {isCreating && isAdmin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 p-3 bg-white/5 rounded-xl border border-st-red/30 shadow-[0_0_10px_rgba(219,0,0,0.1)]"
                >
                  <div className="text-[10px] text-st-red font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
                     Create New {isCreating}
                     <button onClick={() => setIsCreating(false)} className="text-white/50 hover:text-white"><X className="w-3 h-3"/></button>
                  </div>
                  <form onSubmit={handleCreateSnippet} className="space-y-3">
                    <input 
                      autoFocus
                      type="text"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-st-red/50 focus:ring-1 focus:ring-st-red/50"
                      placeholder={isCreating === 'folder' ? 'Folder Name' : 'filename.js'}
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                    />
                    {isCreating === 'file' && (
                      <select 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-st-red/50"
                        value={newLanguage}
                        onChange={e => setNewLanguage(e.target.value)}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="text">Text/Message</option>
                      </select>
                    )}
                    <select 
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-cinematic-muted focus:outline-none focus:border-st-red/50"
                      value={newParentId}
                      onChange={e => setNewParentId(e.target.value)}
                    >
                      <option value="">Root Directory</option>
                      {snippets.filter(s => s.type === 'folder').map(f => (
                         <option key={f._id} value={f._id}> inside {f.title}</option>
                      ))}
                    </select>
                    <button type="submit" className="w-full bg-st-red text-white text-xs py-2 rounded-lg font-bold uppercase tracking-wider block">Create</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1 mt-1 font-mono text-sm max-h-full">
               {renderTree(fileTree)}
            </div>
          </div>
        </div>

        {/* Right Area - Code Editor / Viewer */}
        <div className="flex-1 flex flex-col bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] relative">
          
          {/* Editor Header */}
          <div className="h-12 border-b border-white/10 bg-[#151515] flex items-center justify-between px-4 z-10 shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
              </div>
              
              {activeSnippet && (
                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-md border border-white/5">
                  {activeSnippet.type === 'folder' ? <FolderOpen className="w-3.5 h-3.5 text-st-red" /> : <Terminal className="w-3.5 h-3.5 text-cinematic-muted" />}
                  <span className="text-xs font-mono text-white/90">{activeSnippet.title}</span>
                  {activeSnippet.type !== 'folder' && currentCode && (
                    <span className="text-[10px] text-cinematic-muted ml-1 border-l border-white/10 pl-2">
                      {currentCode.split('\n').length} lines
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeSnippet && activeSnippet.type !== 'folder' && (
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-cinematic-muted text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 hover:text-white transition-all border border-white/10"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
              {activeSnippet && isAdmin && (
                <button
                  onClick={() => handleSaveSnippet(activeSnippet._id)}
                  disabled={editingCode[activeSnippet._id] === undefined || editingCode[activeSnippet._id] === activeSnippet.code}
                  className="flex items-center gap-2 px-4 py-1.5 bg-st-red text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-st-dark-red transition-all shadow-[0_0_10px_rgba(219,0,0,0.3)] hover:shadow-[0_0_15px_rgba(219,0,0,0.5)] disabled:opacity-40 disabled:hover:bg-st-red disabled:hover:shadow-[0_0_10px_rgba(219,0,0,0.3)]"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              )}
              {activeSnippet && !isAdmin && (
                <span className="text-xs font-bold uppercase tracking-wider bg-white/10 text-cinematic-muted px-3 py-1 rounded-full border border-white/10">Read Only</span>
              )}
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 relative overflow-hidden group">
            {/* Subtle red glow in the corner to give Stranger Things vibe */}
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-st-red/5 rounded-full blur-[100px] pointer-events-none transition-all duration-1000"></div>

            {!activeSnippet ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-cinematic-muted p-6 text-center">
                 <Terminal className="w-16 h-16 animate-pulse opacity-20 mb-4" />
                 <p className="text-xl font-mono tracking-widest text-white/50">NO_SIGNAL_RECEIVED</p>
                 <p className="text-sm max-w-sm mt-3 border border-dashed border-white/10 p-4 rounded-xl bg-black/40">Select a file from the directory to establish connection, or wait for an admin broadcast.</p>
              </div>
            ) : activeSnippet?.type === 'folder' ? (
              /* Folder Contents View */
              <div className="absolute inset-0 overflow-y-auto p-6 custom-scrollbar">
                <div className="flex items-center gap-2 mb-5">
                  <FolderOpen className="w-5 h-5 text-st-red" />
                  <h3 className="text-lg font-bold tracking-wider text-white uppercase">{activeSnippet.title}</h3>
                  <span className="text-xs text-cinematic-muted ml-1">
                    — {snippets.filter(s => s.parentId === activeSnippet._id).length} items
                  </span>
                </div>
                {snippets.filter(s => s.parentId === activeSnippet._id).length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-cinematic-muted py-16 text-center">
                    <FolderOpen className="w-12 h-12 opacity-15 mb-3" />
                    <p className="text-sm">This folder is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {snippets.filter(s => s.parentId === activeSnippet._id).map(item => {
                      const lineCount = item.type === 'file' && item.code ? item.code.split('\n').length : 0;
                      const childCount = item.type === 'folder' ? snippets.filter(s => s.parentId === item._id).length : 0;
                      return (
                        <button
                          key={item._id}
                          onClick={() => {
                            if (item.type === 'folder') {
                              setExpandedFolders(prev => {
                                const next = new Set(prev);
                                next.add(item._id);
                                return next;
                              });
                            }
                            setActiveSnippetId(item._id);
                          }}
                          className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-st-red/30 rounded-xl px-5 py-4 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            {item.type === 'folder' ? (
                              <FolderOpen className="w-5 h-5 text-st-red" />
                            ) : (
                              <FileCode2 className="w-5 h-5 text-cinematic-muted group-hover:text-st-red/70 transition-colors" />
                            )}
                            <div className="text-left">
                              <div className="text-sm font-medium text-white group-hover:text-white tracking-wide">{item.title}</div>
                              <div className="text-[10px] text-cinematic-muted uppercase tracking-widest mt-0.5">
                                {item.type === 'folder' ? `${childCount} items` : item.language}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {item.type === 'file' && (
                              <span className="text-[10px] text-cinematic-muted uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-cinematic-muted group-hover:text-white transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
               <div className="absolute inset-0 flex">
                  {/* Line Numbers - only for admins or structured files, let's keep it visible for both since code share is still code */}
                  
                  {isAdmin ? (
                    // Admin View: Raw code textarea Editor
                    <>
                      <div className="w-12 shrink-0 bg-[#0a0a0a] border-r border-white/5 py-4 flex flex-col items-end px-3 select-none text-xs font-mono text-cinematic-muted/50 overflow-hidden">
                        {Array.from({ length: (currentCode.match(/\n/g) || []).length + Math.max(20, (currentCode.match(/\n/g) || []).length + 5) }).map((_, i) => (
                          <div key={i} className="leading-[1.6]">{i + 1}</div>
                        ))}
                      </div>
                      
                      <textarea
                        value={currentCode}
                        onChange={(e) => {
                          setEditingCode(prev => ({
                            ...prev,
                            [activeSnippet._id]: e.target.value
                          }));
                        }}
                        spellCheck={false}
                        className="flex-1 bg-transparent p-4 w-full h-full resize-none outline-none font-mono text-sm leading-[1.6] transition-colors focus:bg-white/5 text-green-400"
                        style={{ tabSize: 2 }}
                      />
                    </>
                  ) : (
                    // Participant View: Admin name at top + full scrollable code container
                    <div className="flex-1 w-full h-full flex flex-col bg-[#0a0a0a] overflow-hidden">
                        {/* Admin Name Header */}
                        <div className="shrink-0 px-6 py-3 border-b border-white/10 bg-[#111]/80 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black border border-st-red/40 flex items-center justify-center font-bold text-st-red text-sm shadow-[0_0_10px_rgba(219,0,0,0.3)]">
                              {activeSnippet.author?.name?.substring(0, 1).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <span className="text-xs text-st-red font-bold uppercase tracking-widest">
                                {activeSnippet.author?.name || 'Administrator'} • Broadcast
                              </span>
                              <span className="text-[10px] text-white/30 ml-3">
                                {new Date(activeSnippet.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Full Scrollable Code Container */}
                        <div className="flex-1 flex overflow-hidden min-h-0">
                          {/* Line Numbers */}
                          <div className="w-12 shrink-0 bg-[#0a0a0a] border-r border-white/5 py-4 flex flex-col items-end px-3 select-none text-xs font-mono text-cinematic-muted/50 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                            {currentCode.split('\n').map((_: string, i: number) => (
                              <div key={i} className="leading-[1.6]">{i + 1}</div>
                            ))}
                          </div>

                          {/* Code Content - Scrollable */}
                          <div className="flex-1 overflow-auto custom-scrollbar p-4">
                            <pre className="font-mono text-sm text-green-400 whitespace-pre leading-[1.6] min-h-full">
                              {currentCode || <span className="text-white/20 italic">Empty transmission...</span>}
                            </pre>
                          </div>
                        </div>
                    </div>
                  )}
               </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="h-8 border-t border-white/10 bg-[#111] flex flex-wrap items-center justify-between px-4 text-[10px] uppercase font-bold tracking-widest text-cinematic-muted z-10">
            <div className="flex gap-4">
              <span>{activeSnippet ? (activeSnippet.type === 'folder' ? 'folder' : activeSnippet.language) : 'No connection'}</span>
              {activeSnippet && activeSnippet.type !== 'folder' && currentCode && (
                <span>Ln {currentCode.split('\n').length}</span>
              )}
              {activeSnippet && <span>UTF-8</span>}
            </div>
            {isAdmin && <span className="text-st-red animate-pulse flex items-center gap-1.5"><div className="w-2 h-2 bg-st-red rounded-full shadow-[0_0_5px_rgba(219,0,0,0.8)]"></div> Admin Mode Active</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
