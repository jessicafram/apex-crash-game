import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface GameState {
    multiplier: number;
    status: 'LOADING' | 'BETTING_PHASE' | 'IN_PROGRESS' | 'CRASHED';
    roundId: string | null;
    message: string;
    serverSeed: string | null;
    socket: Socket | null;
    connectSocket: () => void;
}

// Colocamos o "set: any" aqui
export const useGameStore = create<GameState>((set: any) => ({
    multiplier: 1.0,
    status: 'LOADING',
    roundId: null,
    message: 'Conectando ao cassino...',
    serverSeed: null,
    socket: null,

    connectSocket: () => {
        const socket = io('http://localhost:4001');

        socket.on('connect', () => console.log('📻 Sintonizado na rádio do Cassino!'));

        // Colocamos "data: any" em todos os ouvintes!
        socket.on('game:betting_phase', (data: any) => {
            set({ status: 'BETTING_PHASE', roundId: data.roundId, multiplier: 1.0, message: 'Apostas Abertas!', serverSeed: null });
        });

        socket.on('game:tick', (data: any) => {
            set({ status: 'IN_PROGRESS', multiplier: Number(data.multiplier), message: '🚀 Subindo!' });
        });

        socket.on('game:crash', (data: any) => {
            set({ status: 'CRASHED', multiplier: Number(data.multiplier), message: `💥 CRASHOU NO ${data.multiplier}x!`, serverSeed: data.serverSeed });
        });

        set({ socket });
    },
}));