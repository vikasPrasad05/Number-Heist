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
};

const modeGlows: Record<GameMode, 'blue' | 'green' | 'purple' | 'none'> = {
    'speed-math': 'blue',
    'pattern-recognition': 'green',
    'hidden-operator': 'purple',
    'multi-step-logic': 'blue',
    'daily-challenge': 'green',
};

const modes: GameMode[] = [
    'speed-math',
    'pattern-recognition',
    'hidden-operator',
    'multi-step-logic',
    'daily-challenge',
];

export default function ModeSelector({ onSelectMode }: ModeSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl mx-auto">
            {modes.map((mode, i) => (
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
        </div>
    );
}
