const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const GameState = require('./game/GameState');
const Player = require('./game/Player');
const AIPlayer = require('./game/AIPlayer');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // For local dev
        methods: ['GET', 'POST']
    }
});

const games = {}; // roomId -> GameState

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', ({ roomId, playerName }) => {
        socket.join(roomId);
        let isFirstPlayer = false;
        if (!games[roomId]) {
            games[roomId] = new GameState(roomId);
            isFirstPlayer = true;
        } else if (games[roomId].players.length === 0) {
            isFirstPlayer = true;
        }

        const game = games[roomId];
        const newPlayer = new Player(socket.id, playerName);
        newPlayer.socketId = socket.id;
        if (isFirstPlayer) newPlayer.isAdmin = true;
        
        game.addPlayer(newPlayer);
        
        broadcastGameState(game);
    });

    socket.on('addAIBots', ({ roomId, count, difficulty }) => {
        const game = games[roomId];
        if (game) {
            const player = game.players.find(p => p.id === socket.id);
            if (player && player.isAdmin) {
                for (let i = 0; i < count; i++) {
                    const aiId = `AI_${Math.floor(Math.random()*10000)}`;
                    const ai = new Player(aiId, `AI Bot ${game.players.length}`, true, difficulty);
                    ai.chips = game.players[0].chips; // Match starting chips
                    game.addPlayer(ai);
                }
                broadcastGameState(game);
            }
        }
    });

    socket.on('updateStartingChips', ({ roomId, amount }) => {
        const game = games[roomId];
        if (game && game.stage === 'WAITING') {
            const player = game.players.find(p => p.id === socket.id);
            if (player && player.isAdmin) {
                game.players.forEach(p => p.chips = amount);
                broadcastGameState(game);
            }
        }
    });

    socket.on('startGame', ({ roomId }) => {
        const game = games[roomId];
        if (game) {
            game.startNewHand();
            broadcastGameState(game);
            checkAITurn(game, roomId);
        }
    });

    socket.on('playerAction', ({ roomId, action, amount }) => {
        const game = games[roomId];
        if (game) {
            const success = game.handleAction(socket.id, action, amount);
            if (success) {
                broadcastGameState(game);
                checkAITurn(game, roomId);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Find which room they were in and remove them
        for (const roomId in games) {
            const game = games[roomId];
            game.removePlayer(socket.id);
            if (game.players.length === 0) {
                delete games[roomId];
            } else {
                broadcastGameState(game);
            }
        }
    });
});

function checkAITurn(game, roomId) {
    if (game.stage === 'SHOWDOWN' || game.stage === 'WAITING') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isAI && !currentPlayer.hasFolded && !currentPlayer.isAllIn) {
        // Delay AI action for realism
        setTimeout(() => {
            const decision = AIPlayer.decideAction(currentPlayer, game);
            game.handleAction(currentPlayer.id, decision.action, decision.amount);
            broadcastGameState(game);
            checkAITurn(game, roomId); // check if next is also AI
        }, 1500);
    }
}

function broadcastGameState(game) {
    game.players.forEach(p => {
        if (!p.isAI && p.socketId) {
            io.to(p.socketId).emit('gameStateUpdate', getPersonalizedGameState(game, p.id));
        }
    });
}

function getPersonalizedGameState(game, playerId) {
    return {
        roomId: game.roomId,
        stage: game.stage,
        pot: game.pot,
        currentHighestBet: game.currentHighestBet,
        communityCards: game.communityCards,
        currentPlayerIndex: game.currentPlayerIndex,
        actionHistory: game.actionHistory,
        players: game.players.map(p => ({
            id: p.id,
            name: p.name,
            chips: p.chips,
            currentBet: p.currentBet,
            hasFolded: p.hasFolded,
            isAllIn: p.isAllIn,
            isAI: p.isAI,
            isAdmin: p.isAdmin,
            isWinner: p.isWinner,
            // Only reveal hole cards if showdown or it's the current player
            holeCards: (game.stage === 'SHOWDOWN' && !p.hasFolded) || p.id === playerId ? p.holeCards : (p.holeCards.length > 0 ? [{suit:'Hidden', rank: '?'}, {suit:'Hidden', rank:'?'}] : []),
            handEvaluation: (game.stage === 'SHOWDOWN' && !p.hasFolded) ? p.handEvaluation : null
        }))
    };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
