import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Hand, HandMetal, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [raisedHand, setRaisedHand] = useState(user?.raisedHand || false);
  const [polls, setPolls] = useState<any[]>([]);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Fetch initial polls
    const fetchPolls = async () => {
      try {
        const res = await fetch('/api/polls', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          setPolls(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch polls', err);
      }
    };

    fetchPolls();

    if (socket) {
      socket.on('hand-status-changed', ({ userId, raised }) => {
        if (userId === user?._id || userId === user?.id) {
          setRaisedHand(raised);
        }
      });

      socket.on('all-hands-cleared', () => {
        setRaisedHand(false);
      });

      socket.on('new-poll', (poll) => {
        setPolls(prev => [poll, ...prev]);
      });

      socket.on('poll-updated', (updatedPoll) => {
        setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
      });

      socket.on('poll-deleted', (pollId) => {
        setPolls(prev => prev.filter(p => p._id !== pollId));
      });
    }

    return () => {
      if (socket) {
        socket.off('hand-status-changed');
        socket.off('all-hands-cleared');
        socket.off('new-poll');
        socket.off('poll-updated');
        socket.off('poll-deleted');
      }
    };
  }, [socket, user]);

  const toggleHand = () => {
    if (socket) {
      const newState = !raisedHand;
      setRaisedHand(newState);
      socket.emit('raise-hand', newState);
    }
  };

  const submitPollResponse = (pollId: string, optionIndex: number) => {
    if (socket) {
      socket.emit('submit-poll-response', { pollId, optionIndex });
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-cinematic-bg text-white overflow-x-hidden pb-12">
      {/* Background Hero Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url('/hero.png')` }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-black/95 via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-cinematic-bg via-cinematic-bg/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full h-full pt-32 px-4 md:px-8 lg:px-16 flex flex-col lg:flex-row items-start gap-12">
        {/* Left Side Content */}
        <motion.div 
          className="flex-1 max-w-160 mt-16 flex flex-col justify-center"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 text-st-red font-bold mb-6 tracking-[0.3em] text-xs uppercase max-md:hidden">
            <span className="text-st-red animate-pulse border border-st-red p-0.5 rounded-full"><span className="block w-1.5 h-1.5 bg-st-red rounded-full box-glow text-glow"></span></span> LIVE FROM THE UPSIDE DOWN
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-bebas mb-6 leading-[0.9] tracking-[0.05em] text-white select-none">
            Welcome to Hawkins,<br /><span className="text-st-red text-glow">{user?.name || 'Stranger'}</span>
          </h1>
          
          <p className="text-[#a3a3a3] text-xl mb-12 leading-relaxed max-w-xl font-light font-sans tracking-wide">
            In the upside down, communication is everything. Need the DM's attention during the campaign? Send a distress signal before the demogorgon finds you.
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-10">
            <button 
              onClick={toggleHand}
              className={`flex items-center gap-3 px-10 py-5 rounded-sm text-lg font-bebas tracking-[0.2em] transition-all duration-500 uppercase ${
                raisedHand 
                  ? 'bg-white text-black box-glow hover:bg-gray-200' 
                  : 'bg-transparent border border-st-red hover:bg-[#1a0000] text-st-red hover:text-white box-glow'
              }`}
            >
              {raisedHand ? (
                <>
                  <Hand className="w-5 h-5 mb-0.5" /> Lower Hand
                </>
              ) : (
                <>
                  <HandMetal className="w-5 h-5 mb-0.5" strokeWidth={1.5} /> Raise Hand
                </>
              )}
            </button>
            <div className="hidden md:flex items-center gap-4 overflow-hidden">
              <div className="relative w-40 h-[68px] rounded-sm border border-white/10 bg-cinematic-bg overflow-hidden cursor-pointer group hover:border-st-red/50 transition-all duration-500">
                <img src="/steve.png" alt="Steve" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] font-bebas tracking-widest text-[#a3a3a3] group-hover:text-st-red transition-colors text-glow">COMM LINK</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-4 text-[#a3a3a3] opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <div className="w-10 h-10 border border-white/20 rounded-md flex items-center justify-center text-xs font-bold bg-white/5 font-sans">
              16+
            </div>
            <span className="text-xs font-medium tracking-[0.2em] uppercase">Admin broadcast active</span>
          </div>
        </motion.div>

        {/* Right Side Content - Polls */}
        <motion.div 
          className="flex-1 w-full lg:mb-0 mb-12 mt-12 flex flex-col justify-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="md:ml-auto max-w-136 w-full">
            <h2 className="text-4xl lg:text-5xl font-bebas mb-12 tracking-widest text-white flex justify-between items-end border-b border-white/10 pb-6 uppercase">
              Active Polls
            </h2>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {polls.length === 0 ? (
                <div className="text-[#a3a3a3] text-sm tracking-widest uppercase py-16 text-center border border-dashed border-white/10 bg-black/40 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(219,0,0,0.03)_100%)]" />
                  No mysterious votes at the moment.
                </div>
              ) : (
                <AnimatePresence>
                  {polls.map((poll) => {
                    const myResponse = poll.responses.find((r: any) => r.userId === user?._id || r.userId === user?.id);
                    const totalResponses = poll.responses.length;

                    return (
                      <motion.div 
                        key={poll._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-cinematic-bg/90 backdrop-blur-xl border border-white/5 p-8 relative overflow-hidden group hover:border-st-red/30 transition-all duration-500 shadow-2xl"
                      >
                        {/* Red glow effect for active polls */}
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-st-red/5 rounded-full blur-3xl pointer-events-none group-hover:bg-st-red/10 transition-colors duration-1000" />

                        <h3 className="text-2xl font-bebas tracking-wide mb-8 text-white group-hover:text-glow transition-all duration-300">{poll.question}</h3>
                        
                        <div className="space-y-4">
                          {poll.options.map((option: string, index: number) => {
                            const responseCount = poll.responses.filter((r: any) => r.selectedOption === index).length;
                            const percentage = totalResponses === 0 ? 0 : Math.round((responseCount / totalResponses) * 100);
                            const isSelected = myResponse?.selectedOption === index;

                            return (
                              <button
                                key={index}
                                onClick={() => !isAdmin && submitPollResponse(poll._id, index)}
                                disabled={isAdmin}
                                className={`w-full relative overflow-hidden border p-5 text-left transition-all duration-300 ${
                                  isAdmin
                                    ? 'border-white/5 bg-white/2 cursor-not-allowed opacity-70'
                                    : isSelected 
                                      ? 'border-st-red bg-[#1a0000] box-glow-intense' 
                                      : 'border-white/5 hover:border-white/20 bg-white/2 hover:bg-white/4'
                                }`}
                              >
                                <div 
                                  className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out ${
                                    isSelected ? 'bg-st-red/20' : 'bg-white/5 group-hover:bg-white/10'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                                <div className="relative flex justify-between items-center z-10 w-full">
                                  <span className={`font-sans font-medium tracking-wide text-sm ${isSelected ? 'text-white text-glow' : 'text-[#a3a3a3]'}`}>
                                    {option}
                                  </span>
                                  <div className="flex items-center gap-6 shrink-0 font-bebas tracking-widest text-lg">
                                    <span className="text-[#a3a3a3] text-sm hidden sm:inline-block">{responseCount} VOTES</span>
                                    <span className={`w-10 text-right ${isSelected ? 'text-st-red text-glow' : 'text-[#a3a3a3]'}`}>{percentage}%</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-8 text-[10px] uppercase tracking-[0.2em] text-[#a3a3a3] text-right font-medium flex items-center justify-between">
                          {isAdmin && (
                            <span className="text-st-red/60 italic normal-case tracking-normal">Admins cannot vote on polls</span>
                          )}
                          <span className="ml-auto">{totalResponses} response{totalResponses !== 1 ? 's' : ''} recorded in the upside down</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute top-24 right-8 font-bold text-white/20 text-xl tracking-widest hidden lg:block z-0 pointer-events-none transform rotate-90 origin-right">
        STRANGER THINGS
      </div>
    </div>
  );
}
