class AIPlayer {
    static decideAction(player, gameState) {
        // difficulty: 'EASY', 'MEDIUM', 'HARD'
        const callAmount = gameState.currentHighestBet - player.currentBet;
        const potOdds = callAmount / (gameState.pot + callAmount);
        
        let rand = Math.random();
        
        // Simple heuristic for now
        // In a real game, this would evaluate the hand strength and compare with potOdds.
        if (player.difficulty === 'EASY') {
            if (rand < 0.2) return { action: 'FOLD' };
            if (rand < 0.8) return { action: 'CALL' };
            return { action: 'RAISE', amount: gameState.currentHighestBet * 2 || gameState.bigBlind * 2 };
        } else if (player.difficulty === 'MEDIUM') {
            if (rand < 0.3) return { action: 'FOLD' };
            if (rand < 0.7) return { action: 'CALL' };
            return { action: 'RAISE', amount: gameState.currentHighestBet * 2 || gameState.bigBlind * 2 };
        } else { // HARD
            if (rand < 0.4) return { action: 'FOLD' };
            if (rand < 0.8) return { action: 'CALL' };
            return { action: 'RAISE', amount: gameState.currentHighestBet * 2 || gameState.bigBlind * 2 };
        }
    }
}

module.exports = AIPlayer;
