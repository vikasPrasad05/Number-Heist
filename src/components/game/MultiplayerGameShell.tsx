'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ablyClient } from '../../lib/ably';
import { GameMode, Puzzle, MODE_LABELS } from '../../types/game';
import { generatePuzzle } from '../../engine/puzzleGenerators';
import SpeedMath from './SpeedMath';
import PatternRecognition from './PatternRecognition';
import HiddenOperator from './HiddenOperator';
import MultiStepLogic from './MultiStepLogic';
import RememberThePattern from './RememberThePattern';
import NeonButton from '../ui/NeonButton';
import GlassCard from '../ui/GlassCard';
import { GAME_CONFIG } from '../../lib/constants';

interface Player {
    id: string;
    name: string;
    score: number;
    ready: boolean;
    connected: boolean;
    isHost: boolean;
}

interface RoomState {
    id: string;
    status: string;
    players: Player[];
    mode: GameMode;
    round: number;
    maxRounds: number;
}

interface MultiplayerGameShellProps {
    roomState: RoomState;
    playerName: string;
    onExit: () => void;
}

export default function MultiplayerGameShell({ roomState: initialRoomState, playerName, onExit }: MultiplayerGameShellProps) {
    const [roomState, setRoomState] = useState<RoomState>(initialRoomState);
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [roundWinner, setRoundWinner] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [opponentDisconnected, setOpponentDisconnected] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [suddenDeath, setSuddenDeath] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting'>('connected');

    const clientId = ablyClient.auth.clientId;
    const me = roomState.players.find(p => p.id === clientId);
    const opponent = roomState.players.find(p => p.id !== clientId);
    const isHost = me?.isHost;

    const roomChannel = ablyClient.channels.get(`room:${roomState.id}`);

    // Sync roomState from Host broadcasts and handle connection drops
    useEffect(() => {
        const onRoomStateUpdate = (msg: any) => {
            if (!isHost) {
                const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
                setRoomState(parsed);
            }
        };

        const onConnectionStateChange = (stateChange: any) => {
            if (stateChange.current === 'disconnected' || stateChange.current === 'suspended' || stateChange.current === 'failed') {
                setConnectionStatus('reconnecting');
            } else if (stateChange.current === 'connected' && stateChange.previous !== 'initialized') {
                setConnectionStatus('connected');
                // Re-enter presence just in case we were dropped
                roomChannel.presence.enter({ name: playerName, isHost }).catch(console.error);
            }
        };

        ablyClient.connection.on(onConnectionStateChange);
        roomChannel.subscribe('room_state_update', onRoomStateUpdate);

        return () => { 
            ablyClient.connection.off(onConnectionStateChange);
            roomChannel.unsubscribe('room_state_update', onRoomStateUpdate); 
        };
    }, [isHost, roomChannel, playerName]);

    useEffect(() => {
        // Initial puzzle generation if we are already in the 'playing' state
        if (roomState.status === 'playing' && isHost && !puzzle) {
            const newPuzzle = generatePuzzle(roomState.mode, roomState.round);
            roomChannel.publish({ name: 'sync_puzzle', data: JSON.stringify({ roomCode: roomState.id, puzzle: newPuzzle }) });
        }
    }, [roomState.status, isHost, puzzle, roomState.mode, roomState.round, roomState.id, roomChannel]);

    useEffect(() => {
        const onPuzzleSync = (msg: any) => {
            const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
            setPuzzle(parsed);
            setIsLocked(false);
            setRoundWinner(null);
            setFeedback(null);
        };

        const onRoundEnd = (msg: any) => {
            const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
            setRoundWinner(parsed.winnerName);
            setIsLocked(true);
        };

        const onRoundStart = (msg: any) => {
            setRoundWinner(null);
            setPuzzle(null);
            if (isHost) {
                const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
                // Determine difficulty level mapping from round
                const level = Math.ceil(parsed.round / 2) || 1;
                const newPuzzle = generatePuzzle(roomState.mode, level);
                roomChannel.publish({ name: 'sync_puzzle', data: JSON.stringify({ roomCode: roomState.id, puzzle: newPuzzle }) });
            }
        };

        const onPlayerWrong = (msg: any) => {
            const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
            if (parsed.id === clientId) {
                setFeedback('wrong');
                setTimeout(() => setFeedback(null), 1000);
            }
        };

        const onGameOver = () => {
            setIsGameOver(true);
        };

        const onOpponentDisconnected = () => {
            setOpponentDisconnected(true);
            setIsGameOver(true);
        };

        const onSuddenDeath = () => {
            setSuddenDeath(true);
            setTimeout(() => setSuddenDeath(false), 3000);
        };

        roomChannel.subscribe('sync_puzzle', onPuzzleSync);
        roomChannel.subscribe('round_end', onRoundEnd);
        roomChannel.subscribe('round_start', onRoundStart);
        roomChannel.subscribe('player_wrong', onPlayerWrong);
        roomChannel.subscribe('game_over', onGameOver);
        roomChannel.subscribe('opponent_disconnected', onOpponentDisconnected);
        roomChannel.subscribe('sudden_death', onSuddenDeath);

        return () => {
            roomChannel.unsubscribe('sync_puzzle', onPuzzleSync);
            roomChannel.unsubscribe('round_end', onRoundEnd);
            roomChannel.unsubscribe('round_start', onRoundStart);
            roomChannel.unsubscribe('player_wrong', onPlayerWrong);
            roomChannel.unsubscribe('game_over', onGameOver);
            roomChannel.unsubscribe('opponent_disconnected', onOpponentDisconnected);
            roomChannel.unsubscribe('sudden_death', onSuddenDeath);
        };
    }, [isHost, roomState.id, roomState.mode, roomChannel, clientId]);

    // Host Logic: Process answers
    useEffect(() => {
        if (!isHost) return;

        const onSubmitAnswer = (message: any) => {
            const { clientId: senderId } = message;
            const parsed = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
            const { correct, points } = parsed;

            if (roomState.status !== 'playing') return;

            if (correct) {
                const updatedPlayers = roomState.players.map(p =>
                    p.id === senderId ? { ...p, score: p.score + points } : p
                );
                const winner = updatedPlayers.find(p => p.id === senderId);

                const endState = { ...roomState, players: updatedPlayers, status: 'round_end' };
                setRoomState(endState);
                roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(endState) });
                roomChannel.publish({ name: 'round_end', data: JSON.stringify({ winnerName: winner?.name || 'Someone' }) });

                setTimeout(() => {
                    let nextRound = roomState.round + 1;
                    let maxRounds = roomState.maxRounds;

                    // Check for game over or sudden death
                    if (nextRound > maxRounds) {
                        const pArr = updatedPlayers;
                        if (pArr.length === 2 && pArr[0].score === pArr[1].score) {
                            // Tie -> Sudden Death
                            maxRounds++;
                            roomChannel.publish({ name: 'sudden_death' });
                        } else {
                            const finalState = { ...endState, status: 'results' };
                            setRoomState(finalState);
                            roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(finalState) });
                            roomChannel.publish({ name: 'game_over' });
                            return;
                        }
                    }

                    const nextState = { ...endState, status: 'playing', round: nextRound, maxRounds };
                    setRoomState(nextState);
                    roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(nextState) });
                    roomChannel.publish({ name: 'round_start', data: JSON.stringify({ round: nextRound }) });
                }, 3000);
            } else {
                roomChannel.publish({ name: 'player_wrong', data: JSON.stringify({ id: senderId }) });
            }
        };

        const onRematchRequest = (message: any) => {
            const { clientId: senderId } = message;
            if (roomState.status !== 'results') return;

            const updatedPlayers = roomState.players.map(p =>
                p.id === senderId ? { ...p, ready: true } : p
            );

            const newState = { ...roomState, players: updatedPlayers };
            setRoomState(newState);
            roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(newState) });

            if (updatedPlayers.length === 2 && updatedPlayers.every(p => p.ready)) {
                // Reset for rematch
                const resetState = {
                    ...newState,
                    status: 'countdown',
                    round: 0,
                    maxRounds: 5,
                    players: updatedPlayers.map(p => ({ ...p, score: 0, ready: true }))
                };
                setRoomState(resetState);
                roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(resetState) });

                roomChannel.publish({ name: 'start_countdown', data: JSON.stringify(3) });
                setTimeout(() => roomChannel.publish({ name: 'start_countdown', data: JSON.stringify(2) }), 1000);
                setTimeout(() => roomChannel.publish({ name: 'start_countdown', data: JSON.stringify(1) }), 2000);
                setTimeout(() => {
                    const playState = { ...resetState, status: 'playing', round: 1 };
                    setRoomState(playState);
                    roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(playState) });
                    roomChannel.publish({ name: 'round_start', data: JSON.stringify({ round: 1 }) });
                }, 3000);
            }
        };

        roomChannel.subscribe('submit_answer', onSubmitAnswer);
        roomChannel.subscribe('rematch', onRematchRequest);

        return () => {
            roomChannel.unsubscribe('submit_answer', onSubmitAnswer);
            roomChannel.unsubscribe('rematch', onRematchRequest);
        };
    }, [isHost, roomState, roomChannel]);

    // Handle Disconnects (Host logic)
    useEffect(() => {
        if (!isHost) return;

        const onPresenceLeave = (member: any) => {
            const disconnectedPlayer = roomState.players.find(p => p.id === member.clientId);
            if (disconnectedPlayer) {
                const updatedPlayers = roomState.players.filter(p => p.id !== member.clientId);
                if (roomState.status !== 'lobby' && roomState.status !== 'results') {
                    const endState = { ...roomState, players: updatedPlayers, status: 'results' };
                    setRoomState(endState);
                    roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(endState) });
                    roomChannel.publish({ name: 'opponent_disconnected' });
                } else {
                    const newState = { ...roomState, players: updatedPlayers };
                    setRoomState(newState);
                    roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(newState) });
                }
            }
        };

        roomChannel.presence.subscribe('leave', onPresenceLeave);
        return () => { roomChannel.presence.unsubscribe('leave', onPresenceLeave); };
    }, [isHost, roomState, roomChannel]);

    const handleAnswer = useCallback((correct: boolean) => {
        if (isLocked) return;

        if (correct) {
            setFeedback('correct');
            const points = roomState.round * 100;
            roomChannel.publish({ name: 'submit_answer', data: JSON.stringify({ correct: true, points }) });
            setIsLocked(true);
        } else {
            roomChannel.publish({ name: 'submit_answer', data: JSON.stringify({ correct: false, points: 0 }) });
            setIsLocked(true);
            setTimeout(() => setIsLocked(false), 1000);
        }
    }, [isLocked, roomState.round, roomChannel]);

    if (isGameOver) {
        const myScore = me?.score || 0;
        const opScore = opponent?.score || 0;
        const didWin = myScore > opScore;
        const isTie = myScore === opScore;
        const title = opponentDisconnected ? "OPPONENT FLED" : didWin ? "VICTORY" : isTie ? "DRAW" : "DEFEAT";
        const color = didWin ? "text-[#00ff88]" : isTie ? "text-[#00d4ff]" : "text-[#ff3366]";

        const myReadyForRematch = me?.ready || false;
        const opReadyForRematch = opponent?.ready || false;

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <GlassCard className="w-full max-w-lg p-8 text-center relative overflow-hidden" glow={didWin ? "green" : "red"}>
                    {/* Scanline effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.1) 2px, rgba(0,212,255,0.1) 4px)' }} />

                    <h1 className={`text-4xl md:text-6xl font-black tracking-widest mb-4 ${color}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {title}
                    </h1>

                    <div className="flex justify-between items-center my-8 p-6 bg-white/5 rounded-2xl border border-white/10 font-mono">
                        <div className="text-left">
                            <p className="text-[10px] text-gray-400 mb-1 tracking-widest uppercase">{me?.name || 'YOU'}</p>
                            <p className={`text-3xl font-bold ${myScore >= opScore ? "text-white" : "text-gray-400"}`}>{myScore.toLocaleString()}</p>
                            {myReadyForRematch && <p className="text-[10px] text-[#00ff88] mt-2 tracking-widest uppercase font-bold">READY</p>}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-px bg-white/10" />
                            <span className="text-gray-500 text-xs tracking-widest">VS</span>
                            <div className="h-12 w-px bg-white/10" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 mb-1 tracking-widest uppercase">{opponent?.name || 'OPPONENT'}</p>
                            <p className={`text-3xl font-bold ${opScore >= myScore ? "text-white" : "text-gray-400"}`}>{opScore.toLocaleString()}</p>
                            {opReadyForRematch && <p className="text-[10px] text-[#00ff88] mt-2 tracking-widest uppercase font-bold">READY</p>}
                        </div>
                    </div>

                    <AnimatePresence>
                        {suddenDeath && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-red-500 font-bold tracking-[0.3em] uppercase text-sm mb-6 animate-pulse"
                            >
                                Sudden Death Round Played!
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-4 max-w-xs mx-auto mt-8">
                        <NeonButton
                            onClick={() => roomChannel.publish({ name: 'rematch', data: JSON.stringify({ roomCode: roomState.id }) })}
                            color="green"
                            disabled={myReadyForRematch}
                            className="w-full"
                        >
                            {myReadyForRematch ? "WAITING FOR OPPONENT..." : "REQUEST REMATCH"}
                        </NeonButton>
                        <NeonButton onClick={onExit} color="blue" className="w-full">
                            EXIT TO MENU
                        </NeonButton>
                    </div>
                </GlassCard>
            </div>
        );
    }

    const renderPuzzle = () => {
        if (!puzzle && roomState.mode !== 'remember-the-pattern') return (
            <div className="text-center">
                <div className="inline-block w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin mb-4" />
                <div className="text-[#00d4ff] animate-pulse uppercase tracking-widest text-sm font-bold">
                    Awaiting Server Sync...
                </div>
            </div>
        );

        if (roomState.mode === 'remember-the-pattern') {
            return (
                <RememberThePattern
                    key={`${roomState.round}-${puzzle?.type === 'remember-the-pattern' ? puzzle.sequence.join('') : ''}`}
                    level={roomState.round}
                    correctAnswers={roomState.round - 1} // Maps correctly to starting at 3 digits
                    onAnswer={handleAnswer}
                    locked={isLocked}
                    syncedPuzzle={puzzle?.type === 'remember-the-pattern' ? puzzle : undefined}
                />
            );
        }

        switch (puzzle?.type) {
            case 'speed-math':
                return <SpeedMath puzzle={puzzle} onAnswer={handleAnswer} locked={isLocked} />;
            case 'pattern-recognition':
                return <PatternRecognition puzzle={puzzle} onAnswer={handleAnswer} locked={isLocked} />;
            case 'hidden-operator':
                return <HiddenOperator puzzle={puzzle} onAnswer={handleAnswer} locked={isLocked} />;
            case 'multi-step-logic':
                return <MultiStepLogic puzzle={puzzle} onAnswer={handleAnswer} locked={isLocked} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Header Scoreboard */}
            <div className="sticky top-0 z-30 px-4 py-4 backdrop-blur-md bg-black/50 border-b border-white/10">
                <div className="max-w-4xl mx-auto flex justify-between gap-4 items-center">
                    {/* MY SCORE */}
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400 tracking-widest">{me?.name || 'YOU'}</span>
                        <span className="text-xl font-bold text-[#00d4ff] font-mono">{me?.score.toLocaleString()}</span>
                    </div>

                    {/* ROUND INFO */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase text-gray-500 tracking-widest">
                            {MODE_LABELS[roomState.mode]}
                        </span>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">
                            {suddenDeath ? <span className="text-red-500 animate-pulse">SUDDEN DEATH</span> : `Round ${roomState.round} / ${roomState.maxRounds}`}
                        </span>
                    </div>

                    {/* OPPONENT SCORE */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-gray-400 tracking-widest">{opponent?.name || 'OPPONENT'}</span>
                        <span className="text-xl font-bold text-[#b44dff] font-mono">{opponent?.score.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {connectionStatus === 'reconnecting' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                    >
                        <div className="bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-4 rounded-xl text-center font-bold tracking-widest uppercase">
                            Connection Lost. Reconnecting...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {roundWinner && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                                ROUND WINNER
                            </h2>
                            <p className="text-5xl text-[#00ff88] font-bold tracking-widest font-mono">
                                {roundWinner}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center"
                    >
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1.2 }} exit={{ scale: 0, opacity: 0 }} className="text-6xl md:text-8xl">
                            {feedback === 'correct' ? '✅' : '❌'}
                        </motion.div>
                        <div className="absolute inset-0" style={{ background: feedback === 'correct' ? 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,51,102,0.1) 0%, transparent 70%)' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-0">
                {renderPuzzle()}
            </div>
        </div>
    );
}
