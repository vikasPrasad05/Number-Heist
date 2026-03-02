// ─── Game Types ───────────────────────────────────────────────

export type GameMode = 'speed-math' | 'pattern-recognition' | 'hidden-operator' | 'multi-step-logic' | 'daily-challenge';

export type Operator = '+' | '-' | '×' | '÷';

export interface SpeedMathPuzzle {
    type: 'speed-math';
    question: string;
    answer: number;
    operands: number[];
    operators: Operator[];
}

export interface PatternPuzzle {
    type: 'pattern-recognition';
    sequence: number[];
    answer: number;
    hint: string;
}

export interface HiddenOperatorPuzzle {
    type: 'hidden-operator';
    left: number;
    right: number;
    result: number;
    answer: Operator;
    choices: Operator[];
}

export interface MultiStepPuzzle {
    type: 'multi-step-logic';
    equations: string[];
    question: string;
    answer: number;
}

export type Puzzle = SpeedMathPuzzle | PatternPuzzle | HiddenOperatorPuzzle | MultiStepPuzzle;

export interface GameState {
    mode: GameMode | null;
    level: number;
    score: number;
    combo: number;
    maxCombo: number;
    streak: number;
    questionsAnswered: number;
    correctAnswers: number;
    isPlaying: boolean;
    isGameOver: boolean;
    currentPuzzle: Puzzle | null;
    timeRemaining: number;
    totalTime: number;
}

export interface LeaderboardEntry {
    id: string;
    name: string;
    score: number;
    mode: GameMode;
    level: number;
    combo: number;
    date: string;
}

export interface DailyChallenge {
    date: string;
    puzzles: Puzzle[];
    completed: boolean;
    score: number;
}

export const MODE_LABELS: Record<GameMode, string> = {
    'speed-math': 'Speed Math',
    'pattern-recognition': 'Pattern Recognition',
    'hidden-operator': 'Hidden Operator',
    'multi-step-logic': 'Multi-Step Logic',
    'daily-challenge': 'Daily Challenge',
};

export const MODE_DESCRIPTIONS: Record<GameMode, string> = {
    'speed-math': 'Solve rapid arithmetic under pressure',
    'pattern-recognition': 'Predict the next number in the sequence',
    'hidden-operator': 'Find the missing operator',
    'multi-step-logic': 'Solve multi-variable equations',
    'daily-challenge': 'A fresh set of mixed puzzles every day',
};

export const MODE_ICONS: Record<GameMode, string> = {
    'speed-math': '⚡',
    'pattern-recognition': '🔢',
    'hidden-operator': '❓',
    'multi-step-logic': '🧠',
    'daily-challenge': '📅',
};
