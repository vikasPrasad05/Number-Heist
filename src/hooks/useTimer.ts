'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerOptions {
    totalTime: number;
    onTimeUp: () => void;
    onWarning?: () => void;
}

export function useTimer({ totalTime, onTimeUp, onWarning }: UseTimerOptions) {
    const [timeRemaining, setTimeRemaining] = useState(totalTime);
    const [isRunning, setIsRunning] = useState(false);
    const startTimeRef = useRef<number>(0);
    const rafRef = useRef<number>(0);
    const warningFiredRef = useRef(false);
    const totalTimeRef = useRef(totalTime);
    const onTimeUpRef = useRef(onTimeUp);
    const onWarningRef = useRef(onWarning);

    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
        onWarningRef.current = onWarning;
    }, [onTimeUp, onWarning]);

    const tick = useCallback(() => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const remaining = Math.max(0, totalTimeRef.current - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 3 && !warningFiredRef.current) {
            warningFiredRef.current = true;
            onWarningRef.current?.();
        }

        if (remaining <= 0) {
            setIsRunning(false);
            onTimeUpRef.current();
            return;
        }

        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const start = useCallback((newTotalTime?: number) => {
        if (newTotalTime !== undefined) {
            totalTimeRef.current = newTotalTime;
            setTimeRemaining(newTotalTime);
        }
        startTimeRef.current = performance.now();
        warningFiredRef.current = false;
        setIsRunning(true);
        rafRef.current = requestAnimationFrame(tick);
    }, [tick]);

    const stop = useCallback(() => {
        setIsRunning(false);
        cancelAnimationFrame(rafRef.current);
    }, []);

    const reset = useCallback((newTotalTime: number) => {
        cancelAnimationFrame(rafRef.current);
        totalTimeRef.current = newTotalTime;
        setTimeRemaining(newTotalTime);
        warningFiredRef.current = false;
        setIsRunning(false);
    }, []);

    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return {
        timeRemaining,
        totalTime: totalTimeRef.current,
        isRunning,
        fraction: timeRemaining / totalTimeRef.current,
        start,
        stop,
        reset,
    };
}
