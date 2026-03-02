'use client';

import { motion } from 'framer-motion';

interface TimerBarProps {
    fraction: number; // 0 to 1
    timeRemaining: number;
}

export default function TimerBar({ fraction, timeRemaining }: TimerBarProps) {
    const getColor = () => {
        if (fraction > 0.5) return 'var(--neon-green)';
        if (fraction > 0.25) return 'var(--neon-yellow)';
        return 'var(--neon-red)';
    };

    const getShadow = () => {
        if (fraction > 0.5) return '0 0 15px rgba(0, 255, 136, 0.5)';
        if (fraction > 0.25) return '0 0 15px rgba(255, 221, 0, 0.5)';
        return '0 0 15px rgba(255, 51, 102, 0.6)';
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Time
                </span>
                <motion.span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: getColor() }}
                    animate={fraction <= 0.25 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                >
                    {timeRemaining.toFixed(1)}s
                </motion.span>
            </div>
            <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}
            >
                <motion.div
                    className="h-full rounded-full timer-bar"
                    style={{
                        width: `${fraction * 100}%`,
                        background: getColor(),
                        boxShadow: getShadow(),
                    }}
                    animate={fraction <= 0.25 ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                    transition={fraction <= 0.25 ? { repeat: Infinity, duration: 0.4 } : {}}
                />
            </div>
        </div>
    );
}
