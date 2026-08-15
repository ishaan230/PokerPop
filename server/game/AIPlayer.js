const HandEvaluator = require('./HandEvaluator');

class AIPlayer {
    static decideAction(player, gameState) {
        const callAmount = gameState.currentHighestBet - player.currentBet;
        const pot = gameState.pot;
        const potOdds = callAmount / (pot + callAmount) || 0; // percentage of pot to call

        // Calculate Hand Strength (0.0 to 1.0)
        let strength = 0;
        
        if (gameState.stage === 'PREFLOP') {
            strength = this.evaluatePreflop(player.holeCards);
        } else {
            strength = this.evaluatePostflop(player.holeCards, gameState.communityCards);
        }

        const rand = Math.random();
        let bluffChance = 0;
        let callThreshold = potOdds; 
        
        // Difficulty adjustments
        if (player.difficulty === 'EASY') {
            // Easy is loose, calls often even with bad odds, bluffs erratically
            callThreshold = potOdds * 0.5; // Needs half the strength normally required
            bluffChance = 0.3; // 30% chance to randomly bluff on bad hands
        } else if (player.difficulty === 'MEDIUM') {
            callThreshold = potOdds * 1.2; // Fairly standard
            bluffChance = 0.15;
        } else { // HARD
            // Hard is tight but aggressive when strong, bluffs smart
            callThreshold = potOdds * 1.5; // Only calls if hand is very strong relative to odds
            bluffChance = 0.2; // 20% bluff chance
        }

        // --- Bluff Mechanic ---
        // If strength is terrible (<= 0.3) but we roll a bluff, pretend strength is very high (0.8+)
        if (strength <= 0.3 && rand < bluffChance) {
            strength = 0.8 + (Math.random() * 0.2); // Fake a great hand
        }

        // --- Decision Logic ---
        const canCheck = callAmount === 0;

        if (strength < callThreshold) {
            // Hand is not strong enough to call
            if (canCheck) return { action: 'CHECK' };
            
            // Random chance to call anyway if EASY (they play dumb)
            if (player.difficulty === 'EASY' && Math.random() < 0.2) return { action: 'CALL' };
            
            return { action: 'FOLD' };
        }

        // Hand is strong enough to play
        // If it's extremely strong relative to odds, or a bluff, raise
        const raiseThreshold = callThreshold + (player.difficulty === 'HARD' ? 0.2 : 0.4);

        if (strength >= raiseThreshold) {
            // Determine raise amount
            let raiseAmount = gameState.currentHighestBet * 2 || gameState.bigBlind * 2;
            
            // Hard bots might raise more
            if (player.difficulty === 'HARD' && strength >= 0.9) {
                raiseAmount = Math.floor(pot * 0.8); // Pot size bet
            }
            
            // Clamp raise to chips
            const maxRaise = player.chips + player.currentBet;
            raiseAmount = Math.min(Math.max(raiseAmount, gameState.bigBlind * 2), maxRaise);

            if (raiseAmount > callAmount) {
                return { action: 'RAISE', amount: raiseAmount };
            } else {
                return { action: 'CALL' }; // Not enough chips to legally raise, so just call/all-in
            }
        }

        return { action: canCheck ? 'CHECK' : 'CALL' };
    }

    static evaluatePreflop(holeCards) {
        if (!holeCards || holeCards.length < 2) return 0;
        const val1 = holeCards[0].getNumericValue(); // 2-14
        const val2 = holeCards[1].getNumericValue();
        
        const isPair = val1 === val2;
        const isSuited = holeCards[0].suit === holeCards[1].suit;
        
        const highVal = Math.max(val1, val2);
        const lowVal = Math.min(val1, val2);
        
        let score = 0;
        
        // Base score off high card (A=14 -> ~0.3)
        score += highVal * 0.02;
        score += lowVal * 0.01;
        
        if (isPair) {
            score += 0.3; // Pairs are great
            if (val1 >= 10) score += 0.2; // High pairs are amazing
        }
        
        if (isSuited) score += 0.1;
        
        // Connectors (e.g. 10, J)
        if (highVal - lowVal === 1) score += 0.1;
        
        // Normalize between 0 and 1
        return Math.min(score, 1.0);
    }

    static evaluatePostflop(holeCards, communityCards) {
        if (!holeCards || !communityCards || holeCards.length + communityCards.length < 5) return 0;
        
        const hand = HandEvaluator.evaluate(holeCards, communityCards);
        if (!hand) return 0;

        // hand.rank goes from 1 (High Card) to 9 (Straight Flush)
        // A rank of 2 (Pair) is okay, 3 (Two Pair) is good, 4+ is great
        
        let score = (hand.rank - 1) / 8; // Normalizes rank 1-9 to 0.0-1.0
        
        // Boost slightly if they have a very high pair vs a low pair
        // (Since rank alone doesn't distinguish AA vs 22 in score normalization easily)
        if (hand.rank === 2) {
             const pairValue = hand.cards[0].getNumericValue();
             score += (pairValue / 14) * 0.1; 
        }

        return Math.min(score, 1.0);
    }
}

module.exports = AIPlayer;
