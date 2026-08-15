class HandEvaluator {
    // Evaluates the best 5-card hand out of 7 cards (2 hole + 5 community)
    // Returns an object: { rank: Number, name: String, score: Number, cards: [] }
    // Ranks: 9 = Straight Flush, 8 = Four of a Kind, 7 = Full House, 6 = Flush, 
    // 5 = Straight, 4 = Three of a Kind, 3 = Two Pair, 2 = One Pair, 1 = High Card
    
    static evaluate(holeCards, communityCards) {
        const allCards = [...holeCards, ...communityCards];
        if (allCards.length < 5) return null;

        // generate all 5-card combinations
        const combinations = HandEvaluator.getCombinations(allCards, 5);
        let bestHand = null;

        for (const combo of combinations) {
            const evaluated = HandEvaluator.evaluate5Cards(combo);
            if (!bestHand || evaluated.score > bestHand.score) {
                bestHand = evaluated;
            }
        }
        return bestHand;
    }

    static getCombinations(arr, size) {
        if (size === 1) return arr.map(e => [e]);
        const combinations = [];
        for (let i = 0; i <= arr.length - size; i++) {
            const head = arr.slice(i, i + 1);
            const tailCombs = HandEvaluator.getCombinations(arr.slice(i + 1), size - 1);
            for (const tailComb of tailCombs) {
                combinations.push([...head, ...tailComb]);
            }
        }
        return combinations;
    }

    static evaluate5Cards(cards) {
        // Sort by rank descending
        const sorted = [...cards].sort((a, b) => b.getNumericValue() - a.getNumericValue());
        
        const isFlush = sorted.every(c => c.suit === sorted[0].suit);
        
        let isStraight = true;
        for (let i = 1; i < 5; i++) {
            if (sorted[i-1].getNumericValue() - sorted[i].getNumericValue() !== 1) {
                isStraight = false;
                break;
            }
        }
        // Special case A-5-4-3-2
        if (!isStraight && sorted[0].rank === 'A' && sorted[1].rank === '5' && sorted[2].rank === '4' && sorted[3].rank === '3' && sorted[4].rank === '2') {
            isStraight = true;
            // move Ace to end for scoring
            sorted.push(sorted.shift()); 
        }

        const counts = {};
        for (const c of sorted) {
            counts[c.rank] = (counts[c.rank] || 0) + 1;
        }
        const freq = Object.values(counts).sort((a, b) => b - a);
        
        let rank = 1;
        let name = 'High Card';
        
        if (isFlush && isStraight) {
            rank = 9; name = 'Straight Flush';
        } else if (freq[0] === 4) {
            rank = 8; name = 'Four of a Kind';
        } else if (freq[0] === 3 && freq[1] === 2) {
            rank = 7; name = 'Full House';
        } else if (isFlush) {
            rank = 6; name = 'Flush';
        } else if (isStraight) {
            rank = 5; name = 'Straight';
        } else if (freq[0] === 3) {
            rank = 4; name = 'Three of a Kind';
        } else if (freq[0] === 2 && freq[1] === 2) {
            rank = 3; name = 'Two Pair';
        } else if (freq[0] === 2) {
            rank = 2; name = 'One Pair';
        }

        // Calculate a score to compare hands of the same rank
        let score = rank * 10000000000; // base score for the rank
        
        // Add card values to score.
        // We must sort by frequency first, then by value, to correctly score hands like Pairs.
        const scoreSorted = [...sorted].sort((a, b) => {
            if (counts[a.rank] !== counts[b.rank]) {
                return counts[b.rank] - counts[a.rank];
            }
            return b.getNumericValue() - a.getNumericValue();
        });

        for (let i = 0; i < 5; i++) {
            score += scoreSorted[i].getNumericValue() * Math.pow(15, 4 - i);
        }

        return { rank, name, score, cards: sorted };
    }
}

module.exports = HandEvaluator;
