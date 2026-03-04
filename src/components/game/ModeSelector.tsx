'use client';

import { motion } from 'framer-motion';
import { GameMode, MODE_LABELS, MODE_DESCRIPTIONS, MODE_ICONS } from '../../types/game';
import GlassCard from '../ui/GlassCard';

interface ModeSelectorProps {
    onSelectMode: (mode: GameMode) => void;
}

const modeColors: Record<GameMode, string> = {
    'speed-math': 'var(--neon-blue)',
    'pattern-recognition': 'var(--neon-green)',
    'hidden-operator': 'var(--neon-purple)',
    'multi-step-logic': 'var(--neon-orange)',
    'daily-challenge': 'var(--neon-yellow)',
    'remember-the-pattern': '#00eaff',
};

const modeGlows: Record<GameMode, 'blue' | 'green' | 'purple' | 'none'> = {
    'speed-math': 'blue',
    'pattern-recognition': 'green',
    'hidden-operator': 'purple',
    'multi-step-logic': 'blue',
    'daily-challenge': 'green',
    'remember-the-pattern': 'none',
};

const standardModes: GameMode[] = [
    'speed-math',
    'pattern-recognition',
    'hidden-operator',
    'multi-step-logic',
    'daily-challenge',
];

/** Animated neon memory-grid SVG icon */
function MemoryGridIcon() {
    const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const highlights = [0, 2, 4, 6, 8]; // diagonal pattern

    return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="glow-cell">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {cells.map((idx) => {
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const x = col * 16 + 1;
                const y = row * 16 + 1;
                const isHighlighted = highlights.includes(idx);
                return (
                    <motion.rect
                        key={idx}
                        x={x}
                        y={y}
                        width="12"
                        height="12"
                        rx="2"
                        fill={isHighlighted ? '#00eaff' : 'rgba(0,234,255,0.08)'}
                        stroke={isHighlighted ? '#00eaff' : 'rgba(0,234,255,0.3)'}
                        strokeWidth="0.8"
                        filter={isHighlighted ? 'url(#glow-cell)' : undefined}
                        animate={
                            isHighlighted
                                ? {
                                    opacity: [0.4, 1, 0.4],
                                    fill: ['#00eaff', '#b44dff', '#00eaff'],
                                }
                                : { opacity: [0.2, 0.5, 0.2] }
                        }
                        transition={{
                            duration: 1.6 + idx * 0.18,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                );
            })}
        </svg>
    );
}

export default function ModeSelector({ onSelectMode }: ModeSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl mx-auto">
            {/* Standard mode cards */}
            {standardModes.map((mode, i) => (
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                >
                    <GlassCard
                        onClick={() => onSelectMode(mode)}
                        glow={modeGlows[mode]}
                        className="p-6 md:p-8 cursor-pointer group"
                    >
                        <div className="text-4xl mb-4">{MODE_ICONS[mode]}</div>
                        <h3
                            className="text-lg font-bold mb-2 tracking-wider"
                            style={{
                                fontFamily: "'Orbitron', sans-serif",
                                color: modeColors[mode],
                            }}
                        >
                            {MODE_LABELS[mode]}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {MODE_DESCRIPTIONS[mode]}
                        </p>
                        <motion.div
                            className="mt-4 h-0.5 rounded-full"
                            style={{ background: modeColors[mode], opacity: 0.3 }}
                            whileHover={{ opacity: 1, scaleX: 1.1 }}
                        />
                    </GlassCard>
                </motion.div>
            ))}

            {/* ── REMEMBER THE PATTERN — sixth card ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: standardModes.length * 0.1, type: 'spring', stiffness: 100 }}
                className="relative"
            >
                {/* Holographic animated border */}
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ zIndex: 1, padding: '1.5px' }}
                    animate={{
                        background: [
                            'linear-gradient(0deg,   #00eaff, #b44dff, #00ff88, #00eaff)',
                            'linear-gradient(120deg, #b44dff, #00ff88, #00eaff, #b44dff)',
                            'linear-gradient(240deg, #00ff88, #00eaff, #b44dff, #00ff88)',
                            'linear-gradient(360deg, #00eaff, #b44dff, #00ff88, #00eaff)',
                        ],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                >
                    <div
                        className="w-full h-full rounded-2xl"
                        style={{ background: 'transparent' }}
                    />
                </motion.div>

                <motion.div
                    onClick={() => onSelectMode('remember-the-pattern')}
                    className="relative cursor-pointer rounded-2xl p-6 md:p-8 overflow-hidden"
                    style={{
                        zIndex: 2,
                        background: 'linear-gradient(135deg, rgba(0,10,40,0.97) 0%, rgba(0,30,70,0.95) 60%, rgba(0,15,50,0.97) 100%)',
                        border: '1px solid rgba(0,234,255,0.25)',
                        boxShadow: '0 0 30px rgba(0,234,255,0.12), inset 0 0 40px rgba(0,10,40,0.5)',
                    }}
                    whileHover={{
                        scale: 1.045,
                        y: -4,
                        boxShadow: '0 0 50px rgba(0,234,255,0.35), 0 0 100px rgba(180,77,255,0.15), inset 0 0 40px rgba(0,10,40,0.4)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                >
                    {/* Subtle scan-line overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none rounded-2xl"
                        style={{
                            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,234,255,0.025) 3px, rgba(0,234,255,0.025) 4px)',
                        }}
                    />

                    {/* Animated corner accents */}
                    {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                        <motion.div
                            key={i}
                            className={`absolute ${pos} w-4 h-4 pointer-events-none`}
                            style={{
                                borderTop: i < 2 ? '1.5px solid #00eaff' : 'none',
                                borderBottom: i >= 2 ? '1.5px solid #00eaff' : 'none',
                                borderLeft: i % 2 === 0 ? '1.5px solid #00eaff' : 'none',
                                borderRight: i % 2 === 1 ? '1.5px solid #00eaff' : 'none',
                            }}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        />
                    ))}

                    {/* Icon */}
                    <div className="mb-4 relative" style={{ width: 48, height: 48 }}>
                        <MemoryGridIcon />
                    </div>

                    {/* Title */}
                    <h3
                        className="text-lg font-bold mb-2 tracking-wider"
                        style={{
                            fontFamily: "'Orbitron', sans-serif",
                            color: '#00eaff',
                            textShadow: '0 0 12px rgba(0,234,255,0.6)',
                        }}
                    >
                        Remember The Pattern
                    </h3>

                    {/* Tagline */}
                    <p className="text-sm leading-relaxed relative z-10" style={{ color: 'rgba(180,220,255,0.65)' }}>
                        Train your brain. Recall the sequence. Beat the clock.
                    </p>

                    {/* Animated bottom bar */}
                    <motion.div
                        className="mt-4 h-0.5 rounded-full relative z-10"
                        style={{
                            background: 'linear-gradient(90deg, #00eaff, #b44dff, #00ff88)',
                            opacity: 0.35,
                        }}
                        whileHover={{ opacity: 1, scaleX: 1.08 }}
                        animate={{ scaleX: [0.85, 1, 0.85] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* NEW badge */}
                    <motion.div
                        className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
                        style={{
                            background: 'rgba(0,234,255,0.15)',
                            border: '1px solid rgba(0,234,255,0.5)',
                            color: '#00eaff',
                            fontFamily: "'Orbitron', sans-serif",
                        }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        NEW
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}
