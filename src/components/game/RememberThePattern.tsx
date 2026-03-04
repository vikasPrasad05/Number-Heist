'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RememberPatternPuzzle } from '../../types/game';

interface RememberThePatternProps {
    level: number;
    correctAnswers: number;
    onAnswer: (correct: boolean) => void;
    locked?: boolean;
    syncedPuzzle?: RememberPatternPuzzle;
}

type Phase = 'memorize' | 'input';

function generateSequence(length: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

const CYAN = '#00eaff';
const PURPLE = '#b44dff';
const GREEN = '#00ff88';
const YELLOW = '#ffdd00';
const RED = '#ff3366';

export default function RememberThePattern({ level, correctAnswers, onAnswer, locked = false, syncedPuzzle }: RememberThePatternProps) {
    // Requirements: Starting with 3 digits, increase by 1 each correct answer.
    const seqLen = syncedPuzzle?.sequence.length || (3 + correctAnswers);
    // Requirements: Display for 3 seconds. Slightly reduce display time as difficulty increases.
    const displayTime = Math.max(1.0, 3.0 - (correctAnswers * 0.1));

    const [sequence] = useState<number[]>(() => syncedPuzzle ? syncedPuzzle.sequence : generateSequence(seqLen));
    const [phase, setPhase] = useState<Phase>('memorize');
    const [userInput, setUserInput] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(displayTime);
    const [visibleCount, setVisibleCount] = useState(0);
    const [isWrong, setIsWrong] = useState(false);

    const submittedRef = useRef(false);
    const countdownActiveRef = useRef(false);

    // ── Phase 1: Staggered Neon Reveal ──
    useEffect(() => {
        let itemsProcessed = 0;
        const revealInterval = setInterval(() => {
            setVisibleCount(prev => {
                if (prev < seqLen) return prev + 1;
                clearInterval(revealInterval);
                return prev;
            });
        }, 150);

        // Wait for all to reveal, then start the 3s (displayTime) countdown
        const totalRevealTime = seqLen * 150 + 200;
        const timerTimeout = setTimeout(() => {
            countdownActiveRef.current = true;
            const startTime = Date.now();
            const tick = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const remaining = Math.max(0, displayTime - elapsed);
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    clearInterval(tick);
                    setPhase('input');
                }
            }, 50);
            return () => clearInterval(tick);
        }, totalRevealTime);

        return () => {
            clearInterval(revealInterval);
            clearTimeout(timerTimeout);
        };
    }, [seqLen, displayTime]);

    // ── Handle Input ──
    const handleDigit = useCallback((digit: number) => {
        if (phase !== 'input' || locked || submittedRef.current || isWrong) return;

        setUserInput(prev => {
            const next = [...prev, digit];

            // Check if correct so far
            if (next[next.length - 1] !== sequence[next.length - 1]) {
                // WRONG - Failure Animation
                setIsWrong(true);
                submittedRef.current = true;
                setTimeout(() => onAnswer(false), 800);
                return next;
            }

            // Check if complete
            if (next.length === seqLen) {
                submittedRef.current = true;
                setTimeout(() => onAnswer(true), 200);
            }
            return next;
        });
    }, [phase, locked, sequence, seqLen, onAnswer, isWrong]);

    const handleBackspace = useCallback(() => {
        if (phase !== 'input' || locked || submittedRef.current || isWrong) return;
        setUserInput(prev => prev.slice(0, -1));
    }, [phase, locked, isWrong]);

    const fraction = countdownActiveRef.current ? timeLeft / displayTime : 1;
    const barColor = fraction > 0.6 ? CYAN : fraction > 0.3 ? YELLOW : RED;

    const keypadRows = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ];

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto px-4">
            {/* Header / Timer Bar Area */}
            <div className="w-full flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                    <motion.div
                        className="text-[10px] uppercase tracking-[0.4em] font-bold"
                        style={{ color: phase === 'memorize' ? CYAN : PURPLE }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {phase === 'memorize' ? 'MEMORY BUFFER' : 'SEQUENCE RECALL'}
                    </motion.div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60">
                        Length: <span style={{ color: CYAN }}>{seqLen}</span>
                    </div>
                </div>

                {/* Internal Countdown Bar */}
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <motion.div
                        className="h-full relative z-10"
                        style={{
                            background: barColor,
                            boxShadow: `0 0 10px ${barColor}`
                        }}
                        animate={{ width: phase === 'memorize' ? `${(timeLeft / displayTime) * 100}%` : '100%' }}
                        transition={{ duration: 0.1 }}
                    />
                    {/* Background track pulse */}
                    <div className="absolute inset-0 bg-white/5 animate-pulse" />
                </div>
            </div>

            {/* Phase Instructions */}
            <div className="text-xs uppercase tracking-widest opacity-40 text-center">
                {phase === 'memorize' ? 'Memorize every digit precisely' : 'Enter the exact sequence'}
            </div>

            {/* Main Display Area */}
            <div className="relative w-full py-8 flex items-center justify-center min-h-[160px]">
                <AnimatePresence mode="wait">
                    {phase === 'memorize' ? (
                        <motion.div
                            key="mem-grid"
                            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                            className="flex flex-wrap justify-center gap-3"
                        >
                            {sequence.map((digit, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20, rotateX: 90 }}
                                    animate={i < visibleCount ? {
                                        opacity: 1,
                                        y: 0,
                                        rotateX: 0,
                                        boxShadow: `0 0 20px ${CYAN}44`,
                                    } : {}}
                                    className="w-14 h-18 md:w-16 md:h-20 flex items-center justify-center rounded-xl text-3xl font-black"
                                    style={{
                                        background: 'rgba(0,234,255,0.05)',
                                        border: `2px solid ${CYAN}88`,
                                        color: CYAN,
                                        fontFamily: "'Orbitron', sans-serif",
                                        textShadow: `0 0 15px ${CYAN}`,
                                    }}
                                >
                                    {digit}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="input-grid"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex flex-wrap justify-center gap-3 ${isWrong ? 'animate-shake' : ''}`}
                        >
                            {sequence.map((_, i) => {
                                const isFilled = i < userInput.length;
                                const isCurrent = i === userInput.length;
                                return (
                                    <div
                                        key={i}
                                        className="w-12 h-16 md:w-14 md:h-18 flex items-center justify-center rounded-xl text-2xl font-bold transition-all duration-200"
                                        style={{
                                            background: isWrong ? 'rgba(255,51,102,0.1)' : isFilled ? 'rgba(180,77,255,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: `2px solid ${isWrong ? RED : isFilled ? PURPLE : isCurrent ? CYAN : 'rgba(255,255,255,0.1)'}`,
                                            color: isWrong ? RED : isFilled ? PURPLE : CYAN,
                                            boxShadow: isWrong ? `0 0 20px ${RED}44` : isFilled ? `0 0 15px ${PURPLE}44` : 'none',
                                            textShadow: isWrong ? `0 0 10px ${RED}` : isFilled ? `0 0 10px ${PURPLE}` : 'none',
                                        }}
                                    >
                                        {isFilled ? userInput[i] : isCurrent ? <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>_</motion.span> : ''}
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Keypad */}
            {phase === 'input' && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3 w-full max-w-[300px]"
                >
                    {keypadRows.map((row, i) => (
                        <div key={i} className="flex gap-3">
                            {row.map(num => (
                                <KeyBtn key={num} label={num} onClick={() => handleDigit(num)} disabled={locked || isWrong} />
                            ))}
                        </div>
                    ))}
                    <div className="flex gap-3">
                        <KeyBtn label="⌫" color={YELLOW} onClick={handleBackspace} disabled={locked || isWrong || userInput.length === 0} />
                        <KeyBtn label="0" onClick={() => handleDigit(0)} disabled={locked || isWrong} />
                        <div className="flex-1" />
                    </div>
                </motion.div>
            )}

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
                    20%, 40%, 60%, 80% { transform: translateX(6px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
}

function KeyBtn({ label, onClick, disabled, color = CYAN }: { label: string | number, onClick: () => void, disabled?: boolean, color?: string }) {
    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.05, boxShadow: `0 0 15px ${color}44` } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={onClick}
            disabled={disabled}
            className="flex-1 h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-colors"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : color + '44'}`,
                color: disabled ? 'rgba(255,255,255,0.1)' : color,
                fontFamily: "'Orbitron', sans-serif",
                cursor: disabled ? 'default' : 'pointer'
            }}
        >
            {label}
        </motion.button>
    );
}
