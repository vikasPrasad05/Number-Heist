'use client';

import { useState, useCallback, useRef } from 'react';
import { GameMode, Puzzle } from '../types/game';
import { generatePuzzle, generateDailyChallenge } from '../engine/puzzleGenerators';
import { GAME_CONFIG } from '../lib/constants';

interface GameStateHook {
    mode: GameMode | null;
    level: number;
    questionsAnswered: number;
    correctAnswers: number;
    isPlaying: boolean;
    isGameOver: boolean;
    currentPuzzle: Puzzle | null;
    totalTime: number;
    feedbackState: 'correct' | 'wrong' | null;
    startGame: (mode: GameMode) => void;
    nextPuzzle: () => void;
    markCorrect: () => boolean; // returns true if leveled up
    markWrong: () => void;
    endGame: () => void;
    resetGame: () => void;
    setFeedback: (state: 'correct' | 'wrong' | null) => void;
}

export function useGameState(): GameStateHook {
    const [mode, setMode] = useState<GameMode | null>(null);
    const [level, setLevel] = useState(1);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
    const [feedbackState, setFeedbackState] = useState<'correct' | 'wrong' | null>(null);

    const dailyPuzzlesRef = useRef<Puzzle[]>([]);
    const dailyIndexRef = useRef(0);

    const getTotalTime = useCallback((l: number, m: GameMode | null): number => {
        if (!m) return 10;
        const base = GAME_CONFIG.BASE_TIME[m] || 10;
        const reduction = (l - 1) * GAME_CONFIG.TIME_REDUCTION_PER_LEVEL;
        return Math.max(base - reduction, GAME_CONFIG.MIN_TIME);
    }, []);

    const [totalTime, setTotalTime] = useState(10);

    const startGame = useCallback((selectedMode: GameMode) => {
        setMode(selectedMode);
        setLevel(1);
        setQuestionsAnswered(0);
        setCorrectAnswers(0);
        setIsPlaying(true);
        setIsGameOver(false);
        setFeedbackState(null);

        if (selectedMode === 'daily-challenge') {
            const puzzles = generateDailyChallenge();
            dailyPuzzlesRef.current = puzzles;
            dailyIndexRef.current = 0;
            setCurrentPuzzle(puzzles[0]);
            setTotalTime(GAME_CONFIG.BASE_TIME['daily-challenge']);
        } else {
            const puzzle = generatePuzzle(selectedMode, 1);
            setCurrentPuzzle(puzzle);
            setTotalTime(getTotalTime(1, selectedMode));
        }
    }, [getTotalTime]);

    const nextPuzzle = useCallback(() => {
        if (!mode) return;

        if (mode === 'daily-challenge') {
            dailyIndexRef.current += 1;
            if (dailyIndexRef.current >= dailyPuzzlesRef.current.length) {
                setIsPlaying(false);
                setIsGameOver(true);
                return;
            }
            setCurrentPuzzle(dailyPuzzlesRef.current[dailyIndexRef.current]);
        } else {
            const puzzle = generatePuzzle(mode, level);
            setCurrentPuzzle(puzzle);
            setTotalTime(getTotalTime(level, mode));
        }
    }, [mode, level, getTotalTime]);

    const markCorrect = useCallback((): boolean => {
        setQuestionsAnswered(prev => prev + 1);
        setCorrectAnswers(prev => prev + 1);

        let leveledUp = false;
        if (mode !== 'daily-challenge' && (correctAnswers + 1) % GAME_CONFIG.QUESTIONS_PER_LEVEL === 0) {
            const newLevel = Math.min(level + 1, GAME_CONFIG.MAX_LEVEL);
            setLevel(newLevel);
            leveledUp = newLevel !== level;
        }

        return leveledUp;
    }, [correctAnswers, level, mode]);

    const markWrong = useCallback(() => {
        setQuestionsAnswered(prev => prev + 1);
    }, []);

    const endGame = useCallback(() => {
        setIsPlaying(false);
        setIsGameOver(true);
    }, []);

    const resetGame = useCallback(() => {
        setMode(null);
        setLevel(1);
        setQuestionsAnswered(0);
        setCorrectAnswers(0);
        setIsPlaying(false);
        setIsGameOver(false);
        setCurrentPuzzle(null);
        setFeedbackState(null);
    }, []);

    return {
        mode,
        level,
        questionsAnswered,
        correctAnswers,
        isPlaying,
        isGameOver,
        currentPuzzle,
        totalTime,
        feedbackState,
        startGame,
        nextPuzzle,
        markCorrect,
        markWrong,
        endGame,
        resetGame,
        setFeedback: setFeedbackState,
    };
}
