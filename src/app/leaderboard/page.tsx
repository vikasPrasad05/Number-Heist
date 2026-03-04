'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LeaderboardEntry, MODE_LABELS, GameMode } from '../../types/game';
import GlassCard from '../../components/ui/GlassCard';
import NeonButton from '../../components/ui/NeonButton';

const VaultScene = dynamic(() => import('../../components/three/VaultScene'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[200px] flex items-center justify-center">
            <div className="text-xs animate-pulse font-mono" style={{ color: 'var(--neon-blue)' }}>
                INITIATING_VAULT_DECRYPT...
            </div>
        </div>
    ),
});

const STORAGE_KEY = 'number-heist-leaderboard';

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [filterMode, setFilterMode] = useState<GameMode | 'all'>('all');

    useEffect(() => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) setEntries(JSON.parse(data));
        } catch {
            // no data
        }
    }, []);

    const filtered = filterMode === 'all'
        ? entries
        : entries.filter((e) => e.mode === filterMode);

    const modes: (GameMode | 'all')[] = [
        'all',
        'speed-math',
        'pattern-recognition',
        'hidden-operator',
        'multi-step-logic',
        'daily-challenge',
    ];

    return (
        <main className="min-h-screen relative z-10 px-4 py-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-0"
                >
                    <div className="relative h-[250px] md:h-[300px] -mb-12">
                        <VaultScene />
                    </div>

                    <Link href="/">
                        <NeonButton color="blue" size="sm" className="mb-6 relative z-10">
                            ← Back to Menu
                        </NeonButton>
                    </Link>
                    <h1
                        className="text-3xl md:text-4xl font-bold tracking-wider mb-2"
                        style={{
                            fontFamily: "'Orbitron', sans-serif",
                            color: 'var(--neon-blue)',
                            textShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
                        }}
                    >
                        🏆 LEADERBOARD
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Top scores from your local sessions
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2 justify-center mb-8"
                >
                    {modes.map((m) => (
                        <motion.button
                            key={m}
                            onClick={() => setFilterMode(m)}
                            className="px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all"
                            style={{
                                background: filterMode === m ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${filterMode === m ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                                color: filterMode === m ? 'var(--neon-blue)' : 'var(--text-secondary)',
                                fontFamily: "'Orbitron', sans-serif",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {m === 'all' ? 'All' : MODE_LABELS[m]}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="text-4xl mb-4">🔒</div>
                        <p style={{ color: 'var(--text-secondary)' }}>No scores yet. Start playing to fill the leaderboard!</p>
                        <Link href="/" className="inline-block mt-4">
                            <NeonButton color="green" size="md">
                                Play Now
                            </NeonButton>
                        </Link>
                    </motion.div>
                ) : (
                    <GlassCard className="overflow-hidden" hover={false}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr
                                        style={{
                                            borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
                                        }}
                                    >
                                        {['#', 'Player', 'Score', 'Mode', 'Level', 'Combo', 'Date'].map((h) => (
                                            <th
                                                key={h}
                                                className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                                                style={{
                                                    color: 'var(--text-secondary)',
                                                    fontFamily: "'Orbitron', sans-serif",
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((entry, i) => (
                                        <motion.tr
                                            key={entry.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            }}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <span
                                                    className="text-sm font-bold"
                                                    style={{
                                                        color: i === 0 ? 'var(--neon-yellow)' : i === 1 ? 'var(--text-secondary)' : i === 2 ? 'var(--neon-orange)' : 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                {entry.name}
                                            </td>
                                            <td
                                                className="px-4 py-3 font-bold"
                                                style={{ color: 'var(--neon-blue)', fontFamily: "'Orbitron', sans-serif" }}
                                            >
                                                {entry.score.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {MODE_LABELS[entry.mode]}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--neon-green)' }}>
                                                {entry.level}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--neon-purple)' }}>
                                                {entry.combo}x
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {new Date(entry.date).toLocaleDateString()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                )}
            </div>
        </main>
    );
}
