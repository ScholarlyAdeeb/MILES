import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const NetworkContext = createContext(null);

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return ctx;
}

export function NetworkProvider({ children }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(1); // 1 = Host, 2 = Guest
  const [remotePeer, setRemotePeer] = useState(null); // { id, playerIndex, lastState, lastSeen }
  const [pingMs, setPingMs] = useState(18);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [incomingAudioSync, setIncomingAudioSync] = useState(null);

  const wsRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const rtcPeerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const lastBroadcastTimeRef = useRef(0);
  const latestLocalStateRef = useRef(null);
  const audioSyncListenersRef = useRef(new Set());

  const onAudioSync = useCallback((callback) => {
    audioSyncListenersRef.current.add(callback);
    return () => {
      audioSyncListenersRef.current.delete(callback);
    };
  }, []);

  const triggerAudioSyncCallbacks = useCallback((syncData) => {
    setIncomingAudioSync(syncData);
    audioSyncListenersRef.current.forEach((cb) => {
      try {
        cb(syncData);
      } catch (e) {
        console.error('Audio sync callback error:', e);
      }
    });
  }, []);

  // Initialize BroadcastChannel for instant local cross-tab sync
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('miles_urban_traversal_net');
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, payload, senderId, room } = event.data || {};
        if (senderId === playerId) return; // Ignore own messages

        if (room && roomCode && room === roomCode) {
          if (type === 'PEER_STATE') {
            setRemotePeer((prev) => ({
              id: senderId,
              playerIndex: payload.playerIndex || (playerIndex === 1 ? 2 : 1),
              state: payload.state,
              lastSeen: Date.now()
            }));
          } else if (type === 'PEER_JOINED') {
            setRemotePeer({
              id: senderId,
              playerIndex: 2,
              lastSeen: Date.now()
            });
          } else if (type === 'PEER_LEFT') {
            setRemotePeer(null);
          } else if (type === 'AUDIO_SYNC') {
            triggerAudioSyncCallbacks({
              ...payload,
              from: senderId,
              timestamp: payload.timestamp || Date.now()
            });
          }
        }
      };

      return () => {
        bc.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment');
    }
  }, [playerId, roomCode, playerIndex, triggerAudioSyncCallbacks]);

  // Connect to WebSocket Game Server
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        setErrorMessage(null);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;

          switch (type) {
            case 'ROOM_CREATED':
              setRoomCode(payload.roomCode);
              setPlayerId(payload.playerId);
              setPlayerIndex(payload.playerIndex || 1);
              setRemotePeer(null);
              setErrorMessage(null);
              break;

            case 'ROOM_JOINED':
              setRoomCode(payload.roomCode);
              setPlayerId(payload.playerId);
              setPlayerIndex(payload.playerIndex || 2);
              if (payload.peers && payload.peers.length > 0) {
                const firstPeer = payload.peers[0];
                setRemotePeer({
                  id: firstPeer.id,
                  playerIndex: firstPeer.playerIndex,
                  state: firstPeer.lastState,
                  lastSeen: Date.now()
                });
              }
              if (payload.audioState) {
                triggerAudioSyncCallbacks({
                  ...payload.audioState,
                  from: 'SERVER_JOIN',
                  timestamp: payload.audioState.timestamp || Date.now()
                });
              }
              setErrorMessage(null);
              break;

            case 'PEER_JOINED':
              setRemotePeer({
                id: payload.peerId,
                playerIndex: payload.playerIndex,
                lastSeen: Date.now()
              });
              break;

            case 'PEER_LEFT':
              setRemotePeer(null);
              break;

            case 'PEER_STATE':
              setRemotePeer((prev) => ({
                ...(prev || {}),
                id: payload.peerId,
                playerIndex: payload.playerIndex,
                state: payload.state,
                lastSeen: Date.now()
              }));
              break;

            case 'AUDIO_SYNC':
              triggerAudioSyncCallbacks({
                ...payload,
                timestamp: payload.timestamp || payload.serverTimestamp || Date.now()
              });
              break;

            case 'ROOM_ERROR':
              setErrorMessage(payload.message || 'Room error occurred');
              break;

            case 'PONG':
              if (payload.clientTimestamp) {
                const latency = Math.max(4, Math.round((Date.now() - payload.clientTimestamp) / 2));
                setPingMs(latency);
              }
              break;
          }
        } catch (e) {
          console.error('Failed to parse network message:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error, falling back to local channel:', err);
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
      };
    } catch (err) {
      console.warn('WebSocket initialization failed:', err);
    }
  }, []);

  // Periodic Ping for RTT measurement
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomCode) {
        wsRef.current.send(JSON.stringify({
          type: 'PING',
          payload: { timestamp: Date.now() }
        }));
      }
    }, 3000);
    return () => clearInterval(pingInterval);
  }, [roomCode]);

  // Create Room action
  const createRoom = useCallback(() => {
    setErrorMessage(null);
    connectWebSocket();

    // Auto-generate code locally as well in case WebSocket connects asynchronously
    const generatedCode = 'ML-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const pid = 'p_' + Math.random().toString(36).substring(2, 8);

    setRoomCode(generatedCode);
    setPlayerId(pid);
    setPlayerIndex(1);
    setRemotePeer(null);

    const trySendCreate = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'CREATE_ROOM',
          payload: {}
        }));
      }
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      trySendCreate();
    } else {
      setTimeout(trySendCreate, 300);
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'ROOM_ANNOUNCE',
        room: generatedCode,
        senderId: pid
      });
    }
  }, [connectWebSocket]);

  // Join Room action
  const joinRoom = useCallback((codeToJoin) => {
    if (!codeToJoin || typeof codeToJoin !== 'string') return;
    const cleanCode = codeToJoin.trim().toUpperCase();
    setErrorMessage(null);
    connectWebSocket();

    const pid = 'p_' + Math.random().toString(36).substring(2, 8);
    setRoomCode(cleanCode);
    setPlayerId(pid);
    setPlayerIndex(2);

    const trySendJoin = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'JOIN_ROOM',
          payload: { roomCode: cleanCode }
        }));
      }
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      trySendJoin();
    } else {
      setTimeout(trySendJoin, 300);
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PEER_JOINED',
        room: cleanCode,
        senderId: pid
      });
    }
  }, [connectWebSocket]);

  // Leave Room action
  const leaveRoom = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }

    if (broadcastChannelRef.current && roomCode) {
      broadcastChannelRef.current.postMessage({
        type: 'PEER_LEFT',
        room: roomCode,
        senderId: playerId
      });
    }

    setRoomCode(null);
    setRemotePeer(null);
    setErrorMessage(null);
  }, [roomCode, playerId]);

  // Send local player state (throttled to ~40Hz)
  const broadcastLocalState = useCallback((statePayload) => {
    if (!roomCode) return;
    latestLocalStateRef.current = statePayload;

    const now = performance.now();
    if (now - lastBroadcastTimeRef.current < 25) { // 40Hz cap
      return;
    }
    lastBroadcastTimeRef.current = now;

    const packet = {
      ...statePayload,
      timestamp: Date.now()
    };

    // Send over WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PLAYER_STATE',
        payload: packet
      }));
    }

    // Send over BroadcastChannel for instant local tab sync
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PEER_STATE',
        room: roomCode,
        senderId: playerId,
        payload: {
          playerIndex,
          state: packet
        }
      });
    }
  }, [roomCode, playerId, playerIndex]);

  // Broadcast audio synchronization event to other peer
  const broadcastAudioSync = useCallback((audioPayload) => {
    if (!roomCode) return;

    const packet = {
      ...audioPayload,
      from: playerId,
      timestamp: Date.now()
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'AUDIO_SYNC',
        payload: packet
      }));
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'AUDIO_SYNC',
        room: roomCode,
        senderId: playerId,
        payload: packet
      });
    }
  }, [roomCode, playerId]);

  // Check URL query parameters for auto-join link (?room=XYZ)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room') || params.get('join');
      if (urlRoom && !roomCode) {
        joinRoom(urlRoom);
      }
    } catch (e) {}
  }, [joinRoom, roomCode]);

  const value = {
    connectionStatus,
    roomCode,
    playerId,
    playerIndex,
    remotePeer,
    pingMs,
    errorMessage,
    isRoomModalOpen,
    incomingAudioSync,
    setIsRoomModalOpen,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastLocalState,
    broadcastAudioSync,
    onAudioSync
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}
