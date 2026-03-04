'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import NeonButton from '../ui/NeonButton';
import GlassCard from '../ui/GlassCard';
import { socket } from '../../lib/socket';
import { GameMode, MODE_LABELS } from '../../types/game';
import ModeSelector from './ModeSelector';

const VaultScene = dynamic(() => import('../three/VaultScene'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[150px] flex items-center justify-center">
            <div className="text-xs animate-pulse font-mono" style={{ color: 'var(--neon-blue)' }}>
                INITIATING_SECURE_CHANNEL...
            </div>
        </div>
    ),
});

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

interface MultiplayerLobbyProps {
    playerName: string;
    onGameStart: (room: RoomState) => void;
    onSoloMode: (mode: GameMode) => void;
    onBack: () => void;
}

export default function MultiplayerLobby({ playerName, onGameStart, onSoloMode, onBack }: MultiplayerLobbyProps) {
    const [lobbyView, setLobbyView] = useState<'menu' | 'create' | 'join' | 'in-room' | 'solo-select'>('menu');
    const [joinCode, setJoinCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        socket.on('room_created', ({ roomCode }) => {
            setLobbyView('in-room');
            setErrorMsg('');
        });

        socket.on('room_joined', ({ roomCode }) => {
            setLobbyView('in-room');
            setErrorMsg('');
        });

        socket.on('room_state_update', (state: RoomState) => {
            setRoomState(state);
        });

        socket.on('error', (msg: string) => {
            setErrorMsg(msg);
        });

        socket.on('start_countdown', (count: number) => {
            setCountdown(count);
        });

        socket.on('round_start', () => {
            // Let the parent know the game should start
            if (roomState) onGameStart(roomState);
        });

        return () => {
            socket.off('room_created');
            socket.off('room_joined');
            socket.off('room_state_update');
            socket.off('error');
            socket.off('start_countdown');
            socket.off('round_start');
        };
    }, [roomState, onGameStart]);

    const handleCreateClick = () => {
        setLobbyView('create');
        setErrorMsg('');
    };

    const handleJoinClick = () => {
        setLobbyView('join');
        setErrorMsg('');
    };

    const handleModeSelect = (mode: GameMode) => {
        socket.emit('create_room', { playerName, mode });
    };

    const submitJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.trim().length === 5) {
            socket.emit('join_room', { roomCode: joinCode.trim().toUpperCase(), playerName });
        }
    };

    const handleReady = () => {
        if (roomState) {
            socket.emit('player_ready', { roomCode: roomState.id });
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
            <AnimatePresence mode="wait">
                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg mb-6 text-center text-sm font-bold tracking-wider"
                    >
                        {errorMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MENU VIEW */}
            {lobbyView === 'menu' && (
                <motion.div
                    key="menu"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col md:flex-row gap-4 w-full max-w-4xl justify-center items-stretch"
                >
                    <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center text-center group">
                        <h3 className="text-xl font-bold mb-3 text-[#00ff88]" style={{ fontFamily: "'Orbitron', sans-serif" }}>SOLO MODE</h3>
                        <p className="text-xs text-gray-400 mb-6 font-mono">Immediate access. Perfect for training.</p>
                        <NeonButton color="green" onClick={() => setLobbyView('solo-select')} className="w-full">TRAIN SOLO</NeonButton>
                    </GlassCard>

                    <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center text-center group">
                        <h3 className="text-xl font-bold mb-3 text-[#00d4ff]" style={{ fontFamily: "'Orbitron', sans-serif" }}>CREATE ROOM</h3>
                        <p className="text-xs text-gray-400 mb-6 font-mono">Host a match and select the game mode.</p>
                        <NeonButton color="blue" onClick={handleCreateClick} className="w-full">HOST ROOM</NeonButton>
                    </GlassCard>

                    <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center text-center group">
                        <h3 className="text-xl font-bold mb-3 text-[#b44dff]" style={{ fontFamily: "'Orbitron', sans-serif" }}>JOIN ROOM</h3>
                        <p className="text-xs text-gray-400 mb-6 font-mono">Join an existing match via access code.</p>
                        <NeonButton color="purple" onClick={handleJoinClick} className="w-full">JOIN PLAYER</NeonButton>
                    </GlassCard>
                </motion.div>
            )}

            {/* SOLO SELECT VIEW */}
            {lobbyView === 'solo-select' && (
                <motion.div
                    key="solo-select"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                >
                    <h2 className="text-2xl font-bold text-center mb-8 text-white/80 tracking-widest uppercase text-[#00ff88]">SOLO TRAINING: Select Mode</h2>
                    <ModeSelector onSelectMode={(mode) => onSoloMode(mode)} />
                    <div className="mt-8 flex justify-center">
                        <button onClick={() => setLobbyView('menu')} className="text-gray-500 hover:text-white text-sm uppercase tracking-widest transition-colors font-mono">
                            [ Back To Menu ]
                        </button>
                    </div>
                </motion.div>
            )}

            {/* CREATE VIEW */}
            {lobbyView === 'create' && (
                <motion.div
                    key="create"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                >
                    <h2 className="text-2xl font-bold text-center mb-8 text-white/80 tracking-widest uppercase text-[#00d4ff]">Select Game Mode</h2>
                    <ModeSelector onSelectMode={handleModeSelect} />
                    <div className="mt-8 flex justify-center">
                        <button onClick={() => setLobbyView('menu')} className="text-gray-500 hover:text-white text-sm uppercase tracking-widest transition-colors font-mono">
                            [ Cancel ]
                        </button>
                    </div>
                </motion.div>
            )}

            {/* JOIN VIEW */}
            {lobbyView === 'join' && (
                <motion.div
                    key="join"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl"
                >
                    <h2 className="text-xl font-bold mb-6 text-center tracking-wider text-[#00ff88]" style={{ fontFamily: "'Orbitron', sans-serif" }}>ENTER ROOM CODE</h2>
                    <form onSubmit={submitJoin} className="space-y-6">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="ABC12"
                            maxLength={5}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00ff88]/50 transition-colors text-2xl text-center tracking-[0.5em]"
                            style={{ fontFamily: "'Orbitron', sans-serif" }}
                            autoFocus
                        />
                        <NeonButton type="submit" className="w-full" disabled={joinCode.trim().length !== 5} color="green">
                            ACCESS
                        </NeonButton>
                    </form>
                    <div className="mt-6 flex justify-center">
                        <button onClick={() => setLobbyView('menu')} className="text-gray-500 hover:text-white text-sm uppercase tracking-widest transition-colors font-mono">
                            [ Cancel ]
                        </button>
                    </div>
                </motion.div>
            )}

            {/* IN-ROOM VIEW */}
            {lobbyView === 'in-room' && roomState && (
                <motion.div
                    key="in-room"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-3xl"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-wider text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                                ROOM: <span className="text-[#b44dff]">{roomState.id}</span>
                            </h2>
                            <p className="text-sm text-gray-400 mt-2 font-mono uppercase tracking-widest">
                                Mode: <span className="text-white">{MODE_LABELS[roomState.mode]}</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {roomState.players.map((p) => {
                            const isMe = p.id === socket.id;
                            return (
                                <GlassCard key={p.id} className="p-6 relative overflow-hidden" glow={p.ready ? 'green' : 'none'}>
                                    {/* Player Status / Connection */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", color: isMe ? '#00d4ff' : 'white' }}>
                                        {p.name} {isMe ? '(YOU)' : ''}
                                    </h3>
                                    {p.isHost && <p className="text-xs text-[#b44dff] mb-4 uppercase font-bold tracking-widest">Host</p>}

                                    <div className="mt-4">
                                        {p.ready ? (
                                            <span className="text-green-400 font-bold uppercase tracking-widest text-sm bg-green-500/10 px-3 py-1 rounded border border-green-500/30">
                                                READY
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-sm bg-gray-500/10 px-3 py-1 rounded border border-gray-500/30">
                                                WAITING
                                            </span>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}
                        {/* Empty slot if less than 2 players */}
                        {Array.from({ length: 2 - roomState.players.length }).map((_, i) => (
                            <GlassCard key={`empty-${i}`} className="p-6 flex items-center justify-center opacity-50 border-dashed">
                                <p className="text-gray-500 uppercase tracking-widest font-bold text-sm">WAITING FOR OPPONENT...</p>
                            </GlassCard>
                        ))}
                    </div>

                    <div className="flex justify-center flex-col items-center">
                        {countdown !== null ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={countdown}
                                className="text-6xl font-bold text-[#00ff88] drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]"
                                style={{ fontFamily: "'Orbitron', sans-serif" }}
                            >
                                {countdown}
                            </motion.div>
                        ) : (
                            <NeonButton
                                color={roomState.players.find(p => p.id === socket.id)?.ready ? 'green' : 'blue'}
                                onClick={handleReady}
                                disabled={roomState.players.find(p => p.id === socket.id)?.ready || roomState.players.length < 2}
                                className="w-full max-w-md"
                            >
                                {roomState.players.find(p => p.id === socket.id)?.ready ? 'READY' : 'MARK AS READY'}
                            </NeonButton>
                        )}

                        {countdown === null && (
                            <button onClick={() => {
                                socket.disconnect();
                                setLobbyView('menu');
                                setRoomState(null);
                                socket.connect();
                            }} className="mt-6 text-gray-500 hover:text-white text-sm uppercase tracking-widest transition-colors font-mono">
                                [ Leave Room ]
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            <div className="w-full h-[180px] md:h-[220px] mt-8 relative z-0">
                <VaultScene />
            </div>
        </div>
    );
}
