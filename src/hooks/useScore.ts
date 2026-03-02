'use client';

import { useState, useCallback } from 'react';
import { calculateScore, getComboMultiplier } from '../engine/scoreEngine';

export function useScore() {
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [streak, setStreak] = useState(0);

    const addCorrect = useCallback((level: number, timeRemaining: number, totalTime: number) => {
        const points = calculateScore(level, combo, timeRemaining, totalTime);
        setScore(prev => prev + points);
        setCombo(prev => {
            const newCombo = prev + 1;
            setMaxCombo(mc => Math.max(mc, newCombo));
            return newCombo;
        });
        setStreak(prev => prev + 1);
        return points;
    }, [combo]);

    const breakCombo = useCallback(() => {
        setCombo(0);
    }, []);

    const resetScore = useCallback(() => {
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setStreak(0);
    }, []);

    return {
        score,
        combo,
        maxCombo,
        streak,
        multiplier: getComboMultiplier(combo),
        addCorrect,
        breakCombo,
        resetScore,
    };
}
