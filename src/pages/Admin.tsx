import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navigate } from 'react-router-dom';
import { Hand, Users, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, pollsRes] = await Promise.all([
          fetch('/api/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/polls', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        ]);
        
        if (usersRes.ok) setUsers(await usersRes.json());
        if (pollsRes.ok) setPolls(await pollsRes.json());
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      }
    };

    fetchData();

    if (socket) {
      socket.on('hand-status-changed', ({ userId, raised }) => {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, raisedHand: raised } : u));
      });

      socket.on('all-hands-cleared', () => {
        setUsers(prev => prev.map(u => ({ ...u, raisedHand: false })));
      });

      socket.on('new-poll', (poll) => {
        setPolls(prev => [poll, ...prev]);
      });

      socket.on('poll-updated', (updatedPoll) => {
        setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
      });

      socket.on('user-joined', () => {
        // Refresh users list
        fetchData();
      });
    }

    return () => {
      if (socket) {
        socket.off('hand-status-changed');
        socket.off('all-hands-cleared');
        socket.off('new-poll');
        socket.off('poll-updated');
        socket.off('user-joined');
      }
    };
  }, [socket]);

  const clearAllHands = () => {
    if (socket) {
      socket.emit('clear-all-hands');
    }
  };

  const handleAddOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newPollOptions.filter(o => o.trim() !== '');
    if (!newPollQuestion.trim() || validOptions.length < 2) return;

    if (socket) {
      socket.emit('create-poll', {
        question: newPollQuestion.trim(),
        options: validOptions
      });
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
    }
  };

  const raisedHandsCount = users.filter(u => u.raisedHand).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Admin Control</h1>
        <p className="text-cinematic-muted">Manage the workshop, monitor participants, and create polls.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Participants */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-cinematic-surface border border-cinematic-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({users.length})
              </h2>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {users.map(u => (
                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-black border border-cinematic-border">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-cinematic-muted">{u.email}</div>
                  </div>
                  {u.raisedHand && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-white text-black p-1.5 rounded-full"
                    >
                      <Hand className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cinematic-surface border border-cinematic-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Hand className="w-5 h-5" />
                Raised Hands
              </h2>
              <span className="bg-white/10 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                {raisedHandsCount}
              </span>
            </div>
            <button
              onClick={clearAllHands}
              disabled={raisedHandsCount === 0}
              className="w-full py-2.5 rounded-lg font-medium border border-cinematic-border hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Clear All Hands
            </button>
          </div>
        </div>

        {/* Right Column: Polls */}
        <div className="lg:col-span-2 space-y-8">
          {/* Create Poll */}
          <div className="bg-cinematic-surface border border-cinematic-border rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-6">Create New Poll</h2>
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cinematic-muted mb-1.5">Question</label>
                <input
                  type="text"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  className="w-full bg-black border border-cinematic-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/50"
                  placeholder="What should we cover next?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-cinematic-muted mb-1.5">Options</label>
                <div className="space-y-3">
                  {newPollOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 bg-black border border-cinematic-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/50"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {newPollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 text-cinematic-muted hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-3 flex items-center gap-1.5 text-sm text-cinematic-muted hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim() !== '').length < 2}
                  className="bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Send Poll
                </button>
              </div>
            </form>
          </div>

          {/* Poll Results */}
          <div>
            <h2 className="text-lg font-medium mb-4">Poll Results</h2>
            <div className="space-y-6">
              {polls.length === 0 ? (
                <div className="text-cinematic-muted text-sm py-8 text-center border border-dashed border-cinematic-border rounded-xl">
                  No polls created yet.
                </div>
              ) : (
                polls.map(poll => {
                  const totalResponses = poll.responses.length;
                  return (
                    <div key={poll._id} className="bg-cinematic-surface border border-cinematic-border rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{poll.question}</h3>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-cinematic-muted">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            Live
                          </span>
                        </div>
                        <span className="text-xs text-cinematic-muted">{totalResponses} responses</span>
                      </div>
                      <div className="space-y-3">
                        {poll.options.map((option: string, index: number) => {
                          const responseCount = poll.responses.filter((r: any) => r.selectedOption === index).length;
                          const percentage = totalResponses === 0 ? 0 : Math.round((responseCount / totalResponses) * 100);
                          
                          return (
                            <div key={index} className="relative overflow-hidden rounded-lg border border-cinematic-border p-3">
                              <div 
                                className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="relative flex justify-between items-center z-10 text-sm">
                                <span>{option}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-cinematic-muted">{responseCount} votes</span>
                                  <span className="font-medium w-8 text-right">{percentage}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
