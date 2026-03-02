'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface ScoreCounterProps {
    score: number;
    combo: number;
    multiplier: number;
}

export default function ScoreCounter({ score, combo, multiplier }: ScoreCounterProps) {
    const springScore = useSpring(0, { stiffness: 100, damping: 30 });
    const displayScore = useTransform(springScore, (v) => Math.round(v));

    useEffect(() => {
        springScore.set(score);
    }, [score, springScore]);

    return (
        <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Score
                </div>
                <motion.div
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: 'var(--neon-blue)', fontFamily: "'Orbitron', sans-serif" }}
                >
                    <motion.span>{displayScore}</motion.span>
                </motion.div>
            </div>

            {combo > 0 && (
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="px-3 py-1 rounded-lg text-center"
                    style={{
                        background: 'rgba(0, 255, 136, 0.15)',
                        border: '1px solid rgba(0, 255, 136, 0.4)',
                    }}
                >
                    <div className="text-xs" style={{ color: 'var(--neon-green)' }}>
                        {multiplier}x
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        ×{combo} combo
                    </div>
                </motion.div>
            )}
        </div>
    );
}
