const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Memory-Only Store
const rooms = new Map(); // RoomCode -> { id, players: Map(socketId -> { name, score, ready }), status, mode, round, maxRounds, sequence, ... }

function generateRoomCode() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(server, {
        cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join room logic
        socket.on('create_room', ({ playerName, mode }) => {
            let code;
            do {
                code = generateRoomCode();
            } while (rooms.has(code));

            const room = {
                id: code,
                players: new Map(),
                status: 'lobby',
                mode: mode || 'speed-math',
                round: 0,
                maxRounds: 5,
                sequence: []
            };

            room.players.set(socket.id, {
                id: socket.id,
                name: playerName,
                score: 0,
                ready: false,
                connected: true,
                isHost: true
            });

            rooms.set(code, room);
            socket.join(code);

            socket.emit('room_created', { roomCode: code });
            broadcastRoomState(code);
        });

        socket.on('join_room', ({ roomCode, playerName }) => {
            const room = rooms.get(roomCode);
            if (!room) {
                return socket.emit('error', 'Room not found');
            }
            if (room.players.size >= 2) {
                return socket.emit('error', 'Room is full');
            }
            if (room.status !== 'lobby') {
                return socket.emit('error', 'Game already in progress');
            }

            room.players.set(socket.id, {
                id: socket.id,
                name: playerName,
                score: 0,
                ready: false,
                connected: true,
                isHost: false
            });

            socket.join(roomCode);
            socket.emit('room_joined', { roomCode });
            broadcastRoomState(roomCode);
        });

        socket.on('player_ready', ({ roomCode }) => {
            const room = rooms.get(roomCode);
            if (!room) return;
            const player = room.players.get(socket.id);
            if (player) {
                player.ready = true;
                broadcastRoomState(roomCode);

                // Check if both ready
                if (room.players.size === 2) {
                    let allReady = true;
                    for (let p of room.players.values()) {
                        if (!p.ready) allReady = false;
                    }
                    if (allReady && room.status === 'lobby') {
                        room.status = 'countdown';
                        broadcastRoomState(roomCode);

                        // Start countdown
                        io.to(roomCode).emit('start_countdown', 3);
                        setTimeout(() => {
                            io.to(roomCode).emit('start_countdown', 2);
                        }, 1000);
                        setTimeout(() => {
                            io.to(roomCode).emit('start_countdown', 1);
                        }, 2000);
                        setTimeout(() => {
                            room.status = 'playing';
                            room.round = 1;
                            broadcastRoomState(roomCode);
                            io.to(roomCode).emit('round_start', { round: room.round });
                        }, 3000);
                    }
                }
            }
        });
        socket.on('sync_puzzle', ({ roomCode, puzzle }) => {
            const room = rooms.get(roomCode);
            if (!room) return;
            io.to(roomCode).emit('puzzle_sync', puzzle);
        });

        socket.on('submit_answer', ({ roomCode, correct, points }) => {
            const room = rooms.get(roomCode);
            if (!room || room.status !== 'playing') return;

            if (correct) {
                const player = room.players.get(socket.id);
                if (player) {
                    player.score += points;
                }
                room.status = 'round_end';
                io.to(roomCode).emit('round_end', { winnerName: player?.name || 'Someone' });
                broadcastRoomState(roomCode);

                setTimeout(() => {
                    room.round++;

                    // Check for game over or sudden death
                    if (room.round > room.maxRounds) {
                        const pArr = Array.from(room.players.values());
                        if (pArr.length === 2 && pArr[0].score === pArr[1].score) {
                            // Tie -> Sudden Death
                            room.maxRounds++; // play one more round
                            io.to(roomCode).emit('sudden_death');
                        } else {
                            room.status = 'results';
                            io.to(roomCode).emit('game_over');
                            broadcastRoomState(roomCode);
                            return;
                        }
                    }

                    room.status = 'playing';
                    io.to(roomCode).emit('round_start', { round: room.round });
                    broadcastRoomState(roomCode);
                }, 3000);
            } else {
                // Tell the room someone answered wrong (optional, for lockout mechanics)
                io.to(roomCode).emit('player_wrong', { id: socket.id });
            }
        });

        socket.on('rematch', ({ roomCode }) => {
            const room = rooms.get(roomCode);
            if (!room || room.status !== 'results') return;

            const player = room.players.get(socket.id);
            if (player) {
                player.ready = true;

                // If both ready for rematch
                let allReady = true;
                room.players.forEach(p => {
                    if (!p.ready) allReady = false;
                });

                if (allReady && room.players.size === 2) {
                    // Reset room for new game
                    room.status = 'countdown';
                    room.round = 0;
                    room.maxRounds = 5;
                    room.players.forEach(p => {
                        p.score = 0;
                        p.ready = true; // They start ready for countdown
                    });
                    broadcastRoomState(roomCode);

                    io.to(roomCode).emit('start_countdown', 3);
                    setTimeout(() => io.to(roomCode).emit('start_countdown', 2), 1000);
                    setTimeout(() => io.to(roomCode).emit('start_countdown', 1), 2000);
                    setTimeout(() => {
                        room.status = 'playing';
                        room.round = 1;
                        broadcastRoomState(roomCode);
                        io.to(roomCode).emit('round_start', { round: room.round });
                    }, 3000);
                } else {
                    broadcastRoomState(roomCode);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            rooms.forEach((room, code) => {
                if (room.players.has(socket.id)) {
                    room.players.delete(socket.id);
                    if (room.players.size === 0) {
                        rooms.delete(code);
                    } else {
                        if (room.status !== 'lobby' && room.status !== 'results') {
                            room.status = 'results';
                            io.to(code).emit('opponent_disconnected');
                        }
                        broadcastRoomState(code);
                    }
                }
            });
        });
    });

    function broadcastRoomState(roomCode) {
        const room = rooms.get(roomCode);
        if (!room) return;

        const playersArr = Array.from(room.players.values());
        io.to(roomCode).emit('room_state_update', {
            id: room.id,
            status: room.status,
            players: playersArr,
            mode: room.mode,
            round: room.round,
            maxRounds: room.maxRounds,
        });
    }

    server.once('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
