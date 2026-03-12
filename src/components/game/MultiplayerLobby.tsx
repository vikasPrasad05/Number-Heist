'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import NeonButton from '../ui/NeonButton';
import GlassCard from '../ui/GlassCard';
import { ablyClient } from '../../lib/ably';
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

    // Client specific channel for direct responses (less needed in the new model, but keeping for direct events)
    const clientId = ablyClient.auth.clientId;

    function generateRoomCode() {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    useEffect(() => {
        // Connect to Ably
        ablyClient.connect();

        return () => {
            // ablyClient.close(); // Careful on unmount if it's meant to persist between screens
        };
    }, []);

    useEffect(() => {
        if (!roomState?.id) return;

        const roomChannel = ablyClient.channels.get(`room:${roomState.id}`);
        const isHost = roomState.players.find(p => p.id === clientId)?.isHost;

        // Enter presence so others know we are here
        const initPresence = async () => {
            try {
                const members = await roomChannel.presence.get();
                // If we are Host, we don't check for capacity, but if we are just joining:
                if (!isHost && members && members.length >= 2) {
                    setErrorMsg('Room is full');
                    setRoomState(null);
                    setLobbyView('menu');
                    return;
                }
                await roomChannel.presence.enter({ name: playerName, isHost });
            } catch (err) {
                console.error('Presence error:', err);
            }
        };

        initPresence();

        const onRoomStateUpdate = (msg: any) => {
            // Only non-hosts update their state from the host's broadcast
            if (!isHost) {
                const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
                setRoomState(parsed);
            }
        };
        const onStartCountdown = (msg: any) => {
            const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
            setCountdown(parsed);
        };
        const onRoundStart = () => { if (roomState) onGameStart(roomState); };

        roomChannel.subscribe('room_state_update', onRoomStateUpdate);
        roomChannel.subscribe('start_countdown', onStartCountdown);
        roomChannel.subscribe('round_start', onRoundStart);

        // Host logic to manage presence and broadcast state
        const updatePresenceInState = async () => {
            if (!isHost) return;

            try {
                const members = await roomChannel.presence.get();
                if (!members) return;

                const currentPlayers = Array.from(members).map(m => ({
                    id: m.clientId,
                    name: (m.data as any).name || 'Unknown',
                    score: roomState.players.find(p => p.id === m.clientId)?.score || 0,
                    ready: roomState.players.find(p => p.id === m.clientId)?.ready || false,
                    connected: true,
                    isHost: (m.data as any).isHost || false
                }));

                const newState = {
                    ...roomState,
                    players: currentPlayers
                };

                setRoomState(newState);
                roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(newState) });
            } catch (err) {
                console.error('Update presence error:', err);
            }
        };

        const onPresenceJoin = () => updatePresenceInState();
        const onPresenceLeave = (member: any) => {
            if (isHost) {
                updatePresenceInState();
            } else if (member.data?.isHost) {
                setErrorMsg('Host has disconnected');
                setRoomState(null);
                setLobbyView('menu');
            }
        };

        roomChannel.presence.subscribe('enter', onPresenceJoin);
        roomChannel.presence.subscribe('leave', onPresenceLeave);

        return () => {
            roomChannel.unsubscribe('room_state_update', onRoomStateUpdate);
            roomChannel.unsubscribe('start_countdown', onStartCountdown);
            roomChannel.unsubscribe('round_start', onRoundStart);
            roomChannel.presence.unsubscribe('enter', onPresenceJoin);
            roomChannel.presence.unsubscribe('leave', onPresenceLeave);
        };
    }, [roomState?.id, onGameStart, playerName, clientId]);

    const handleCreateClick = () => {
        setLobbyView('create');
        setErrorMsg('');
    };

    const handleJoinClick = () => {
        setLobbyView('join');
        setErrorMsg('');
    };

    const handleModeSelect = (mode: GameMode) => {
        const code = generateRoomCode();
        const initialRoom: RoomState = {
            id: code,
            status: 'lobby',
            players: [{
                id: clientId,
                name: playerName,
                score: 0,
                ready: false,
                connected: true,
                isHost: true
            }],
            mode,
            round: 0,
            maxRounds: 5
        };
        setRoomState(initialRoom);
        setLobbyView('in-room');
    };

    const submitJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (code.length === 5) {
            // Join as non-host player
            setRoomState({
                id: code,
                status: 'lobby',
                players: [], // Will be populated by room_state_update from host
                mode: 'speed-math', // Temporary, will be updated by host
                round: 0,
                maxRounds: 5
            });
            setLobbyView('in-room');
        }
    };

    const handleReady = () => {
        if (!roomState) return;

        const isHost = roomState.players.find(p => p.id === clientId)?.isHost;
        const updatedPlayers = roomState.players.map(p =>
            p.id === clientId ? { ...p, ready: true } : p
        );

        const newState = { ...roomState, players: updatedPlayers };

        const roomChannel = ablyClient.channels.get(`room:${roomState.id}`);

        if (isHost) {
            setRoomState(newState);
            roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(newState) });
            checkAllReady(newState);
        } else {
            // Just publish our ready state for the host to handle
            roomChannel.publish({ name: 'player_ready', data: JSON.stringify({ clientId }) });
        }
    };

    // Host Only: Listen for ready signal from other player
    useEffect(() => {
        if (!roomState || !roomState.id) return;
        const isHost = roomState.players.find(p => p.id === clientId)?.isHost;
        if (!isHost) return;

        const roomChannel = ablyClient.channels.get(`room:${roomState.id}`);
        const onOtherReady = (msg: any) => {
            const parsed = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
            const pid = parsed.clientId;
            const updatedPlayers = roomState.players.map(p =>
                p.id === pid ? { ...p, ready: true } : p
            );
            const newState = { ...roomState, players: updatedPlayers };
            setRoomState(newState);
            roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(newState) });
            checkAllReady(newState);
        };

        roomChannel.subscribe('player_ready', onOtherReady);
        return () => { roomChannel.unsubscribe('player_ready', onOtherReady); };
    }, [roomState?.id, roomState?.players, clientId]);

    const checkAllReady = (state: RoomState) => {
        if (state.players.length === 2 && state.players.every(p => p.ready) && state.status === 'lobby') {
            const roomChannel = ablyClient.channels.get(`room:${state.id}`);

            const updatedState = { ...state, status: 'countdown' };
            setRoomState(updatedState);
            roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(updatedState) });

            // Start countdown
            roomChannel.publish({ name: 'start_countdown', data: JSON.stringify(3) });
            setTimeout(() => roomChannel.publish({ name: 'start_countdown', data: JSON.stringify(2) }), 1000);
            setTimeout(() => roomChannel.publish({ name: 'start_countdown', data: JSON.stringify(1) }), 2000);
            setTimeout(() => {
                const playingState = { ...updatedState, status: 'playing', round: 1 };
                setRoomState(playingState);
                roomChannel.publish({ name: 'room_state_update', data: JSON.stringify(playingState) });
                roomChannel.publish({ name: 'round_start', data: JSON.stringify({ round: 1 }) });
            }, 3000);
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
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-stretch"
                >
                    <GlassCard className="flex-1 p-8 flex flex-col items-center justify-center text-center group">
                        <h3 className="text-sm font-semibold mb-3 tracking-[0.2em] text-white/90 uppercase">Solo Mode</h3>
                        <p className="text-xs text-white/40 mb-8 font-mono">Immediate access. Perfect for training.</p>
                        <NeonButton color="green" onClick={() => setLobbyView('solo-select')} className="w-full">TRAIN SOLO</NeonButton>
                    </GlassCard>

                    <GlassCard className="flex-1 p-8 flex flex-col items-center justify-center text-center group">
                        <h3 className="text-sm font-semibold mb-3 tracking-[0.2em] text-white/90 uppercase">Create Room</h3>
                        <p className="text-xs text-white/40 mb-8 font-mono">Host a match and select the game mode.</p>
                        <NeonButton color="blue" onClick={handleCreateClick} className="w-full">HOST ROOM</NeonButton>
                    </GlassCard>

                    <GlassCard className="flex-1 p-8 flex flex-col items-center justify-center text-center group">
                        <h3 className="text-sm font-semibold mb-3 tracking-[0.2em] text-white/90 uppercase">Join Room</h3>
                        <p className="text-xs text-white/40 mb-8 font-mono">Join an existing match via access code.</p>
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
                    <h2 className="text-lg font-semibold text-center mb-10 text-white/90 tracking-[0.2em] uppercase">SOLO TRAINING: Select Mode</h2>
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
                    <h2 className="text-lg font-semibold text-center mb-10 text-white/90 tracking-[0.2em] uppercase">Select Game Mode</h2>
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
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full max-w-md p-10 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl"
                >
                    <h2 className="text-sm font-semibold mb-8 text-center tracking-[0.2em] text-white/90 uppercase">ENTER ROOM CODE</h2>
                    <form onSubmit={submitJoin} className="space-y-8">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="ABC12"
                            maxLength={5}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-white/30 transition-all text-2xl text-center tracking-[0.5em] font-mono placeholder:text-white/20"
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
                    <div className="flex flex-col items-center mb-10 text-center">
                        <h2 className="text-2xl font-bold tracking-[0.2em] text-white">
                            ROOM: <span className="text-white/70 font-mono tracking-widest ml-2">{roomState.id}</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-4 text-xs font-mono uppercase tracking-[0.2em]">
                            <span className="text-white/40">Mode:</span>
                            <span className="text-white/90 bg-white/10 px-3 py-1 rounded-full">{MODE_LABELS[roomState.mode]}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {roomState.players.map((p) => {
                            const isMe = p.id === ablyClient.auth.clientId;
                            return (
                                <GlassCard key={p.id} className="p-6 relative overflow-hidden" glow={p.ready ? 'green' : 'none'}>
                                    {/* Player Status / Connection */}
                                    <div className="absolute top-6 right-6 flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${p.connected ? 'bg-[#00ff88]' : 'bg-[#ff3366]'}`} />
                                    </div>
                                    <h3 className={`text-lg font-medium mb-1 tracking-[0.1em] ${isMe ? 'text-white' : 'text-white/70'}`}>
                                        {p.name} {isMe ? '(YOU)' : ''}
                                    </h3>
                                    {p.isHost && <p className="text-[10px] text-white/40 mb-6 uppercase font-mono tracking-[0.2em]">Host</p>}

                                    <div className="mt-4">
                                        {p.ready ? (
                                            <span className="text-[#00ff88] font-medium uppercase tracking-[0.2em] text-[10px] bg-[#00ff88]/10 px-3 py-1.5 rounded-full border border-[#00ff88]/20">
                                                READY
                                            </span>
                                        ) : (
                                            <span className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px] bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
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
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={countdown}
                                className="text-6xl font-light text-white tracking-widest"
                            >
                                {countdown}
                            </motion.div>
                        ) : (
                            <NeonButton
                                color={roomState.players.find(p => p.id === ablyClient.auth.clientId)?.ready ? 'green' : 'blue'}
                                onClick={handleReady}
                                disabled={roomState.players.find(p => p.id === ablyClient.auth.clientId)?.ready || roomState.players.length < 2}
                                className="w-full max-w-md"
                            >
                                {roomState.players.find(p => p.id === ablyClient.auth.clientId)?.ready ? 'READY' : 'MARK AS READY'}
                            </NeonButton>
                        )}

                        {countdown === null && (
                            <button onClick={() => {
                                ablyClient.connection.close();
                                setLobbyView('menu');
                                setRoomState(null);
                                ablyClient.connection.connect();
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
