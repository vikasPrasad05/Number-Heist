'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiddenOperatorPuzzle, Operator } from '../../types/game';

interface HiddenOperatorProps {
    puzzle: HiddenOperatorPuzzle;
    onAnswer: (correct: boolean) => void;
}

const operatorLabels: Record<Operator, string> = {
    '+': '+',
    '-': '−',
    '×': '×',
    '÷': '÷',
};

export default function HiddenOperator({ puzzle, onAnswer }: HiddenOperatorProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const keyMap: Record<string, Operator> = {
                '1': puzzle.choices[0],
                '2': puzzle.choices[1],
                '3': puzzle.choices[2],
                '4': puzzle.choices[3],
            };
            if (keyMap[e.key]) {
                onAnswer(keyMap[e.key] === puzzle.answer);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [puzzle, onAnswer]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${puzzle.left}-${puzzle.right}-${puzzle.result}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-8"
            >
                <div className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-secondary)' }}>
                    Find the missing operator
                </div>

                <div className="flex items-center gap-3 md:gap-5">
                    <motion.span
                        className="text-4xl md:text-6xl font-bold"
                        style={{ color: 'var(--neon-blue)', fontFamily: "'Orbitron', sans-serif" }}
                    >
                        {puzzle.left}
                    </motion.span>

                    <motion.div
                        className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-xl text-3xl font-bold"
                        style={{
                            background: 'rgba(0, 255, 136, 0.1)',
                            border: '2px dashed rgba(0, 255, 136, 0.5)',
                            color: 'var(--neon-green)',
                        }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        ?
                    </motion.div>

                    <motion.span
                        className="text-4xl md:text-6xl font-bold"
                        style={{ color: 'var(--neon-blue)', fontFamily: "'Orbitron', sans-serif" }}
                    >
                        {puzzle.right}
                    </motion.span>

                    <span
                        className="text-4xl md:text-5xl font-bold"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        =
                    </span>

                    <motion.span
                        className="text-4xl md:text-6xl font-bold"
                        style={{
                            color: 'var(--neon-purple)',
                            fontFamily: "'Orbitron', sans-serif",
                            textShadow: '0 0 15px rgba(180, 77, 255, 0.4)',
                        }}
                    >
                        {puzzle.result}
                    </motion.span>
                </div>

                <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
                    {puzzle.choices.map((op, i) => (
                        <motion.button
                            key={op}
                            onClick={() => onAnswer(op === puzzle.answer)}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-xl text-2xl md:text-3xl font-bold relative"
                            style={{
                                background: 'rgba(0, 212, 255, 0.08)',
                                border: '1px solid rgba(0, 212, 255, 0.3)',
                                color: 'var(--neon-blue)',
                                fontFamily: "'Orbitron', sans-serif",
                            }}
                            whileHover={{
                                scale: 1.1,
                                background: 'rgba(0, 212, 255, 0.2)',
                                boxShadow: '0 0 25px rgba(0, 212, 255, 0.3)',
                            }}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <span className="absolute top-1 left-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                {i + 1}
                            </span>
                            {operatorLabels[op]}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
