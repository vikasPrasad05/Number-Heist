'use client';

import { useState, useCallback, useEffect } from 'react';
import { LeaderboardEntry, GameMode } from '../types/game';

const STORAGE_KEY = 'number-heist-leaderboard';
const MAX_ENTRIES = 20;

function loadLeaderboard(): LeaderboardEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Storage full or unavailable
    }
}

export function useLeaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        setEntries(loadLeaderboard());
    }, []);

    const addEntry = useCallback((name: string, score: number, mode: GameMode, level: number, combo: number) => {
        const entry: LeaderboardEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name,
            score,
            mode,
            level,
            combo,
            date: new Date().toISOString(),
        };

        setEntries(prev => {
            const updated = [...prev, entry]
                .sort((a, b) => b.score - a.score)
                .slice(0, MAX_ENTRIES);
            saveLeaderboard(updated);
            return updated;
        });

        return entry;
    }, []);

    const getHighScore = useCallback((mode?: GameMode): number => {
        const filtered = mode ? entries.filter(e => e.mode === mode) : entries;
        return filtered.length > 0 ? Math.max(...filtered.map(e => e.score)) : 0;
    }, [entries]);

    const clearLeaderboard = useCallback(() => {
        setEntries([]);
        saveLeaderboard([]);
    }, []);

    return {
        entries,
        addEntry,
        getHighScore,
        clearLeaderboard,
    };
}
