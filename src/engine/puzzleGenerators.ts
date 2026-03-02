// ─── Puzzle Generation Engine ────────────────────────────────

import {
    SpeedMathPuzzle,
    PatternPuzzle,
    HiddenOperatorPuzzle,
    MultiStepPuzzle,
    Operator,
    Puzzle,
} from '../types/game';

// ─── Utilities ───────────────────────────────────────────────

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function seededRandInt(rng: () => number, min: number, max: number): number {
    return Math.floor(rng() * (max - min + 1)) + min;
}

// ─── Speed Math ──────────────────────────────────────────────

export function generateSpeedMath(level: number): SpeedMathPuzzle {
    const maxNum = Math.min(10 + level * 5, 100);
    const operators: Operator[] = ['+', '-', '×', '÷'];
    const availableOps = level < 3 ? ['+', '-'] as Operator[] : operators;

    const op = availableOps[randInt(0, availableOps.length - 1)];
    let a: number, b: number, answer: number;

    switch (op) {
        case '+':
            a = randInt(1, maxNum);
            b = randInt(1, maxNum);
            answer = a + b;
            break;
        case '-':
            a = randInt(1, maxNum);
            b = randInt(1, a);
            answer = a - b;
            break;
        case '×':
            a = randInt(1, Math.min(maxNum, 20));
            b = randInt(1, Math.min(maxNum, 12));
            answer = a * b;
            break;
        case '÷':
            b = randInt(1, Math.min(maxNum, 12));
            answer = randInt(1, Math.min(maxNum, 12));
            a = b * answer;
            break;
        default:
            a = 1; b = 1; answer = 2;
    }

    return {
        type: 'speed-math',
        question: `${a} ${op} ${b}`,
        answer,
        operands: [a, b],
        operators: [op],
    };
}

// ─── Pattern Recognition ────────────────────────────────────

type PatternType = 'arithmetic' | 'geometric' | 'fibonacci' | 'squares' | 'primes' | 'triangular';

function generateArithmeticSeq(level: number): { seq: number[]; answer: number; hint: string } {
    const diff = randInt(2, 5 + level);
    const start = randInt(1, 10 + level * 2);
    const length = 5;
    const seq: number[] = [];
    for (let i = 0; i < length; i++) seq.push(start + diff * i);
    const answer = start + diff * length;
    return { seq, answer, hint: `Each number increases by ${diff}` };
}

function generateGeometricSeq(level: number): { seq: number[]; answer: number; hint: string } {
    const ratio = randInt(2, Math.min(3 + Math.floor(level / 2), 5));
    const start = randInt(1, 4);
    const length = 5;
    const seq: number[] = [];
    for (let i = 0; i < length; i++) seq.push(start * Math.pow(ratio, i));
    const answer = start * Math.pow(ratio, length);
    return { seq, answer, hint: `Each number is multiplied by ${ratio}` };
}

function generateFibonacciSeq(): { seq: number[]; answer: number; hint: string } {
    const a = randInt(1, 5);
    const b = randInt(1, 5);
    const seq = [a, b];
    for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]);
    const answer = seq[seq.length - 1] + seq[seq.length - 2];
    return { seq, answer, hint: 'Each number is the sum of the two preceding numbers' };
}

function generateSquaresSeq(): { seq: number[]; answer: number; hint: string } {
    const start = randInt(1, 5);
    const seq: number[] = [];
    for (let i = start; i < start + 5; i++) seq.push(i * i);
    const answer = (start + 5) * (start + 5);
    return { seq, answer, hint: 'These are consecutive perfect squares' };
}

function generateTriangularSeq(): { seq: number[]; answer: number; hint: string } {
    const seq: number[] = [];
    for (let i = 1; i <= 6; i++) seq.push((i * (i + 1)) / 2);
    const answer = (7 * 8) / 2;
    return { seq: seq.slice(0, 5), answer: seq[5], hint: 'These are triangular numbers' };
}

