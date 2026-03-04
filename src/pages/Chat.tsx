import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Chat() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages', {
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

    if (socket) {
      socket.on('receive-message', (message) => {
        setMessages(prev => [...prev, message]);
      });
    }

    return () => {
      if (socket) {
        socket.off('receive-message');
      }
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('send-message', input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Workshop Chat</h1>
        <p className="text-sm text-cinematic-muted">Discuss with other participants.</p>
      </header>

      <div className="flex-1 bg-cinematic-surface border border-cinematic-border rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-cinematic-muted text-sm">
              No messages yet. Be the first to say hi.
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender._id === user?._id || msg.sender._id === user?.id;
              const showName = idx === 0 || messages[idx - 1].sender._id !== msg.sender._id;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg._id || idx} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {showName && !isMe && (
                    <span className="text-xs text-cinematic-muted mb-1 ml-1 flex items-center gap-2">
                      {msg.sender.name}
                      {msg.sender.role === 'admin' && (
                        <span className="bg-white/10 text-white px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">Admin</span>
                      )}
                    </span>
                  )}
                  <div 
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-white text-black rounded-br-sm' 
                        : 'bg-cinematic-border text-white rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-cinematic-border bg-black/50">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-black border border-cinematic-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
