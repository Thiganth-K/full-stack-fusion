import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Particle {
  id: number;
  size: number;
  left: string;
  startY: string;
  drift: number;
  duration: number;
  delay: number;
  type: 'ash' | 'ember';
}

export default function UpsideDownBg() {
  const particles = useMemo<Particle[]>(() => {
    return [...Array(55)].map((_, i) => ({
      id: i,
      size: i < 8 ? Math.random() * 3 + 2 : Math.random() * 4 + 1,
      left: Math.random() * 100 + '%',
      startY: Math.random() * 100 + '%',
      drift: Math.random() * 80 - 40,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 6,
      type: i < 8 ? 'ember' as const : 'ash' as const,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep atmospheric gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(80,0,0,0.15) 0%, transparent 60%), ' +
            'radial-gradient(ellipse at 20% 20%, rgba(60,0,0,0.08) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 80% 30%, rgba(60,0,0,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Top dark vine tendrils */}
      <div
        className="absolute top-0 left-0 right-0 h-40"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
          maskImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,0 L200,0 L200,60 Q180,80 160,55 Q140,30 120,65 Q100,90 80,50 Q60,20 40,60 Q20,85 0,40 Z\' fill=\'white\'/%3E%3C/svg%3E")',
          maskSize: '400px 100%',
          maskRepeat: 'repeat-x',
          WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,0 L200,0 L200,60 Q180,80 160,55 Q140,30 120,65 Q100,90 80,50 Q60,20 40,60 Q20,85 0,40 Z\' fill=\'white\'/%3E%3C/svg%3E")',
          WebkitMaskSize: '400px 100%',
          WebkitMaskRepeat: 'repeat-x',
        }}
      />

      {/* Bottom dark vine tendrils */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)',
        }}
      />

      {/* Floating ash/snow particles going upward */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size + 'px',
            height: p.size + 'px',
            left: p.left,
            top: p.startY,
            background:
              p.type === 'ember'
                ? 'radial-gradient(circle, rgba(255,80,40,0.9), rgba(200,30,0,0.4))'
                : 'radial-gradient(circle, rgba(200,200,210,0.6), rgba(150,150,160,0.2))',
            boxShadow:
              p.type === 'ember'
                ? '0 0 6px rgba(255,60,20,0.6), 0 0 12px rgba(200,30,0,0.3)'
                : '0 0 3px rgba(200,200,220,0.3)',
            filter: p.type === 'ash' ? 'blur(0.5px)' : 'none',
          }}
          animate={{
            y: [0, -(Math.random() * 300 + 200)],
            x: [0, p.drift],
            opacity: [0, p.type === 'ember' ? 0.9 : 0.6, 0],
            scale: p.type === 'ember' ? [1, 0.5] : [1, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}

      {/* Flickering dimensional light */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(120,0,0,0.06) 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0.3, 0.8, 0.2, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
