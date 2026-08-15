import React from 'react';
import Card from './Card';
import './HelpModal.css';

const HandRow = ({ num, title, cards }) => {
  return (
    <div className="hand-row">
      <div className="hand-title">{num} • {title}</div>
      <div className="hand-cards">
        {cards.map((c, i) => (
          <div key={i} className={`card-wrapper ${c.dim ? 'dimmed' : ''}`}>
            <Card suit={c.suit} rank={c.rank} />
          </div>
        ))}
      </div>
    </div>
  );
};

const HelpModal = ({ onClose }) => {
  const rankings = [
    {
      num: 1, title: 'ROYAL FLUSH',
      cards: [
        { suit: 'Hearts', rank: 'A' },
        { suit: 'Hearts', rank: 'K' },
        { suit: 'Hearts', rank: 'Q' },
        { suit: 'Hearts', rank: 'J' },
        { suit: 'Hearts', rank: '10' }
      ]
    },
    {
      num: 2, title: 'STRAIGHT FLUSH',
      cards: [
        { suit: 'Hearts', rank: '10' },
        { suit: 'Hearts', rank: '9' },
        { suit: 'Hearts', rank: '8' },
        { suit: 'Hearts', rank: '7' },
        { suit: 'Hearts', rank: '6' }
      ]
    },
    {
      num: 3, title: 'FOUR OF A KIND',
      cards: [
        { suit: 'Hearts', rank: 'A' },
        { suit: 'Clubs', rank: 'A' },
        { suit: 'Diamonds', rank: 'A' },
        { suit: 'Spades', rank: 'A' },
        { suit: 'Hearts', rank: 'K', dim: true }
      ]
    },
    {
      num: 4, title: 'FULL HOUSE',
      cards: [
        { suit: 'Hearts', rank: 'A' },
        { suit: 'Clubs', rank: 'A' },
        { suit: 'Diamonds', rank: 'A' },
        { suit: 'Spades', rank: 'K' },
        { suit: 'Hearts', rank: 'K' }
      ]
    },
    {
      num: 5, title: 'FLUSH',
      cards: [
        { suit: 'Clubs', rank: 'K' },
        { suit: 'Clubs', rank: '10' },
        { suit: 'Clubs', rank: '8' },
        { suit: 'Clubs', rank: '7' },
        { suit: 'Clubs', rank: '5' }
      ]
    },
    {
      num: 6, title: 'STRAIGHT',
      cards: [
        { suit: 'Hearts', rank: '10' },
        { suit: 'Clubs', rank: '9' },
        { suit: 'Diamonds', rank: '8' },
        { suit: 'Spades', rank: '7' },
        { suit: 'Hearts', rank: '6' }
      ]
    },
    {
      num: 7, title: 'THREE OF A KIND',
      cards: [
        { suit: 'Hearts', rank: 'A' },
        { suit: 'Diamonds', rank: 'A' },
        { suit: 'Clubs', rank: 'A' },
        { suit: 'Spades', rank: 'K', dim: true },
        { suit: 'Hearts', rank: 'Q', dim: true }
      ]
    },
    {
      num: 8, title: 'TWO PAIR',
      cards: [
        { suit: 'Hearts', rank: 'A' },
        { suit: 'Clubs', rank: 'A' },
        { suit: 'Diamonds', rank: 'K' },
        { suit: 'Spades', rank: 'K' },
        { suit: 'Hearts', rank: '7', dim: true }
      ]
    },
    {
      num: 9, title: 'PAIR',
      cards: [
        { suit: 'Hearts', rank: 'A' },
        { suit: 'Clubs', rank: 'A' },
        { suit: 'Diamonds', rank: 'K', dim: true },
        { suit: 'Spades', rank: 'J', dim: true },
        { suit: 'Hearts', rank: '7', dim: true }
      ]
    },
    {
      num: 10, title: 'HIGH CARD',
      cards: [
        { suit: 'Hearts', rank: 'A' },
        { suit: 'Clubs', rank: 'K', dim: true },
        { suit: 'Diamonds', rank: 'Q', dim: true },
        { suit: 'Spades', rank: '9', dim: true },
        { suit: 'Hearts', rank: '7', dim: true }
      ]
    }
  ];

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-container" onClick={e => e.stopPropagation()}>
        
        <button className="help-modal-close" onClick={onClose}>×</button>
        
        <div className="help-modal-header">
          <div className="header-line"></div>
          <h2>POKER HAND RANKINGS</h2>
          <div className="header-line"></div>
        </div>

        <div className="help-modal-grid">
          {rankings.map(r => (
            <HandRow key={r.num} num={r.num} title={r.title} cards={r.cards} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default HelpModal;
