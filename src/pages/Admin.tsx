import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navigate } from 'react-router-dom';
import { Hand, Users, Plus, Trash2, LayoutList, Table2, ChevronLeft, CheckCircle2, CircleDashed, BarChart3, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'participants' | 'polls'>('participants');
  
  // Poll State
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [pollViewMode, setPollViewMode] = useState<'carousel' | 'table'>('table');
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [currentPollIndex, setCurrentPollIndex] = useState(0);

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
      socket.on('hand-status-changed', ({ userId, raised, handRaisedAt }) => {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, raisedHand: raised, handRaisedAt } : u));
      });

      socket.on('all-hands-cleared', () => {
        setUsers(prev => prev.map(u => ({ ...u, raisedHand: false, handRaisedAt: null })));
      });

      socket.on('new-poll', (poll) => {
        setPolls(prev => [poll, ...prev]);
        setCurrentPollIndex(0); // Reset to newest poll
      });

      socket.on('poll-updated', (updatedPoll) => {
        setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
      });

      socket.on('poll-deleted', (pollId) => {
        setPolls(prev => prev.filter(p => p._id !== pollId));
        if (selectedPollId === pollId) setSelectedPollId(null);
      });

      socket.on('user-joined', () => {
        fetchData();
      });
    }

    return () => {
      if (socket) {
        socket.off('hand-status-changed');
        socket.off('all-hands-cleared');
        socket.off('new-poll');
        socket.off('poll-updated');
        socket.off('poll-deleted');
        socket.off('user-joined');
      }
    };
  }, [socket]);

  const clearAllHands = () => {
    if (socket) {
      socket.emit('clear-all-hands');
    }
  };

  const toggleHand = (userId: string, currentStatus: boolean) => {
    if (socket) {
      socket.emit('admin-toggle-hand', { userId, raised: !currentStatus });
    }
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

  const handleDeletePoll = (pollId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (socket && window.confirm('Are you sure you want to banish this poll to the upside down?')) {
      socket.emit('delete-poll', pollId);
    }
  };

  // Sort users based on hand raised status and time
  const sortedUsers = [...users].sort((a, b) => {
    if (a.raisedHand && !b.raisedHand) return -1;
    if (!a.raisedHand && b.raisedHand) return 1;
    if (a.raisedHand && b.raisedHand) {
      const timeA = a.handRaisedAt ? new Date(a.handRaisedAt).getTime() : 0;
      const timeB = b.handRaisedAt ? new Date(b.handRaisedAt).getTime() : 0;
      return timeA - timeB; // ascending, oldest first
    }
    return 0;
  });

  const raisedHandsCount = users.filter(u => u.raisedHand).length;
  const participantsOnly = sortedUsers.filter(u => u.role !== 'admin');
  const selectedPoll = polls.find(p => p._id === selectedPollId);
  const activePoll = polls[currentPollIndex];

  return (
    <div className="relative w-full min-h-screen bg-cinematic-bg text-white overflow-x-hidden pb-12">
      {/* Background Hero Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url('/hero.png')` }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-black/95 via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-cinematic-bg via-cinematic-bg/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full h-full pt-32 px-4 md:px-8 lg:px-16 min-h-screen text-white">
        
        <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
             <h1 className="text-4xl md:text-5xl lg:text-7xl font-bebas tracking-widest text-white mb-2 flex justify-start items-center gap-2 md:gap-4 flex-wrap">
              Admin Control <span className="text-st-red animate-pulse border border-st-red p-1 rounded-full"><span className="block w-2.5 h-2.5 bg-st-red rounded-full box-glow text-glow"></span></span>
            </h1>
            <p className="text-[#a3a3a3] text-lg font-light tracking-wide">Real-time management for participants and interactive polls in the upside down.</p>
          </motion.div>
        </header>

        {/* Main Tabs Navbar */}
        <div className="flex gap-4 mb-8 bg-black/40 backdrop-blur-md p-2 border border-white/10 rounded-2xl w-fit relative shadow-[0_0_15px_rgba(219,0,0,0.1)]">
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'participants' ? 'bg-st-red text-white shadow-lg shadow-st-red/30' : 'text-cinematic-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Participants ({participantsOnly.length})
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'polls' ? 'bg-st-red text-white shadow-lg shadow-st-red/30' : 'text-cinematic-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Polls Manage
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* PARTICIPANTS TAB */}
          {activeTab === 'participants' && (
            <motion.div
              key="participants"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-4xl font-bebas tracking-widest text-white">Participant List</h2>
                <button
                  onClick={clearAllHands}
                  disabled={raisedHandsCount === 0}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 border-black border-4 hover:bg-red-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  <Hand className="w-4 h-4" /> Clear All Hands ({raisedHandsCount})
                </button>
              </div>

              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-st-red/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="overflow-x-auto w-full"><table className="w-full min-w-[700px] text-left border-collapse relative z-10">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-cinematic-muted text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Participant</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Hand Status</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {participantsOnly.map((u, idx) => (
                      <tr 
                        key={u._id} 
                        className={`hover:bg-white/5 transition-colors ${u.raisedHand ? 'bg-st-red/10 border-l-2 border-l-st-red' : 'border-l-2 border-l-transparent'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${u.raisedHand ? 'bg-st-red text-white shadow-st-red/50' : 'bg-white/10 text-white/70'}`}>
                              {u.name.substring(0,2).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-cinematic-muted">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-cinematic-muted border border-white/10">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.raisedHand ? (
                            <div className="flex items-center gap-2 text-st-red text-sm font-bold">
                              <Hand className="w-4 h-4" /> 
                              Raised
                              <span className="text-xs text-white/40 ml-2 flex items-center gap-1 font-normal">
                                <Clock className="w-3 h-3"/> {new Date(u.handRaisedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-cinematic-muted text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleHand(u._id, u.raisedHand)}
                            className={`px-4 py-1.5 rounded-lg text-sm transition-colors border ${
                              u.raisedHand 
                                ? 'bg-st-red/20 border-st-red/50 text-st-red hover:bg-st-red hover:text-white' 
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {u.raisedHand ? 'Lower Hand' : 'Raise Hand'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {participantsOnly.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-cinematic-muted text-sm">
                          No participants yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table></div>
              </div>
            </motion.div>
          )}

          {/* POLLS TAB */}
          {activeTab === 'polls' && (
            <motion.div
              key="polls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* View specific poll detailed response table */}
              {selectedPoll ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-[0_0_15px_rgba(219,0,0,0.1)]">
                    <button 
                      onClick={() => setSelectedPollId(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5 text-cinematic-muted hover:text-white" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-wide">{selectedPoll.question}</h2>
                      <p className="text-sm text-st-red font-medium">{selectedPoll.responses.length} total responses</p>
                    </div>
                  </div>

                  <div className="bg-black/60 backdrop-blur-md flex flex-col border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-st-dark-red via-st-red to-transparent"></div>
                    {/* Navbar inside the table for views/filters - requirement */}
                    <div className="p-4 border-b border-white/10 bg-black/40 flex flex-wrap gap-4 items-center justify-between z-10">
                      <h3 className="font-bebas text-2xl tracking-widest text-white/80">Response Data</h3>
                      <div className="flex gap-4">
                        {selectedPoll.options.map((opt: string, idx: number) => {
                          const count = selectedPoll.responses.filter((r: any) => r.selectedOption === idx).length;
                          return (
                            <div key={idx} className="flex flex-col items-center bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
                              <span className="text-[10px] text-cinematic-muted uppercase tracking-wider">{opt}</span>
                              <span className="font-bold text-white">{count}</span>
                            </div>
                          );
                        })}
                        <div className="flex flex-col items-center bg-st-red/10 px-4 py-1.5 rounded-lg border border-st-red/20 shadow-[0_0_10px_rgba(219,0,0,0.1)]">
                          <span className="text-[10px] text-st-red uppercase tracking-wider font-bold">Pending</span>
                          <span className="font-bold text-st-red">
                            {participantsOnly.length - selectedPoll.responses.map((r: any) => r.userId).filter((v: any, i: any, a: any) => a.indexOf(v) === i).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto w-full"><table className="w-full min-w-[700px] text-left border-collapse z-10">
                      <thead>
                        <tr className="bg-black/60 text-cinematic-muted text-xs uppercase tracking-wider border-b border-white/10">
                          <th className="px-6 py-4 font-medium">Participant</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Option Selected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {participantsOnly.map(user => {
                          const response = selectedPoll.responses.find((r: any) => String(r.userId) === String(user._id));
                          const hasResponded = !!response;
                          
                          return (
                            <tr key={user._id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-medium text-sm text-white/90">{user.name}</span>
                              </td>
                              <td className="px-6 py-4">
                                {hasResponded ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 shadow-[0_0_5px_rgba(52,211,153,0.2)]">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Received
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-st-red text-xs font-bold bg-st-red/10 px-2.5 py-1 rounded-full border border-st-red/20">
                                    <CircleDashed className="w-3.5 h-3.5 animate-[spin_3s_linear_infinite]" /> Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {hasResponded ? (
                                  <span className="text-white text-sm bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                                    {selectedPoll.options[response.selectedOption]}
                                  </span>
                                ) : (
                                  <span className="text-cinematic-muted text-sm">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {participantsOnly.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-cinematic-muted text-sm border-t border-white/5">
                              No participants available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table></div>
                  </div>
                </div>
              ) : (
                /* Poll List/Creation View */
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Left: Create format */}
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-st-red/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      <h2 className="text-2xl font-bebas tracking-widest mb-6 flex items-center gap-2 text-white">
                        <Plus className="w-5 h-5 text-st-red" /> 
                        Create New Poll
                      </h2>
                      <form onSubmit={handleCreatePoll} className="space-y-5 relative z-10">
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-bold text-st-red mb-2">Question</label>
                          <textarea
                            rows={2}
                            value={newPollQuestion}
                            onChange={(e) => setNewPollQuestion(e.target.value)}
                            className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-st-red/50 focus:ring-1 focus:ring-st-red/50 resize-none transition-all shadow-inner"
                            placeholder="What dark secret should we uncover next?"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-bold text-st-red mb-2">Options</label>
                          <div className="space-y-3">
                            <AnimatePresence>
                              {newPollOptions.map((option, idx) => (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }} 
                                  animate={{ opacity: 1, height: 'auto' }} 
                                  exit={{ opacity: 0, height: 0 }}
                                  key={idx} 
                                  className="flex gap-2"
                                >
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const updated = [...newPollOptions];
                                      updated[idx] = e.target.value;
                                      setNewPollOptions(updated);
                                    }}
                                    className="flex-1 bg-black/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-st-red/50 focus:ring-1 focus:ring-st-red/50 transition-all shadow-inner"
                                    placeholder={`Option ${idx + 1}`}
                                  />
                                  {newPollOptions.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))}
                                      className="p-2.5 text-cinematic-muted hover:text-white hover:bg-st-red rounded-xl transition-all border border-transparent shadow-[0_0_10px_rgba(219,0,0,0)] hover:shadow-[0_0_15px_rgba(219,0,0,0.5)]"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewPollOptions([...newPollOptions, ''])}
                            className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-cinematic-muted hover:text-white bg-white/5 hover:bg-white/10 py-2.5 rounded-xl transition-all border border-dashed border-white/20"
                          >
                            <Plus className="w-4 h-4" /> Add Another Option
                          </button>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim() !== '').length < 2}
                            className="w-full bg-st-red text-white py-3 rounded-xl font-bold tracking-wide uppercase text-sm hover:bg-st-dark-red transition-all disabled:opacity-50 disabled:hover:bg-st-red shadow-[0_0_15px_rgba(219,0,0,0.3)] hover:shadow-[0_0_25px_rgba(219,0,0,0.6)]"
                          >
                            Launch Poll Into The Void
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right: Polls list/table overview */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-4xl font-bebas tracking-widest text-white">Active Polls</h2>
                      
                      <div className="bg-black/60 backdrop-blur-md border border-white/10 flex p-1 rounded-lg">
                        <button 
                          onClick={() => setPollViewMode('table')}
                          className={`p-1.5 rounded-md transition-colors ${pollViewMode === 'table' ? 'bg-st-red text-white' : 'text-cinematic-muted hover:text-white'}`}
                        >
                          <Table2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setPollViewMode('carousel')}
                          className={`p-1.5 rounded-md transition-colors ${pollViewMode === 'carousel' ? 'bg-st-red text-white' : 'text-cinematic-muted hover:text-white'}`}
                        >
                          <LayoutList className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {polls.length === 0 ? (
                      <div className="text-cinematic-muted text-lg py-16 text-center border border-dashed border-white/10 bg-black/40 backdrop-blur-md rounded-2xl">
                        <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        No mysterious votes at the moment. <br /> Launch one from the panel.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pollViewMode === 'carousel' ? (
                          <div className="flex flex-col items-center w-full">
                            <AnimatePresence mode="wait">
                              {activePoll && (
                                <motion.div 
                                  key={activePoll._id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3 }}
                                  onClick={() => setSelectedPollId(activePoll._id)}
                                  className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 cursor-pointer relative overflow-hidden group hover:border-st-red/50 hover:shadow-[0_0_30px_rgba(219,0,0,0.2)] transition-all"
                                >
                                  {/* Red glow effect for active polls */}
                                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-st-red/10 rounded-full blur-3xl pointer-events-none transition-all group-hover:bg-st-red/20" />

                                  <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                      <h3 className="text-xl font-bold text-white group-hover:text-st-red transition-colors max-w-lg leading-tight">{activePoll.question}</h3>
                                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-st-red/10 border border-st-red/30 text-[10px] uppercase tracking-widest text-st-red font-bold">
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-st-red opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-st-red"></span>
                                        </span>
                                        Active
                                      </span>
                                    </div>
                                    <button 
                                      onClick={(e) => handleDeletePoll(activePoll._id, e)}
                                      className="p-2 text-cinematic-muted hover:text-white hover:bg-st-red rounded-lg transition-colors border border-transparent shadow-[0_0_10px_rgba(219,0,0,0)] hover:shadow-[0_0_15px_rgba(219,0,0,0.5)] z-20"
                                      title="Delete Poll"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-4 mb-6 relative z-10 w-full md:w-3/4">
                                     {activePoll.options.map((option: string, index: number) => {
                                        const responseCount = activePoll.responses.filter((r: any) => r.selectedOption === index).length;
                                        const percentage = activePoll.responses.length === 0 ? 0 : Math.round((responseCount / activePoll.responses.length) * 100);

                                        return (
                                          <div
                                            key={index}
                                            className="w-full relative overflow-hidden rounded-lg border border-white/10 p-4 text-left bg-black/40"
                                          >
                                            <div 
                                              className="absolute left-0 top-0 bottom-0 bg-white/5 transition-all duration-700 ease-out"
                                              style={{ width: `${percentage}%` }}
                                            />
                                            <div className="relative flex justify-between items-center z-10 w-full">
                                              <span className="font-medium text-white/90">
                                                {option}
                                              </span>
                                              <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-xs text-cinematic-muted">{responseCount} votes</span>
                                                <span className="text-sm font-bold w-10 text-right">{percentage}%</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                
                                  <div className="text-xs text-cinematic-muted font-medium flex justify-between items-center z-10 relative">
                                     <span>Click card to view details</span>
                                     <div className="flex items-center gap-4">
                                       <span className="inline-flex items-center gap-1.5 text-st-red bg-st-red/10 px-2.5 py-1 rounded-full border border-st-red/20 font-bold">
                                         Pending: {participantsOnly.length - activePoll.responses.map((r: any) => r.userId).filter((v: any, i: any, a: any) => a.indexOf(v) === i).length}
                                       </span>
                                       <span>{activePoll.responses.length} response{activePoll.responses.length !== 1 ? 's' : ''}</span>
                                     </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Dot Indicators */}
                            {polls.length > 1 && (
                              <div className="flex justify-center items-center gap-2 mt-6 bg-black/40 px-4 py-2 text-center rounded-full border border-white/5 w-fit mx-auto">
                                {polls.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setCurrentPollIndex(idx)}
                                    className={`min-w-[12px] min-h-[12px] rounded-full transition-all duration-300 ${
                                      currentPollIndex === idx 
                                        ? 'bg-st-red w-8 shadow-[0_0_10px_rgba(219,0,0,0.8)]' 
                                        : 'bg-white/20 hover:bg-white/40 w-3 h-3'
                                    }`}
                                    aria-label={`View poll ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            <div className="overflow-x-auto w-full"><table className="w-full min-w-[700px] text-left text-sm">
                              <thead className="bg-black/80 text-cinematic-muted text-xs uppercase tracking-wider">
                                <tr className="border-b border-white/10">
                                  <th className="px-5 py-4 font-medium">Question</th>
                                  <th className="px-5 py-4 font-medium">Options</th>
                                  <th className="px-5 py-4 font-medium">Responses</th>
                                  <th className="px-5 py-4 font-medium">Pending</th>
                                  <th className="px-5 py-4 font-medium text-right">View</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {polls.map(poll => (
                                  <tr key={poll._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-4 font-medium text-white/90">
                                      {poll.question}
                                    </td>
                                    <td className="px-5 py-4 text-cinematic-muted">
                                      {poll.options.length} options
                                    </td>
                                    <td className="px-5 py-4">
                                      <span className="bg-white/10 px-2.5 py-1 rounded-md text-xs font-bold text-st-red">
                                        {poll.responses.length}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4">
                                      <span className="inline-flex items-center gap-1.5 bg-st-red/10 px-2.5 py-1 rounded-full text-xs font-bold text-st-red border border-st-red/20">
                                        {participantsOnly.length - poll.responses.map((r: any) => r.userId).filter((v: any, i: any, a: any) => a.indexOf(v) === i).length}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={() => setSelectedPollId(poll._id)}
                                          className="text-white hover:text-white text-xs font-bold px-4 py-2 rounded bg-st-red/80 hover:bg-st-red transition-colors shadow-[0_4px_10px_rgba(219,0,0,0.3)] hover:shadow-[0_4px_15px_rgba(219,0,0,0.5)] uppercase tracking-wider"
                                        >
                                          Details
                                        </button>
                                        <button 
                                          onClick={(e) => handleDeletePoll(poll._id, e)}
                                          className="text-cinematic-muted hover:text-white hover:bg-st-red p-2 rounded transition-colors"
                                          title="Delete Poll"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

       {/* Decorative Right Text - Stranger Things style overlay */}
       <div className="absolute top-48 right-8 font-bebas font-bold text-white/5 text-6xl tracking-[0.3em] hidden xl:block z-0 pointer-events-none transform rotate-90 origin-right whitespace-nowrap">
        THE UPSIDE DOWN
      </div>
    </div>
  );
}
