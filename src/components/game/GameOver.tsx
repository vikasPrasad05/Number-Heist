'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameMode, MODE_LABELS } from '../../types/game';
import NeonButton from '../ui/NeonButton';

interface GameOverProps {
    score: number;
    level: number;
    questionsAnswered: number;
    correctAnswers: number;
    maxCombo: number;
    mode: GameMode;
    highScore: number;
    playerName: string; // Added this
    onRestart: () => void;
    onExit: () => void;
    onSaveScore: (name: string) => void;
}

export default function GameOver({
    score,
    level,
    questionsAnswered,
    correctAnswers,
    maxCombo,
    mode,
    highScore,
    playerName: initialPlayerName, // Renamed to avoid collision
    onRestart,
    onExit,
    onSaveScore,
}: GameOverProps) {
    const [playerName, setPlayerName] = useState(initialPlayerName);
    const [saved, setSaved] = useState(false);
    const isNewHighScore = score > highScore;
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;

    const handleSave = useCallback(() => {
        if (playerName.trim()) {
            onSaveScore(playerName.trim());
            setSaved(true);
        }
    }, [playerName, onSaveScore]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className="glass-card p-8 md:p-12 max-w-lg w-full text-center"
                style={{ boxShadow: '0 0 40px rgba(0, 212, 255, 0.1)' }}
            >
                {/* Header */}
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="mb-6"
                >
                    <div className="text-4xl mb-2">
                        {isNewHighScore ? '🏆' : '💀'}
                    </div>
                    <h2
                        className="text-2xl md:text-3xl font-bold mb-1"
                        style={{
                            fontFamily: "'Orbitron', sans-serif",
                            color: isNewHighScore ? 'var(--neon-green)' : 'var(--neon-red)',
                            textShadow: isNewHighScore
                                ? '0 0 20px rgba(0, 255, 136, 0.5)'
                                : '0 0 20px rgba(255, 51, 102, 0.5)',
                        }}
                    >
                        {isNewHighScore ? 'NEW HIGH SCORE!' : 'GAME OVER'}
                    </h2>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {MODE_LABELS[mode]}
                    </div>
                </motion.div>

                {/* Score */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="text-5xl md:text-6xl font-bold mb-8"
                    style={{
                        fontFamily: "'Orbitron', sans-serif",
                        color: 'var(--neon-blue)',
                        textShadow: '0 0 30px rgba(0, 212, 255, 0.4)',
                    }}
                >
                    {score.toLocaleString()}
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                        { label: 'Level', value: level, color: 'var(--neon-blue)' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy > 70 ? 'var(--neon-green)' : 'var(--neon-yellow)' },
                        { label: 'Max Combo', value: `${maxCombo}x`, color: 'var(--neon-purple)' },
                        { label: 'Correct', value: `${correctAnswers}/${questionsAnswered}`, color: 'var(--neon-blue)' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="p-3 rounded-xl"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                                {stat.label}
                            </div>
                            <div className="text-lg font-bold" style={{ color: stat.color, fontFamily: "'Orbitron', sans-serif" }}>
                                {stat.value}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Save Score */}
                <AnimatePresence>
                    {!saved ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                        >
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Enter your name"
                                    maxLength={20}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
                                    style={{
                                        background: 'rgba(0, 212, 255, 0.08)',
                                        border: '1px solid rgba(0, 212, 255, 0.3)',
                                        color: 'var(--text-primary)',
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                                <NeonButton onClick={handleSave} color="green" size="sm" disabled={!playerName.trim()}>
                                    Save
                                </NeonButton>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-6 text-sm"
                            style={{ color: 'var(--neon-green)' }}
                        >
                            ✓ Score saved to leaderboard!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <NeonButton onClick={onRestart} color="blue" size="md">
                        Play Again
                    </NeonButton>
                    <NeonButton onClick={onExit} color="purple" size="md">
                        Menu
                    </NeonButton>
                </div>
            </motion.div>
        </div>
    );
}
