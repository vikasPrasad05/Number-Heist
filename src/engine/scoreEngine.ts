// ─── Score Engine ────────────────────────────────────────────

import { GAME_CONFIG } from '../lib/constants';

export interface ScoreState {
    score: number;
    combo: number;
    maxCombo: number;
    streak: number;
}

export function calculateScore(
    level: number,
    combo: number,
    timeRemaining: number,
    totalTime: number
): number {
    const baseScore = GAME_CONFIG.BASE_SCORE;
    const comboMult = Math.min(combo + 1, GAME_CONFIG.COMBO_MULTIPLIER_MAX);
    const levelBonus = level * GAME_CONFIG.LEVEL_BONUS;
    const timeFraction = timeRemaining / totalTime;
    const timeBonus = Math.round(timeFraction * GAME_CONFIG.TIME_BONUS_MULTIPLIER * 10);

    return Math.round((baseScore + levelBonus + timeBonus) * comboMult);
}

export function getComboMultiplier(combo: number): number {
    return Math.min(combo + 1, GAME_CONFIG.COMBO_MULTIPLIER_MAX);
}
