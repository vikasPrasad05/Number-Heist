// ─── Game Constants ──────────────────────────────────────────

export const GAME_CONFIG = {
    // Timer settings (in seconds)
    BASE_TIME: {
        'speed-math': 10,
        'pattern-recognition': 15,
        'hidden-operator': 8,
        'multi-step-logic': 20,
        'daily-challenge': 12,
        'remember-the-pattern': 15,
    },
    TIME_REDUCTION_PER_LEVEL: 0.5,
    MIN_TIME: 3,

    // Score settings
    BASE_SCORE: 100,
    COMBO_MULTIPLIER_MAX: 5,
    LEVEL_BONUS: 50,
    TIME_BONUS_MULTIPLIER: 10,

    // Level progression
    QUESTIONS_PER_LEVEL: 5,
    MAX_LEVEL: 20,

    // Daily challenge
    DAILY_PUZZLE_COUNT: 10,

    // Animation durations (ms)
    ANSWER_FEEDBACK_DURATION: 600,
    LEVEL_UP_DURATION: 1500,
} as const;

export const NEON_COLORS = {
    blue: '#00d4ff',
    green: '#00ff88',
    red: '#ff3366',
    purple: '#b44dff',
    yellow: '#ffdd00',
    orange: '#ff8800',
} as const;
