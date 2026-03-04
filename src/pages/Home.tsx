import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Hand, HandMetal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [raisedHand, setRaisedHand] = useState(user?.raisedHand || false);
  const [polls, setPolls] = useState<any[]>([]);

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
    }

    return () => {
      if (socket) {
        socket.off('hand-status-changed');
        socket.off('all-hands-cleared');
        socket.off('new-poll');
        socket.off('poll-updated');
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
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome, {user?.name}.</h1>
        <p className="text-cinematic-muted">Ready to participate? Keep it cool.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <motion.div 
            className="bg-cinematic-surface border border-cinematic-border rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="mb-4">
              {raisedHand ? (
                <Hand className="w-16 h-16 text-white" />
              ) : (
                <HandMetal className="w-16 h-16 text-cinematic-muted" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">Need attention?</h3>
            <p className="text-sm text-cinematic-muted mb-6">
              Raise your hand to let the admin know you have a question.
            </p>
            <button
              onClick={toggleHand}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                raisedHand 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-transparent border border-white text-white hover:bg-white/10'
              }`}
            >
              {raisedHand ? 'Lower Hand' : 'Raise Hand'}
            </button>
          </motion.div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-medium tracking-tight border-b border-cinematic-border pb-4">Active Polls</h2>
          
          {polls.length === 0 ? (
            <div className="text-cinematic-muted text-sm py-8 text-center border border-dashed border-cinematic-border rounded-xl">
              No active polls at the moment.
            </div>
          ) : (
            polls.map(poll => {
              const myResponse = poll.responses.find((r: any) => r.userId === user?._id || r.userId === user?.id);
              const totalResponses = poll.responses.length;

              return (
                <motion.div 
                  key={poll._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cinematic-surface border border-cinematic-border rounded-2xl p-6"
                >
                  <h3 className="text-lg font-medium mb-4">{poll.question}</h3>
                  <div className="space-y-3">
                    {poll.options.map((option: string, index: number) => {
                      const responseCount = poll.responses.filter((r: any) => r.selectedOption === index).length;
                      const percentage = totalResponses === 0 ? 0 : Math.round((responseCount / totalResponses) * 100);
                      const isSelected = myResponse?.selectedOption === index;

                      return (
                        <button
                          key={index}
                          onClick={() => submitPollResponse(poll._id, index)}
                          className={`w-full relative overflow-hidden rounded-lg border p-4 text-left transition-all duration-200 ${
                            isSelected 
                              ? 'border-white bg-white/5' 
                              : 'border-cinematic-border hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative flex justify-between items-center z-10">
                            <span className="font-medium">{option}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-cinematic-muted">{responseCount} votes</span>
                              <span className="text-sm font-medium w-8 text-right">{percentage}%</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-xs text-cinematic-muted text-right">
                    {totalResponses} response{totalResponses !== 1 ? 's' : ''}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
