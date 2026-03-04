import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Radio, Quote } from 'lucide-react';
import UpsideDownBg from '../components/UpsideDownBg';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-4 relative overflow-hidden font-sans">
      <UpsideDownBg />

      {/* Central atmospheric glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-red-900/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-md w-full relative z-10"
      >
        <div className="upside-down-glow bg-black/70 backdrop-blur-2xl border border-red-900/30 p-10 rounded-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-red-600 to-transparent opacity-50 shadow-[0_0_15px_rgba(220,38,38,0.9)]" />

          {/* Bottom subtle accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-red-900/40 to-transparent" />

          {/* Header */}
          <div className="flex flex-col items-center mb-10 relative">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(220,38,38,0.2)',
                  '0 0 40px rgba(220,38,38,0.4)',
                  '0 0 20px rgba(220,38,38,0.2)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-red-950/30 p-4 rounded-full border border-red-900/40 mb-5"
            >
              <Radio className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.9)]" />
            </motion.div>

            <motion.h2
              animate={{ textShadow: [
                '0 0 20px rgba(220,38,38,0.5)',
                '0 0 40px rgba(220,38,38,0.8)',
                '0 0 20px rgba(220,38,38,0.5)',
              ]}}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl text-red-500 font-bold tracking-[0.2em] uppercase text-center"
              style={{ fontFamily: 'var(--font-bebas)' }}
            >
              Join Hawkins Lab
            </motion.h2>
            <p className="text-red-400/40 text-[10px] mt-3 uppercase tracking-[0.35em] font-semibold">
              Create Your Classified Profile
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/40 border border-red-900/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold text-red-400/60 uppercase tracking-[0.2em] mb-2">
                Code Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#080808] border border-red-900/25 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all placeholder:text-gray-700 font-mono text-sm"
                placeholder="Mike Wheeler"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-red-400/60 uppercase tracking-[0.2em] mb-2">
                Secure Channel
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#080808] border border-red-900/25 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all placeholder:text-gray-700 font-mono text-sm"
                placeholder="mike@hawkins.gov"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-red-400/60 uppercase tracking-[0.2em] mb-2">
                Secret Passphrase
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#080808] border border-red-900/25 rounded-lg px-4 py-3.5 text-white font-mono focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all placeholder:text-gray-700"
                placeholder="••••••••"
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative group overflow-hidden bg-red-800/90 text-white font-bold tracking-[0.15em] uppercase py-3.5 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 mt-4 shadow-[0_0_25px_rgba(220,38,38,0.25)] hover:shadow-[0_0_40px_rgba(220,38,38,0.45)] border border-red-600/40 text-sm cursor-pointer"
            >
              <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative">{loading ? 'Creating profile...' : 'Enlist Now'}</span>
            </motion.button>
          </form>

          {/* Footer / Quote */}
          <div className="mt-10 pt-8 border-t border-red-900/20 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/80 px-3">
              <Quote className="w-4 h-4 text-red-900/50" />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1.2 }}
            >
              <p className="text-gray-500 italic text-sm font-medium leading-relaxed px-4">
                "She's our friend and she's crazy!"
              </p>
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="w-6 h-px bg-red-800/40 mb-1" />
                <p className="text-red-500/70 text-[10px] uppercase tracking-[0.2em] font-extrabold">
                  Dustin Henderson
                </p>
                <p className="text-gray-600 text-[9px] uppercase tracking-widest mt-0.5">
                  Hawkins, Indiana
                </p>
              </div>
            </motion.div>

            <p className="mt-10 text-center text-[11px] text-red-500/40 uppercase tracking-[0.15em] font-semibold">
              Already enlisted?{' '}
              <Link
                to="/login"
                className="text-red-400/80 hover:text-red-300 hover:underline underline-offset-4 transition-colors"
              >
                Access Terminal
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
