const test = require('node:test');
const assert = require('node:assert');
const HandEvaluator = require('./HandEvaluator');
const Card = require('./Card');

function makeHand(cardStrings) {
    return cardStrings.map(str => new Card(
        {'H': 'Hearts', 'D': 'Diamonds', 'C': 'Clubs', 'S': 'Spades'}[str[1]],
        str[0]
    ));
}

test('HandEvaluator tests', async (t) => {
    
    await t.test('Straight Flush', () => {
        const hole = makeHand(['AS', 'KS']);
        const comm = makeHand(['QS', 'JS', 'TS', '2H', '3D']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Straight Flush');
        assert.strictEqual(result.rank, 9);
    });

    await t.test('Low Straight Flush (Steel Wheel)', () => {
        const hole = makeHand(['5H', '4H']);
        const comm = makeHand(['3H', '2H', 'AH', 'TC', 'JD']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Straight Flush');
        assert.strictEqual(result.rank, 9);
    });

    await t.test('Four of a Kind', () => {
        const hole = makeHand(['8H', '8D']);
        const comm = makeHand(['8C', '8S', 'AH', '2H', '3D']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Four of a Kind');
        assert.strictEqual(result.rank, 8);
    });

    await t.test('Full House', () => {
        const hole = makeHand(['TH', 'TC']);
        const comm = makeHand(['TS', '9H', '9D', '2H', '3D']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Full House');
        assert.strictEqual(result.rank, 7);
    });

    await t.test('Flush', () => {
        const hole = makeHand(['2C', '5C']);
        const comm = makeHand(['JC', '8C', '4C', '2H', '3D']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Flush');
        assert.strictEqual(result.rank, 6);
    });

    await t.test('Straight', () => {
        const hole = makeHand(['7H', '8D']);
        const comm = makeHand(['9C', 'TS', 'JH', '2H', '3D']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Straight');
        assert.strictEqual(result.rank, 5);
    });

    await t.test('Low Straight (Wheel)', () => {
        const hole = makeHand(['5C', '4D']);
        const comm = makeHand(['3S', '2H', 'AS', 'TC', 'JD']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Straight');
        assert.strictEqual(result.rank, 5);
    });

    await t.test('Three of a Kind', () => {
        const hole = makeHand(['QH', 'QD']);
        const comm = makeHand(['QC', '2S', '4H', '6C', '8S']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Three of a Kind');
        assert.strictEqual(result.rank, 4);
    });

    await t.test('Two Pair', () => {
        const hole = makeHand(['JH', 'JD']);
        const comm = makeHand(['7C', '7S', '4H', '6C', '8S']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'Two Pair');
        assert.strictEqual(result.rank, 3);
    });

    await t.test('One Pair', () => {
        const hole = makeHand(['AH', 'AD']);
        const comm = makeHand(['2C', '5S', '7H', '9C', 'JS']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'One Pair');
        assert.strictEqual(result.rank, 2);
    });

    await t.test('High Card', () => {
        const hole = makeHand(['AH', 'JD']);
        const comm = makeHand(['2C', '5S', '7H', '9C', 'QS']);
        const result = HandEvaluator.evaluate(hole, comm);
        assert.strictEqual(result.name, 'High Card');
        assert.strictEqual(result.rank, 1);
    });

    await t.test('Compare Hands - Higher Pair Wins', () => {
        const comm = makeHand(['2C', '5S', '7H', '9C', 'QS']);
        const p1 = HandEvaluator.evaluate(makeHand(['AH', 'AD']), comm);
        const p2 = HandEvaluator.evaluate(makeHand(['KH', 'KD']), comm);
        assert.ok(p1.score > p2.score);
    });

    await t.test('Compare Hands - Same Pair, Higher Kicker Wins', () => {
        const comm = makeHand(['2C', '5S', '7H', '9C', 'QS']);
        // Both have a pair of Qs (from board + hole)
        const p1 = HandEvaluator.evaluate(makeHand(['AH', 'QD']), comm); // Pair of Q, Kicker A
        const p2 = HandEvaluator.evaluate(makeHand(['KH', 'QH']), comm); // Pair of Q, Kicker K
        assert.ok(p1.score > p2.score);
    });
});
