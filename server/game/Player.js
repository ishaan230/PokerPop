class Player {
    constructor(id, name, isAI = false, difficulty = 'MEDIUM') {
        this.id = id;
        this.name = name;
        this.isAI = isAI;
        this.difficulty = difficulty;
        this.chips = 1000;
        this.holeCards = [];
        this.currentBet = 0;
        this.hasFolded = false;
        this.isAllIn = false;
        this.socketId = null; // null for AI
        this.isAdmin = false;
        this.actedThisRound = false;
    }

    resetForNewHand() {
        this.holeCards = [];
        this.currentBet = 0;
        this.hasFolded = false;
        this.isAllIn = this.chips === 0;
        this.isWinner = false;
        this.actedThisRound = false;
    }
}

module.exports = Player;
