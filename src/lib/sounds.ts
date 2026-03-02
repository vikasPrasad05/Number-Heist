// ─── Sound Effects Manager ───────────────────────────────────
// Uses Web Audio API to generate sounds programmatically

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch {
        // Audio not available
    }
}

export function playCorrectSound() {
    playTone(523.25, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.2), 80);
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.25), 160);
}

export function playWrongSound() {
    playTone(200, 0.2, 'sawtooth', 0.15);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.1), 150);
}

export function playTickSound() {
    playTone(800, 0.05, 'square', 0.08);
}

export function playLevelUpSound() {
    playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(554.37, 0.1, 'sine', 0.2), 100);
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.2), 200);
    setTimeout(() => playTone(880, 0.2, 'sine', 0.3), 300);
}

export function playGameOverSound() {
    playTone(440, 0.3, 'sawtooth', 0.15);
    setTimeout(() => playTone(349.23, 0.3, 'sawtooth', 0.12), 250);
    setTimeout(() => playTone(261.63, 0.5, 'sawtooth', 0.1), 500);
}

export function playComboSound(combo: number) {
    const baseFreq = 500 + combo * 100;
    playTone(baseFreq, 0.08, 'sine', 0.15);
    setTimeout(() => playTone(baseFreq * 1.3, 0.1, 'sine', 0.2), 60);
}

export function playTimerWarningSound() {
    playTone(600, 0.08, 'square', 0.1);
}