export function generatePatternPuzzle(level: number): PatternPuzzle {
    const types: PatternType[] = ['arithmetic', 'geometric'];
    if (level >= 2) types.push('fibonacci');
    if (level >= 4) types.push('squares');
    if (level >= 6) types.push('triangular');

    const type = types[randInt(0, types.length - 1)];
    let result: { seq: number[]; answer: number; hint: string };

    switch (type) {
        case 'arithmetic': result = generateArithmeticSeq(level); break;
        case 'geometric': result = generateGeometricSeq(level); break;
        case 'fibonacci': result = generateFibonacciSeq(); break;
        case 'squares': result = generateSquaresSeq(); break;
        case 'triangular': result = generateTriangularSeq(); break;
        default: result = generateArithmeticSeq(level);
    }

    return {
        type: 'pattern-recognition',
        sequence: result.seq,
        answer: result.answer,
        hint: result.hint,
    };
}

// ─── Hidden Operator ─────────────────────────────────────────

export function generateHiddenOperator(level: number): HiddenOperatorPuzzle {
    const maxNum = Math.min(10 + level * 3, 50);
    const allOps: Operator[] = ['+', '-', '×', '÷'];
    const op = allOps[randInt(0, allOps.length - 1)];
    let a: number, b: number, result: number;

    switch (op) {
        case '+':
            a = randInt(1, maxNum);
            b = randInt(1, maxNum);
            result = a + b;
            break;
        case '-':
            a = randInt(1, maxNum);
            b = randInt(1, a);
            result = a - b;
            break;
        case '×':
            a = randInt(1, Math.min(maxNum, 15));
            b = randInt(1, Math.min(maxNum, 12));
            result = a * b;
            break;
        case '÷':
            b = randInt(1, Math.min(maxNum, 12));
            result = randInt(1, Math.min(maxNum, 12));
            a = b * result;
            break;
        default:
            a = 1; b = 1; result = 2;
    }

    return {
        type: 'hidden-operator',
        left: a,
        right: b,
        result,
        answer: op,
        choices: shuffle(allOps),
    };
}

// ─── Multi-Step Logic ────────────────────────────────────────

export function generateMultiStepLogic(level: number): MultiStepPuzzle {
    if (level <= 2) {
        // Simple: a + b = ?, find a + b + c
        const a = randInt(2, 10);
        const b = randInt(2, 10);
        const c = randInt(1, 5);
        const x = a + b;
        return {
            type: 'multi-step-logic',
            equations: [`x = ${a} + ${b}`, `y = x + ${c}`],
            question: 'Find the value of y',
            answer: x + c,
        };
    } else if (level <= 5) {
        // Medium: x * 2 + 3
        const x = randInt(2, 8);
        const mult = randInt(2, 4);
        const add = randInt(1, 10);
        return {
            type: 'multi-step-logic',
            equations: [`x = ${x}`, `y = x × ${mult}`, `z = y + ${add}`],
            question: 'Find the value of z',
            answer: x * mult + add,
        };
    } else {
        // Hard: chained
        const a = randInt(2, 6);
        const b = randInt(2, 5);
        const c = randInt(1, 4);
        const d = randInt(2, 3);
        return {
            type: 'multi-step-logic',
            equations: [
                `a = ${a}`,
                `b = a × ${b}`,
                `c = b - ${c}`,
                `d = c ÷ ${d}`,
            ],
            question: 'Find the value of d (round down if needed)',
            answer: Math.floor((a * b - c) / d),
        };
    }
}

// ─── Daily Challenge ─────────────────────────────────────────

export function getDailySeed(): number {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

export function generateDailyChallenge(): Puzzle[] {
    const seed = getDailySeed();
    const rng = seededRandom(seed);
    const puzzles: Puzzle[] = [];
    const generators = [generateSpeedMath, generatePatternPuzzle, generateHiddenOperator, generateMultiStepLogic];

    for (let i = 0; i < 10; i++) {
        const genIndex = seededRandInt(rng, 0, generators.length - 1);
        const level = Math.floor(i / 2) + 1;
        puzzles.push(generators[genIndex](level));
    }

    return puzzles;
}

// ─── Generic Puzzle Generator ────────────────────────────────

export function generatePuzzle(mode: string, level: number): Puzzle {
    switch (mode) {
        case 'speed-math': return generateSpeedMath(level);
        case 'pattern-recognition': return generatePatternPuzzle(level);
        case 'hidden-operator': return generateHiddenOperator(level);
        case 'multi-step-logic': return generateMultiStepLogic(level);
        default: return generateSpeedMath(level);
    }
}
