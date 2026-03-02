'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatternPuzzle } from '../../types/game';

interface PatternRecognitionProps {
    puzzle: PatternPuzzle;
    onAnswer: (correct: boolean) => void;
}

export default function PatternRecognition({ puzzle, onAnswer }: PatternRecognitionProps) {
    const [input, setInput] = useState('');
    const [showHint, setShowHint] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInput('');
        setShowHint(false);
        inputRef.current?.focus();
    }, [puzzle]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim()) return;
            const userAnswer = parseFloat(input);
            onAnswer(userAnswer === puzzle.answer);
        },
        [input, puzzle.answer, onAnswer]
    );

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={puzzle.sequence.join(',')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Find the next number
                </div>

                <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
                    {puzzle.sequence.map((num, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring' }}
                            className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-xl text-xl md:text-2xl font-bold"
                            style={{
                                background: 'rgba(0, 212, 255, 0.1)',
                                border: '1px solid rgba(0, 212, 255, 0.3)',
                                color: 'var(--neon-blue)',
                                fontFamily: "'Orbitron', sans-serif",
                            }}
                        >
                            {num}
                        </motion.div>
                    ))}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: puzzle.sequence.length * 0.1, type: 'spring' }}
                        className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-xl text-2xl font-bold"
                        style={{
                            background: 'rgba(0, 255, 136, 0.1)',
                            border: '2px dashed rgba(0, 255, 136, 0.5)',
                            color: 'var(--neon-green)',
                            fontFamily: "'Orbitron', sans-serif",
                        }}
                    >
                        ?
                    </motion.div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-2">
                    <input
                        ref={inputRef}
                        type="number"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Next number"
                        className="w-48 px-5 py-3 text-2xl text-center rounded-xl outline-none"
                        style={{
                            background: 'rgba(0, 212, 255, 0.08)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            color: 'var(--text-primary)',
                            fontFamily: "'Orbitron', sans-serif",
                        }}
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <motion.button
                            type="submit"
                            className="px-8 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider"
                            style={{
                                background: 'rgba(0, 255, 136, 0.15)',
                                border: '1px solid rgba(0, 255, 136, 0.5)',
                                color: 'var(--neon-green)',
                                fontFamily: "'Orbitron', sans-serif",
                            }}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Submit ↵
                        </motion.button>
                        <motion.button
                            type="button"
                            onClick={() => setShowHint(true)}
                            className="px-4 py-3 rounded-xl text-sm uppercase tracking-wider"
                            style={{
                                background: 'rgba(180, 77, 255, 0.1)',
                                border: '1px solid rgba(180, 77, 255, 0.3)',
                                color: 'var(--neon-purple)',
                                fontFamily: "'Orbitron', sans-serif",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Hint
                        </motion.button>
                    </div>
                </form>

                <AnimatePresence>
                    {showHint && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm px-4 py-2 rounded-lg"
                            style={{
                                background: 'rgba(180, 77, 255, 0.1)',
                                border: '1px solid rgba(180, 77, 255, 0.2)',
                                color: 'var(--neon-purple)',
                            }}
                        >
                            💡 {puzzle.hint}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
