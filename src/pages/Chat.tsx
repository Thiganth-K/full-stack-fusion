import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Plus, X, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Chat() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch('/api/topics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTopics(data);
          // Default to "General" topic
          const general = data.find((t: any) => t.name === 'General');
          if (general && !selectedTopicId) {
            setSelectedTopicId(general._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch topics', err);
      }
    };
    fetchTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch messages when selected topic changes
  useEffect(() => {
    if (!selectedTopicId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?topicId=${selectedTopicId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          setMessages(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    fetchMessages();
  }, [selectedTopicId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: any) => {
      // Only add if the message is for the currently selected topic
      if (message.topic === selectedTopicId || (!message.topic && !selectedTopicId)) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleNewTopic = (topic: any) => {
      setTopics(prev => [...prev, topic]);
    };

    const handleTopicDeleted = (topicId: string) => {
      setTopics(prev => prev.filter(t => t._id !== topicId));
      if (selectedTopicId === topicId) {
        // Fall back to General
        const general = topics.find(t => t.name === 'General');
        setSelectedTopicId(general?._id || null);
      }
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('new-topic', handleNewTopic);
    socket.on('topic-deleted', handleTopicDeleted);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('new-topic', handleNewTopic);
      socket.off('topic-deleted', handleTopicDeleted);
    };
  }, [socket, selectedTopicId, topics]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isCreatingTopic && topicInputRef.current) {
      topicInputRef.current.focus();
    }
  }, [isCreatingTopic]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !selectedTopicId) return;

    socket.emit('send-message', { content: input.trim(), topicId: selectedTopicId });
    setInput('');
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !socket) return;
    socket.emit('create-topic', newTopicName.trim());
    setNewTopicName('');
    setIsCreatingTopic(false);
  };

  const handleDeleteTopic = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!socket) return;
    const topic = topics.find(t => t._id === topicId);
    if (topic?.name === 'General') return;
    if (window.confirm(`Delete topic "${topic?.name}" and all its messages? This cannot be undone.`)) {
      socket.emit('delete-topic', topicId);
    }
  };

  const selectedTopic = topics.find(t => t._id === selectedTopicId);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-black font-sans">
      {/* ===== FULL BACKGROUND CHARACTER IMAGES ===== */}

      {/* Steve - Left Side Background */}
      <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none z-0 overflow-hidden">
        <img
          src="/steve.png"
          alt="Steve"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-40"
          style={{ objectPosition: '50% 20%' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/30 via-black/60 to-black"></div>
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/70"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-st-red/10 to-transparent"></div>
      </div>

      {/* Dustin - Right Side Background */}
      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none z-0 overflow-hidden">
        <img
          src="/dustin.png"
          alt="Dustin"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-40"
          style={{ objectPosition: '50% 20%' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-linear-to-l from-black/30 via-black/60 to-black"></div>
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/70"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/3 bg-linear-to-t from-st-red/10 to-transparent"></div>
      </div>

      {/* Center divider glow line */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-linear-to-b from-transparent via-st-red/20 to-transparent pointer-events-none z-1"></div>

      {/* ===== AMBIENT EFFECTS ===== */}
      <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(219,0,0,0.06)_0%,transparent_60%)]"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-st-red/30 rounded-full blur-[2px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-st-red/20 rounded-full blur-[3px] animate-[pulse_3s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 bg-st-red/40 rounded-full blur-[1px] animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-st-red/25 rounded-full blur-[2px] animate-[pulse_5s_ease-in-out_infinite]"></div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 flex flex-col w-full h-full max-w-5xl mx-auto p-4 md:p-6 pt-20 md:pt-24">
        <header className="mb-3 md:mb-4 text-center select-none shrink-0">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl tracking-wider text-st-red drop-shadow-[0_0_15px_rgba(219,0,0,0.8)]" 
            style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", sans-serif)' }}
          >
            THE UPSIDE DOWN CHAT
          </h1>
          <p className="text-xs md:text-sm lg:text-base text-cinematic-muted mt-2 md:mt-3 font-light tracking-wide italic">
            "Friends don't lie. But they do talk." - Eleven
          </p>
        </header>

        {/* Topic Selector Bar */}
        <div className="shrink-0 mb-3 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {topics.map(topic => (
            <button
              key={topic._id}
              onClick={() => setSelectedTopicId(topic._id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border group relative shrink-0",
                selectedTopicId === topic._id
                  ? "bg-st-red text-white border-st-red shadow-[0_0_15px_rgba(219,0,0,0.4)]"
                  : "bg-black/60 text-cinematic-muted border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 backdrop-blur-md"
              )}
            >
              <Hash className="w-3 h-3" />
              {topic.name}
              {isAdmin && topic.name !== 'General' && (
                <span
                  onClick={(e) => handleDeleteTopic(topic._id, e)}
                  className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Topic"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}

          {/* Admin: Create new topic */}
          {isAdmin && (
            <AnimatePresence>
              {isCreatingTopic ? (
                <motion.form
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  onSubmit={handleCreateTopic}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <input
                    ref={topicInputRef}
                    type="text"
                    value={newTopicName}
                    onChange={e => setNewTopicName(e.target.value)}
                    placeholder="Topic name..."
                    className="bg-black/80 border border-st-red/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-st-red/50 w-32"
                    onKeyDown={e => { if (e.key === 'Escape') setIsCreatingTopic(false); }}
                  />
                  <button
                    type="submit"
                    disabled={!newTopicName.trim()}
                    className="bg-st-red text-white p-2 rounded-xl text-xs disabled:opacity-40 hover:bg-st-dark-red transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCreatingTopic(false); setNewTopicName(''); }}
                    className="text-cinematic-muted hover:text-white p-2 rounded-xl transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.form>
              ) : (
                <button
                  onClick={() => setIsCreatingTopic(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-cinematic-muted border border-dashed border-white/20 hover:border-st-red/50 hover:text-st-red transition-all bg-black/40 backdrop-blur-md whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Topic
                </button>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 w-full bg-black/70 backdrop-blur-2xl border border-cinematic-border/20 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_40px_rgba(219,0,0,0.12),0_0_80px_rgba(0,0,0,0.8)] relative min-h-0">
          {/* Top edge glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-st-red/50 to-transparent blur-[1px]"></div>
          {/* Bottom edge glow */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-st-red/30 to-transparent blur-[1px]"></div>

          {/* Topic Header */}
          {selectedTopic && (
            <div className="px-4 py-2.5 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center gap-2">
              <Hash className="w-4 h-4 text-st-red" />
              <span className="text-sm font-bold tracking-wider text-white uppercase">{selectedTopic.name}</span>
              <span className="text-[10px] text-cinematic-muted ml-1">— {messages.length} messages</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-st-red/50 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-cinematic-muted gap-4">
                <div className="text-st-red/50 animate-pulse font-bebas tracking-widest text-xl md:text-2xl text-center px-4">WAITING FOR TRANSMISSION...</div>
                <p className="text-xs md:text-sm">No messages yet in #{selectedTopic?.name || 'this channel'}. Emit the first signal.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender._id === user?._id || msg.sender._id === user?.id;
                const showName = idx === 0 || messages[idx - 1].sender._id !== msg.sender._id;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.3 }}
                    key={msg._id || idx} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                  >
                    {showName && (
                      <span className={cn(
                        "text-[10px] md:text-xs mb-1.5 flex items-center uppercase tracking-widest font-semibold",
                        isMe ? "text-st-red/80 mr-1" : "text-gray-400 ml-1"
                      )}>
                        {msg.sender.name} <span className="opacity-60 ml-1">({msg.sender.role || 'user'})</span>
                      </span>
                    )}
                    
                    <div 
                      className={cn(
                        "max-w-[85%] md:max-w-[75%] px-4 py-2.5 md:px-5 md:py-3 rounded-2xl text-xs md:text-sm leading-relaxed backdrop-blur-md shadow-sm relative overflow-hidden transition-all duration-300",
                        isMe 
                          ? "bg-linear-to-br from-st-red to-st-dark-red text-white rounded-tr-sm shadow-[0_4px_15px_rgba(219,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(219,0,0,0.5)]" 
                          : "bg-[#111]/80 border border-[#222] text-gray-200 rounded-tl-sm hover:border-cinematic-border/30"
                      )}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 md:p-5 border-t border-cinematic-border/20 bg-black/80 backdrop-blur-xl rounded-b-2xl relative z-10">
            <form onSubmit={sendMessage} className="flex gap-2 md:gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message #${selectedTopic?.name || 'chat'}...`}
                className="flex-1 bg-[#111] border border-[#222] hover:border-cinematic-border/50 focus:border-st-red rounded-xl px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm text-white focus:outline-none focus:ring-1 focus:ring-st-red/50 transition-all duration-300 font-medium placeholder:text-gray-600"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-st-red text-white p-3 md:p-4 rounded-xl hover:bg-[#ff0a16] shadow-[0_0_15px_rgba(219,0,0,0.3)] hover:shadow-[0_0_25px_rgba(219,0,0,0.6)] focus:scale-95 transition-all duration-300 disabled:opacity-40 disabled:hover:bg-st-red disabled:hover:shadow-none flex items-center justify-center shrink-0 group"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
