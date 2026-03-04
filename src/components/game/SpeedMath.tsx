'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeedMathPuzzle } from '../../types/game';

interface SpeedMathProps {
    puzzle: SpeedMathPuzzle;
    onAnswer: (correct: boolean) => void;
    locked?: boolean;
}

export default function SpeedMath({ puzzle, onAnswer, locked = false }: SpeedMathProps) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInput('');
        inputRef.current?.focus();
    }, [puzzle]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim() || locked) return;
            const userAnswer = parseFloat(input);
            onAnswer(userAnswer === puzzle.answer);
        },
        [input, puzzle.answer, onAnswer, locked]
    );

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={puzzle.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Solve the equation
                </div>

                <motion.div
                    className="text-4xl md:text-6xl font-bold tracking-wider"
                    style={{
                        fontFamily: "'Orbitron', sans-serif",
                        color: 'var(--neon-blue)',
                        textShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
                    }}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    {puzzle.question} = ?
                </motion.div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-4">
                    <input
                        ref={inputRef}
                        type="number"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Your answer"
                        className="w-48 px-5 py-3 text-2xl text-center rounded-xl outline-none"
                        style={{
                            background: 'rgba(0, 212, 255, 0.08)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            color: 'var(--text-primary)',
                            fontFamily: "'Orbitron', sans-serif",
                            opacity: locked ? 0.5 : 1,
                        }}
                        disabled={locked}
                        readOnly={locked}
                        autoFocus
                    />
                    <motion.button
                        type="submit"
                        className="px-8 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider"
                        style={{
                            background: 'rgba(0, 255, 136, 0.15)',
                            border: '1px solid rgba(0, 255, 136, 0.5)',
                            color: 'var(--neon-green)',
                            fontFamily: "'Orbitron', sans-serif",
                            opacity: locked ? 0.4 : 1,
                            pointerEvents: locked ? 'none' : 'auto',
                        }}
                        whileHover={locked ? {} : { scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}
                        whileTap={locked ? {} : { scale: 0.95 }}
                        disabled={locked}
                    >
                        Submit ↵
                    </motion.button>
                </form>
            </motion.div>
        </AnimatePresence>
    );
}
