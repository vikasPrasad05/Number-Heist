'use client';

import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { GameMode } from '../types/game';
import ModeSelector from '../components/game/ModeSelector';
import GameShell from '../components/game/GameShell';
import NeonButton from '../components/ui/NeonButton';
import Link from 'next/link';

const VaultScene = dynamic(() => import('../components/three/VaultScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center">
      <div className="text-sm animate-pulse" style={{ color: 'var(--neon-blue)' }}>
        Loading vault...
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  if (selectedMode) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GameShell mode={selectedMode} onExit={() => setSelectedMode(null)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <main className="min-h-screen relative z-10">
      {/* Hero Section */}
      <div className="flex flex-col items-center px-4 pt-8 pb-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-4"
        >
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-wider mb-3"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #00d4ff, #00ff88, #b44dff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(0, 212, 255, 0.3))',
            }}
          >
            NUMBER HEIST
          </h1>
          <motion.p
            className="text-sm md:text-base tracking-[0.3em] uppercase"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Hack the vault. Crack the code.
          </motion.p>
        </motion.div>

        {/* 3D Vault */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="w-full max-w-2xl mb-6"
        >
          <Suspense fallback={
            <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center">
              <div className="text-sm animate-pulse" style={{ color: 'var(--neon-blue)' }}>
                Loading vault...
              </div>
            </div>
          }>
            <VaultScene />
          </Suspense>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm md:text-base mb-8 max-w-xl"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          Solve math puzzles under time pressure. Build combos, level up, and climb the leaderboard.
          Choose your challenge below.
        </motion.p>

        {/* Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-5xl mb-8"
        >
          <ModeSelector onSelectMode={setSelectedMode} />
        </motion.div>

        {/* Leaderboard Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Link href="/leaderboard">
            <NeonButton color="purple" size="md">
              🏆 View Leaderboard
            </NeonButton>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 mb-6 text-center"
        >
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            Built with Next.js • Framer Motion • Three.js
          </p>
        </motion.div>
      </div>
    </main>
  );
}
