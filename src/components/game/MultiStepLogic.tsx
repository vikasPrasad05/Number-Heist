'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MultiStepPuzzle } from '../../types/game';

interface MultiStepLogicProps {
    puzzle: MultiStepPuzzle;
    onAnswer: (correct: boolean) => void;
    locked?: boolean;
}

export default function MultiStepLogic({ puzzle, onAnswer, locked = false }: MultiStepLogicProps) {
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
                key={puzzle.equations.join('|')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Solve the logic chain
                </div>

                <div className="flex flex-col gap-3 w-full max-w-md">
                    {puzzle.equations.map((eq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="px-5 py-3 rounded-xl text-lg md:text-xl font-mono"
                            style={{
                                background: 'rgba(0, 212, 255, 0.06)',
                                border: '1px solid rgba(0, 212, 255, 0.15)',
                                color: 'var(--neon-blue)',
                            }}
                        >
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginRight: '12px' }}>
                                {i + 1}.
                            </span>
                            {eq}
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: puzzle.equations.length * 0.15 }}
                    className="px-5 py-3 rounded-xl text-base font-semibold"
                    style={{
                        background: 'rgba(0, 255, 136, 0.08)',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        color: 'var(--neon-green)',
                        fontFamily: "'Orbitron', sans-serif",
                    }}
                >
                    🎯 {puzzle.question}
                </motion.div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-2">
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
