'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { GameMode } from '../types/game';
import MultiplayerLobby from '../components/game/MultiplayerLobby';
import MultiplayerGameShell from '../components/game/MultiplayerGameShell';
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
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [selectedSoloMode, setSelectedSoloMode] = useState<GameMode | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('number-heist-player-name');
    if (savedName) {
      setPlayerName(savedName);
      setIsNameSubmitted(true);
    }
    setMounted(true);
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length >= 2) {
      localStorage.setItem('number-heist-player-name', playerName.trim());
      setIsNameSubmitted(true);
    }
  };

  if (!mounted) return null;

  if (activeRoom) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="multiplayer-game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <MultiplayerGameShell
            roomState={activeRoom}
            playerName={playerName}
            onExit={() => setActiveRoom(null)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (selectedSoloMode) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="solo-game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GameShell
            mode={selectedSoloMode}
            playerName={playerName}
            onExit={() => setSelectedSoloMode(null)}
          />
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
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-widest mb-4"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(to bottom right, #ffffff, #71717a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
        <AnimatePresence mode="wait">
          {!isNameSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
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
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!isNameSubmitted ? (
            <motion.div
              key="name-entry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-md p-10 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl mb-8"
            >
              <h2 className="text-xl font-semibold mb-8 text-center tracking-[0.2em] text-white/90">
                IDENTIFY YOURSELF
              </h2>
              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div>
                  <label htmlFor="playerName" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/40">
                    Agent Callsign
                  </label>
                  <input
                    type="text"
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-white/30 transition-all text-lg font-mono text-center tracking-widest placeholder:text-white/20"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <NeonButton
                  type="submit"
                  className="w-full"
                  disabled={playerName.trim().length < 2}
                  color="blue"
                >
                  INITIALIZE HACK
                </NeonButton>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="multiplayer-lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              <motion.div className="mb-12 flex items-center justify-center gap-4 bg-white/[0.02] px-6 py-3 rounded-full border border-white/5">
                <span className="text-xs uppercase tracking-[0.2em] text-white/40">Active Agent:</span>
                <span className="text-sm tracking-[0.2em] font-mono text-white/90">{playerName}</span>
                <button
                  onClick={() => setIsNameSubmitted(false)}
                  className="text-[10px] uppercase tracking-widest hover:text-white transition-colors opacity-30 hover:opacity-100 font-mono"
                >
                  [Change]
                </button>
              </motion.div>

              <MultiplayerLobby
                playerName={playerName}
                onGameStart={(room) => setActiveRoom(room)}
                onSoloMode={(mode) => setSelectedSoloMode(mode)}
                onBack={() => setIsNameSubmitted(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 mb-6 text-center"
        >
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            Made by Vikas
          </p>
        </motion.div>
      </div>
    </main>
  );
}
