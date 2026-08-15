import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface PlayerSession {
  id: string;
  ws: WebSocket;
  roomCode: string;
  playerIndex: number;
  lastPing: number;
  lastState?: any;
}

interface Room {
  code: string;
  players: Map<string, PlayerSession>;
  createdAt: number;
  audioState?: {
    trackIndex: number;
    isPlaying: boolean;
    currentTime: number;
    timestamp: number;
  };
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  app.get('/api/rooms', (req, res) => {
    const roomList = Array.from(rooms.values()).map(r => ({
      code: r.code,
      playerCount: r.players.size,
      createdAt: r.createdAt
    }));
    res.json({ rooms: roomList });
  });

  // WebSocket Server Setup
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const sessionId = 'p_' + Math.random().toString(36).substring(2, 9);
    let currentRoomCode: string | null = null;

    ws.on('message', (raw: string) => {
      try {
        const msg = JSON.parse(raw.toString());
        const { type, payload } = msg;

        switch (type) {
          case 'CREATE_ROOM': {
            let code = generateRoomCode();
            while (rooms.has(code)) {
              code = generateRoomCode();
            }

            const newRoom: Room = {
              code,
              players: new Map(),
              createdAt: Date.now()
            };

            const session: PlayerSession = {
              id: sessionId,
              ws,
              roomCode: code,
              playerIndex: 1,
              lastPing: Date.now()
            };

            newRoom.players.set(sessionId, session);
            rooms.set(code, newRoom);
            currentRoomCode = code;

            ws.send(JSON.stringify({
              type: 'ROOM_CREATED',
              payload: {
                roomCode: code,
                playerId: sessionId,
                playerIndex: 1,
                peers: []
              }
            }));
            break;
          }

          case 'JOIN_ROOM': {
            const reqCode = (payload?.roomCode || '').toUpperCase().trim();
            const targetRoom = rooms.get(reqCode);

            if (!targetRoom) {
              ws.send(JSON.stringify({
                type: 'ROOM_ERROR',
                payload: { message: `Room ${reqCode} not found` }
              }));
              return;
            }

            if (targetRoom.players.size >= 2) {
              ws.send(JSON.stringify({
                type: 'ROOM_ERROR',
                payload: { message: `Room ${reqCode} is already full (max 2 players)` }
              }));
              return;
            }

            // Assign Player 2
            const session: PlayerSession = {
              id: sessionId,
              ws,
              roomCode: reqCode,
              playerIndex: 2,
              lastPing: Date.now()
            };

            targetRoom.players.set(sessionId, session);
            currentRoomCode = reqCode;

            // List existing peers
            const existingPeers = Array.from(targetRoom.players.values())
              .filter(p => p.id !== sessionId)
              .map(p => ({ id: p.id, playerIndex: p.playerIndex, lastState: p.lastState }));

            // Notify joining player
            ws.send(JSON.stringify({
              type: 'ROOM_JOINED',
              payload: {
                roomCode: reqCode,
                playerId: sessionId,
                playerIndex: 2,
                peers: existingPeers,
                audioState: targetRoom.audioState
              }
            }));

            // Notify existing peer in room
            for (const [, peer] of targetRoom.players) {
              if (peer.id !== sessionId && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'PEER_JOINED',
                  payload: {
                    peerId: sessionId,
                    playerIndex: 2
                  }
                }));
              }
            }
            break;
          }

          case 'LEAVE_ROOM': {
            if (currentRoomCode) {
              const room = rooms.get(currentRoomCode);
              if (room) {
                room.players.delete(sessionId);
                for (const [, peer] of room.players) {
                  if (peer.ws.readyState === WebSocket.OPEN) {
                    peer.ws.send(JSON.stringify({
                      type: 'PEER_LEFT',
                      payload: { peerId: sessionId }
                    }));
                  }
                }
                if (room.players.size === 0) {
                  rooms.delete(currentRoomCode);
                }
              }
              currentRoomCode = null;
            }
            ws.send(JSON.stringify({ type: 'ROOM_LEFT' }));
            break;
          }

          case 'PLAYER_STATE': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const mySession = room.players.get(sessionId);
            if (mySession) {
              mySession.lastState = payload;
            }

            // Relay state to other player in room immediately with zero delay
            for (const [, peer] of room.players) {
              if (peer.id !== sessionId && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'PEER_STATE',
                  payload: {
                    peerId: sessionId,
                    playerIndex: mySession?.playerIndex || 1,
                    state: payload,
                    timestamp: Date.now()
                  }
                }));
              }
            }
            break;
          }

          case 'SIGNAL': {
            // WebRTC signaling relay (offer/answer/ice-candidate)
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            for (const [, peer] of room.players) {
              if (peer.id !== sessionId && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'SIGNAL',
                  payload: {
                    from: sessionId,
                    data: payload
                  }
                }));
              }
            }
            break;
          }

          case 'AUDIO_SYNC': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            // Cache latest room audio state
            room.audioState = {
              trackIndex: payload.trackIndex ?? 0,
              isPlaying: payload.isPlaying ?? false,
              currentTime: payload.currentTime ?? 0,
              timestamp: Date.now()
            };

            // Relay audio sync packet to all other peers in room
            for (const [, peer] of room.players) {
              if (peer.id !== sessionId && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'AUDIO_SYNC',
                  payload: {
                    from: sessionId,
                    ...payload,
                    serverTimestamp: Date.now()
                  }
                }));
              }
            }
            break;
          }

          case 'PING': {
            ws.send(JSON.stringify({
              type: 'PONG',
              payload: { clientTimestamp: payload?.timestamp, serverTimestamp: Date.now() }
            }));
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(sessionId);
          for (const [, peer] of room.players) {
            if (peer.ws.readyState === WebSocket.OPEN) {
              peer.ws.send(JSON.stringify({
                type: 'PEER_LEFT',
                payload: { peerId: sessionId }
              }));
            }
          }
          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          }
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MILES Game Server running on port ${PORT}`);
  });
}

startServer();
