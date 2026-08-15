const Deck = require('./Deck');
const HandEvaluator = require('./HandEvaluator');

class GameState {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = []; // Array of Player objects
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentHighestBet = 0;
        this.stage = 'WAITING'; // WAITING, PREFLOP, FLOP, TURN, RIVER, SHOWDOWN
        this.dealerIndex = 0;
        this.currentPlayerIndex = 0;
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.roundActions = 0;
        this.actionHistory = [];
    }

    addPlayer(player) {
        if (this.players.length < 9) {
            this.players.push(player);
            return true;
        }
        return false;
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }

    startNewHand() {
        // Remove players who have lost all their chips
        this.players = this.players.filter(p => p.chips > 0);

        if (this.players.length < 2) return false;
        
        this.stage = 'PREFLOP';
        this.deck.reset();
        this.deck.shuffle();
        this.communityCards = [];
        this.pot = 0;
        this.currentHighestBet = 0;
        this.roundActions = 0;
        this.actionHistory = ['--- PREFLOP ---'];

        this.players.forEach(p => p.resetForNewHand());

        // Deal hole cards
        for (let i = 0; i < 2; i++) {
            this.players.forEach(p => {
                p.holeCards.push(this.deck.draw());
            });
        }

        // Blinds
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        const sbIndex = (this.dealerIndex + 1) % this.players.length;
        const bbIndex = (this.dealerIndex + 2) % this.players.length;

        this.placeBet(this.players[sbIndex], this.smallBlind);
        this.placeBet(this.players[bbIndex], this.bigBlind);

        this.currentPlayerIndex = (this.dealerIndex + 3) % this.players.length;
        
        return true;
    }

    placeBet(player, amount) {
        const actualAmount = Math.min(amount, player.chips);
        player.chips -= actualAmount;
        player.currentBet += actualAmount;
        this.pot += actualAmount;
        
        if (player.currentBet > this.currentHighestBet) {
            this.currentHighestBet = player.currentBet;
        }

        if (player.chips === 0) {
            player.isAllIn = true;
        }
        return actualAmount;
    }

    handleAction(playerId, action, amount = 0) {
        const player = this.players[this.currentPlayerIndex];
        if (player.id !== playerId) return false; // not their turn

        if (action === 'FOLD') {
            player.hasFolded = true;
            this.actionHistory.push(`${player.name} Folds`);
        } else if (action === 'CALL') {
            const callAmount = this.currentHighestBet - player.currentBet;
            if (callAmount > 0) {
                this.placeBet(player, callAmount);
                this.actionHistory.push(`${player.name} Calls ${callAmount}`);
            }
        } else if (action === 'CHECK') {
            const callAmount = this.currentHighestBet - player.currentBet;
            if (callAmount > 0) return false; // Cannot check if facing a raise
            this.actionHistory.push(`${player.name} Checks`);
        } else if (action === 'RAISE') {
            const raiseAmount = amount;
            if (raiseAmount + player.currentBet <= this.currentHighestBet) {
                return false; // Invalid raise
            }
            this.placeBet(player, raiseAmount);
            this.actionHistory.push(`${player.name} Raises to ${player.currentBet}`);
        }

        this.roundActions++;
        this.advanceTurn();
        return true;
    }

    advanceTurn() {
        const nonFoldedPlayers = this.players.filter(p => !p.hasFolded);
        const activePlayers = nonFoldedPlayers.filter(p => !p.isAllIn);
        const playersNeedingToCall = nonFoldedPlayers.filter(p => p.currentBet < this.currentHighestBet && !p.isAllIn);

        // We move to next stage if:
        // 1. Only 1 player hasn't folded (everyone else folded)
        // OR
        // 2. No one needs to call AND everyone has had a chance to act
        const everyoneActed = this.roundActions >= nonFoldedPlayers.length;
        
        if (nonFoldedPlayers.length <= 1 || (playersNeedingToCall.length === 0 && everyoneActed)) {
            this.nextStage();
        } else {
            // Find next player
            do {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            } while (this.players[this.currentPlayerIndex].hasFolded || this.players[this.currentPlayerIndex].isAllIn);
        }
    }

    nextStage() {
        // Reset bets for new round
        this.players.forEach(p => p.currentBet = 0);
        this.currentHighestBet = 0;
        this.roundActions = 0;
        // actionHistory is kept for the whole hand, only reset in startNewHand

        if (this.players.filter(p => !p.hasFolded).length === 1) {
            this.stage = 'SHOWDOWN';
            this.resolveShowdown();
            return;
        }

        if (this.stage === 'PREFLOP') {
            this.stage = 'FLOP';
            this.communityCards = this.deck.drawMany(3);
            this.actionHistory.push('--- FLOP ---');
        } else if (this.stage === 'FLOP') {
            this.stage = 'TURN';
            this.communityCards.push(this.deck.draw());
            this.actionHistory.push('--- TURN ---');
        } else if (this.stage === 'TURN') {
            this.stage = 'RIVER';
            this.communityCards.push(this.deck.draw());
            this.actionHistory.push('--- RIVER ---');
        } else if (this.stage === 'RIVER') {
            this.stage = 'SHOWDOWN';
            this.resolveShowdown();
            return;
        }

        const activePlayers = this.players.filter(p => !p.hasFolded && !p.isAllIn);
        if (activePlayers.length <= 1) {
            // Fast-forward to showdown if no betting can occur
            this.nextStage();
            return;
        }

        this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
        // Skip folded/all-in players
        while (this.players[this.currentPlayerIndex].hasFolded || this.players[this.currentPlayerIndex].isAllIn) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        }
    }

    resolveShowdown() {
        const activePlayers = this.players.filter(p => !p.hasFolded);
        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            winner.chips += this.pot;
            winner.isWinner = true;
            this.actionHistory.push(`${winner.name} wins ${this.pot} (everyone else folded)`);
            return;
        }

        let bestScore = -1;
        let winners = [];

        activePlayers.forEach(p => {
            const hand = HandEvaluator.evaluate(p.holeCards, this.communityCards);
            p.handEvaluation = hand;
            if (hand.score > bestScore) {
                bestScore = hand.score;
                winners = [p];
            } else if (hand.score === bestScore) {
                winners.push(p);
            }
        });

        const splitAmount = Math.floor(this.pot / winners.length);
        winners.forEach(w => {
            w.chips += splitAmount;
            w.isWinner = true;
            this.actionHistory.push(`${w.name} wins ${splitAmount} with ${w.handEvaluation.name}`);
        });

        // Any remainder stays in pot or goes to first player after dealer (simplified: leave it or ignore it)
    }
}

module.exports = GameState;
